import { createClient } from 'npm:@supabase/supabase-js@2'

type InvestmentRow = {
  id: string
  user_id: string
  type: 'stock' | 'fund'
  symbol: string
  quantity: number
  average_price: number
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')
const ALPHA_KEY = Deno.env.get('ALPHA_KEY')

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_ANON_KEY')
}
if (!ALPHA_KEY) {
  throw new Error('Missing ALPHA_KEY')
}

function normalizeSymbol(symbol: string) {
  return symbol.trim().toUpperCase()
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function fetchQuote(symbol: string): Promise<number> {
  const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(symbol)}&apikey=${ALPHA_KEY}`
  const response = await fetch(url)
  if (!response.ok) throw new Error(`HTTP ${response.status}`)

  const json = await response.json() as {
    'Global Quote'?: {
      '05. price'?: string
    }
    Note?: string
  }

  if (json.Note) {
    throw new Error('Alpha Vantage rate limit reached')
  }

  const price = Number(json['Global Quote']?.['05. price'] ?? 0)
  if (!Number.isFinite(price) || price <= 0) {
    throw new Error(`Invalid quote for ${symbol}`)
  }

  return price
}

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'method_not_allowed' }), { status: 405 })
    }

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 })
    }

    const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    })

    const { data: me, error: userError } = await client.auth.getUser()
    if (userError || !me.user) {
      return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 })
    }

    const userId = me.user.id

    const { data, error } = await client
      .from('investments')
      .select('id, user_id, type, symbol, quantity, average_price')
      .eq('user_id', userId)
      .eq('type', 'stock')
      .order('symbol', { ascending: true })

    if (error) throw error

    const stocks = (data ?? []) as InvestmentRow[]
    if (stocks.length === 0) {
      return new Response(JSON.stringify({ updated: 0, errors: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const quoteBySymbol = new Map<string, number>()
    const symbols = Array.from(new Set(stocks.map((s) => normalizeSymbol(s.symbol))))
    const errors: string[] = []

    for (let i = 0; i < symbols.length; i += 1) {
      const symbol = symbols[i]
      try {
        const quote = await fetchQuote(symbol)
        quoteBySymbol.set(symbol, quote)
      } catch (e) {
        const msg = e instanceof Error ? e.message : `quote_error: ${symbol}`
        errors.push(`${symbol}: ${msg}`)
      }

      if (i < symbols.length - 1) {
        await sleep(13000)
      }
    }

    let updated = 0
    for (const stock of stocks) {
      const symbol = normalizeSymbol(stock.symbol)
      const currentPrice = quoteBySymbol.get(symbol)
      if (!currentPrice) continue

      const quantity = Number(stock.quantity ?? 0)
      const averagePrice = Number(stock.average_price ?? 0)
      const evaluationAmount = currentPrice * quantity
      const profitLoss = (currentPrice - averagePrice) * quantity
      const profitLossRate = averagePrice > 0
        ? ((currentPrice - averagePrice) / averagePrice) * 100
        : 0

      const { error: updateError } = await client
        .from('investments')
        .update({
          current_price: currentPrice,
          evaluation_amount: evaluationAmount,
          profit_loss: profitLoss,
          profit_loss_rate: profitLossRate,
          updated_at: new Date().toISOString(),
        })
        .eq('id', stock.id)

      if (updateError) {
        errors.push(`${symbol}: ${updateError.message}`)
        continue
      }

      updated += 1
    }

    return new Response(JSON.stringify({ updated, errors }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'unknown_error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }
})
