const fetch = global.fetch || require('node-fetch');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

async function getExchangeRate() {
  try {
    const res = await fetch('https://api.frankfurter.app/latest?from=USD&to=JPY', { signal: AbortSignal.timeout(3000) });
    const data = await res.json();
    return data.rates.JPY;
  } catch (e) {
    console.error('FX rate error:', e);
    return 150; // Fallback
  }
}

async function getUsQuote(symbol, exchangeRate) {
  try {
    const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`, { signal: AbortSignal.timeout(3000) });
    const data = await res.json();
    const meta = data.chart.result[0].meta;
    const currentPrice = meta.regularMarketPrice;
    return {
      symbol,
      name: meta.longName || symbol,
      currentPrice,
      currentPriceJpy: Math.round(currentPrice * exchangeRate),
      currency: meta.currency,
      exchangeRate,
      change: meta.regularMarketPrice - meta.chartPreviousClose,
      changePercent: ((meta.regularMarketPrice - meta.chartPreviousClose) / meta.chartPreviousClose) * 100,
      updatedAt: new Date().toISOString(),
    };
  } catch (e) {
    return { error: '取得失敗', symbol };
  }
}

async function getJpQuote(symbol) {
  try {
    // Stooq format for JP: symbol.jp
    const res = await fetch(`https://stooq.com/q/l/?s=${symbol}.jp&f=sd2t2ohlcv&h&e=csv`, { signal: AbortSignal.timeout(3000) });
    const csv = await res.text();
    const lines = csv.split('\n');
    if (lines.length < 2) throw new Error('Invalid CSV');
    const cols = lines[1].split(',');
    // Symbol,Date,Time,Open,High,Low,Close,Volume
    const close = parseFloat(cols[6]);
    return {
      symbol,
      type: 'jp_stock',
      currentPrice: close,
      currentPriceJpy: close,
      currency: 'JPY',
      updatedAt: new Date().toISOString(),
    };
  } catch (e) {
    return { error: '取得失敗', symbol };
  }
}

async function getFundQuote(symbol) {
  try {
    // 8-digit code -> Stooq symbol.t
    const res = await fetch(`https://stooq.com/q/l/?s=${symbol}.t&f=sd2t2ohlcv&h&e=csv`, { signal: AbortSignal.timeout(3000) });
    const csv = await res.text();
    const lines = csv.split('\n');
    if (lines.length >= 2) {
      const cols = lines[1].split(',');
      const close = parseFloat(cols[6]);
      if (!isNaN(close)) {
        return {
          symbol,
          type: 'fund',
          currentPrice: close,
          currentPriceJpy: close,
          currency: 'JPY',
          updatedAt: new Date().toISOString(),
        };
      }
    }
    // Fallback: Toushin Association (Simple implementation)
    return { error: '取得失敗', symbol };
  } catch (e) {
    return { error: '取得失敗', symbol };
  }
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).set(corsHeaders).end();
  }

  const { symbol, type } = req.method === 'POST' ? req.body : req.query;
  const symbols = req.method === 'POST' ? req.body.symbols : [{ symbol, type }];

  if (!symbols || !Array.isArray(symbols)) {
    return res.status(400).json({ error: 'Invalid symbols' });
  }

  const exchangeRate = await getExchangeRate();
  const results = await Promise.all(
    symbols.map(async (item) => {
      const s = item.symbol;
      const t = item.type;
      if (t === 'us_stock' || t === 'etf') return { ...await getUsQuote(s, exchangeRate), type: t };
      if (t === 'jp_stock') return getJpQuote(s);
      if (t === 'fund') return getFundQuote(s);
      return { error: '未対応の種別', symbol: s, type: t };
    })
  );

  res.status(200).set(corsHeaders).json(req.method === 'POST' ? { results } : results[0]);
}
