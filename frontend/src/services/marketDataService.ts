export type MarketQuote = {
  ticker: string
  price: number
  previousClose: number | null
  updatedAt: string
}

export type QuoteResult = {
  quotes: Record<string, MarketQuote>
  errors: string[]
}

const finnhubApiKey = import.meta.env.VITE_FINNHUB_API_KEY as string | undefined
const alphaVantageApiKey = import.meta.env.VITE_ALPHA_VANTAGE_API_KEY as string | undefined

function normalizeTicker(raw: string): string {
  return raw.trim().toUpperCase()
}

async function fetchFromFinnhub(ticker: string) {
  const url = `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(ticker)}&token=${finnhubApiKey}`
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`${ticker}: HTTP ${response.status}`)
  }
  const json = await response.json() as { c?: number; pc?: number }
  const price = Number(json.c ?? 0)
  if (!Number.isFinite(price) || price <= 0) {
    throw new Error(`${ticker}: 株価データが不正です`)
  }
  return {
    ticker,
    price,
    previousClose: Number.isFinite(Number(json.pc)) ? Number(json.pc) : null,
    updatedAt: new Date().toISOString(),
  } satisfies MarketQuote
}

async function fetchFromAlphaVantage(ticker: string) {
  const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(ticker)}&apikey=${alphaVantageApiKey}`
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`${ticker}: HTTP ${response.status}`)
  }
  const json = await response.json() as {
    'Global Quote'?: {
      '05. price'?: string
      '08. previous close'?: string
    }
  }
  const quote = json['Global Quote']
  const price = Number(quote?.['05. price'] ?? 0)
  if (!Number.isFinite(price) || price <= 0) {
    throw new Error(`${ticker}: 株価データが不正です`)
  }
  const prev = Number(quote?.['08. previous close'] ?? 0)
  return {
    ticker,
    price,
    previousClose: Number.isFinite(prev) && prev > 0 ? prev : null,
    updatedAt: new Date().toISOString(),
  } satisfies MarketQuote
}

export async function fetchQuotesByTickers(inputTickers: string[]): Promise<QuoteResult> {
  const uniqueTickers = Array.from(
    new Set(
      inputTickers
        .map(normalizeTicker)
        .filter((ticker) => ticker.length > 0),
    ),
  )

  if (uniqueTickers.length === 0) {
    return { quotes: {}, errors: [] }
  }

  if (!finnhubApiKey && !alphaVantageApiKey) {
    return {
      quotes: {},
      errors: ['VITE_FINNHUB_API_KEY または VITE_ALPHA_VANTAGE_API_KEY が未設定のため、株価を取得できません。'],
    }
  }

  const responses = await Promise.all(
    uniqueTickers.map(async (ticker) => {
      try {
        const quote = finnhubApiKey
          ? await fetchFromFinnhub(ticker)
          : await fetchFromAlphaVantage(ticker)

        return {
          ticker,
          quote,
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : `${ticker}: 株価取得に失敗しました`
        return { ticker, error: message }
      }
    }),
  )

  const quotes: Record<string, MarketQuote> = {}
  const errors: string[] = []

  for (const row of responses) {
    if ('quote' in row && row.quote) {
      quotes[row.ticker] = row.quote
    } else {
      errors.push(row.error)
    }
  }

  return { quotes, errors }
}
