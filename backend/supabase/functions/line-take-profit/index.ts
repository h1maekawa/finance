import { createClient } from 'npm:@supabase/supabase-js@2'

type InvestmentAssetRow = {
  id: string
  household_id: string
  name: string
  ticker: string
  quantity: number
  take_profit_price: number
  last_notified_at: string | null
}

type HouseholdMemberRow = {
  household_id: string
  user_id: string
}

type ChannelRow = {
  user_id: string
  line_user_id: string
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const ALPHA_VANTAGE_API_KEY = Deno.env.get('ALPHA_VANTAGE_API_KEY')
const FINNHUB_API_KEY = Deno.env.get('FINNHUB_API_KEY')
const LINE_CHANNEL_ACCESS_TOKEN = Deno.env.get('LINE_CHANNEL_ACCESS_TOKEN')
const CRON_SECRET = Deno.env.get('CRON_SECRET')

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
}
if (!LINE_CHANNEL_ACCESS_TOKEN) {
  throw new Error('Missing LINE_CHANNEL_ACCESS_TOKEN')
}
if (!ALPHA_VANTAGE_API_KEY && !FINNHUB_API_KEY) {
  throw new Error('Missing ALPHA_VANTAGE_API_KEY and FINNHUB_API_KEY')
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

function normalizeTicker(ticker: string) {
  return ticker.trim().toUpperCase()
}

function isCooldownPassed(lastNotifiedAt: string | null) {
  if (!lastNotifiedAt) return true
  const elapsed = Date.now() - new Date(lastNotifiedAt).getTime()
  return elapsed >= 12 * 60 * 60 * 1000
}

async function fetchQuotePrice(ticker: string): Promise<number> {
  if (FINNHUB_API_KEY) {
    const url = `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(ticker)}&token=${FINNHUB_API_KEY}`
    const response = await fetch(url)
    if (!response.ok) throw new Error(`finnhub HTTP ${response.status}`)
    const json = await response.json() as { c?: number }
    const price = Number(json.c ?? 0)
    if (!Number.isFinite(price) || price <= 0) throw new Error('invalid finnhub quote')
    return price
  }

  const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(ticker)}&apikey=${ALPHA_VANTAGE_API_KEY}`
  const response = await fetch(url)
  if (!response.ok) throw new Error(`alphavantage HTTP ${response.status}`)
  const json = await response.json() as {
    'Global Quote'?: {
      '05. price'?: string
    }
  }
  const price = Number(json['Global Quote']?.['05. price'] ?? 0)
  if (!Number.isFinite(price) || price <= 0) throw new Error('invalid alphavantage quote')
  return price
}

async function pushLineMessage(lineUserId: string, text: string) {
  const response = await fetch('https://api.line.me/v2/bot/message/push', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to: lineUserId,
      messages: [{ type: 'text', text }],
    }),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`LINE push failed: ${response.status} ${body}`)
  }
}

Deno.serve(async (req) => {
  try {
    if (CRON_SECRET) {
      const token = req.headers.get('x-cron-secret')
      if (token !== CRON_SECRET) {
        return new Response(JSON.stringify({ error: 'unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        })
      }
    }

    const { data: assets, error: assetsError } = await supabase
      .from('investment_assets')
      .select('id, household_id, name, ticker, quantity, take_profit_price, last_notified_at')
      .eq('asset_type', '個別株')
      .eq('notify_take_profit', true)
      .not('ticker', 'is', null)
      .not('take_profit_price', 'is', null)

    if (assetsError) throw assetsError

    const filteredAssets = ((assets ?? []) as InvestmentAssetRow[])
      .map((asset) => ({
        ...asset,
        ticker: normalizeTicker(asset.ticker),
        quantity: Number(asset.quantity ?? 0),
        take_profit_price: Number(asset.take_profit_price ?? 0),
      }))
      .filter((asset) => asset.ticker && asset.take_profit_price > 0 && asset.quantity >= 0 && isCooldownPassed(asset.last_notified_at))

    if (filteredAssets.length === 0) {
      return new Response(JSON.stringify({ processed: 0, sent: 0 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const householdIds = Array.from(new Set(filteredAssets.map((asset) => asset.household_id)))

    const { data: members, error: membersError } = await supabase
      .from('household_members')
      .select('household_id, user_id')
      .in('household_id', householdIds)
      .eq('is_active', true)

    if (membersError) throw membersError

    const memberRows = (members ?? []) as HouseholdMemberRow[]
    const userIds = Array.from(new Set(memberRows.map((m) => m.user_id)))

    if (userIds.length === 0) {
      return new Response(JSON.stringify({ processed: filteredAssets.length, sent: 0 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const { data: channels, error: channelsError } = await supabase
      .from('user_notification_channels')
      .select('user_id, line_user_id')
      .in('user_id', userIds)
      .eq('provider', 'line')
      .eq('is_active', true)

    if (channelsError) throw channelsError

    const channelByUserId = new Map<string, string>()
    for (const row of (channels ?? []) as ChannelRow[]) {
      channelByUserId.set(row.user_id, row.line_user_id)
    }

    const memberByHousehold = new Map<string, string[]>()
    for (const member of memberRows) {
      const list = memberByHousehold.get(member.household_id) ?? []
      list.push(member.user_id)
      memberByHousehold.set(member.household_id, list)
    }

    const uniqueTickers = Array.from(new Set(filteredAssets.map((asset) => asset.ticker)))
    const quoteMap = new Map<string, number>()
    for (const ticker of uniqueTickers) {
      try {
        const quote = await fetchQuotePrice(ticker)
        quoteMap.set(ticker, quote)
      } catch {
        // skip ticker when quote provider fails
      }
    }

    let sent = 0
    for (const asset of filteredAssets) {
      const quote = quoteMap.get(asset.ticker)
      if (!quote) continue
      if (quote < asset.take_profit_price) continue

      const users = memberByHousehold.get(asset.household_id) ?? []
      if (users.length === 0) continue

      for (const userId of users) {
        const lineUserId = channelByUserId.get(userId)
        if (!lineUserId) continue

        const message = `利確候補: ${asset.name} (${asset.ticker})\n現在値 ${quote.toLocaleString()}\n目標 ${asset.take_profit_price.toLocaleString()}`

        try {
          await pushLineMessage(lineUserId, message)
          sent += 1
          await supabase.from('notification_logs').insert({
            user_id: userId,
            household_id: asset.household_id,
            investment_asset_id: asset.id,
            provider: 'line',
            status: 'sent',
            message,
            payload: { ticker: asset.ticker, price: quote, threshold: asset.take_profit_price },
          })
        } catch (error) {
          await supabase.from('notification_logs').insert({
            user_id: userId,
            household_id: asset.household_id,
            investment_asset_id: asset.id,
            provider: 'line',
            status: 'failed',
            message,
            payload: { ticker: asset.ticker, price: quote, threshold: asset.take_profit_price },
            error_message: error instanceof Error ? error.message : 'line push error',
          })
        }
      }

      await supabase
        .from('investment_assets')
        .update({ last_notified_at: new Date().toISOString() })
        .eq('id', asset.id)
    }

    return new Response(JSON.stringify({ processed: filteredAssets.length, sent }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'unknown error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }
})
