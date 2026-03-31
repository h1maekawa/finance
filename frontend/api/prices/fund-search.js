const fetch = global.fetch || require('node-fetch');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const staticFunds = [
  { code: "0131103C", name: "eMAXIS Slim 全世界株式(オール・カントリー)", company: "三菱UFJアセットマネジメント", category: "国際株式" },
  { code: "03311187", name: "eMAXIS Slim 米国株式(S&P500)", company: "三菱UFJアセットマネジメント", category: "米国株式" },
  { code: "89311199", name: "SBI・V・S&P500", company: "SBIアセットマネジメント", category: "米国株式" },
  { code: "9C31116A", name: "ひふみプラス", company: "レオス・キャピタルワークス", category: "国内株式" },
  { code: "03311179", name: "eMAXIS Slim 先進国株式", company: "三菱UFJアセットマネジメント", category: "国際株式" },
  { code: "9I31116E", name: "楽天・全米株式", company: "楽天アセットマネジメント", category: "米国株式" }
];

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).set(corsHeaders).end();
  }

  const { q } = req.query;
  if (!q) {
    return res.status(200).set(corsHeaders).json({ results: staticFunds });
  }

  try {
    // Rakuten Securities Fund Search API
    const rakutenUrl = `https://itf.toushin.or.jp/FundRefer/search/keyword?keyword=${encodeURIComponent(q)}&fundType=1`;
    const response = await fetch(rakutenUrl, { signal: AbortSignal.timeout(3000) });
    const data = await response.json();
    
    // Process results (data format might differ, adjust as needed)
    const results = (data.results || []).map(f => ({
      code: f.isinCd || f.code,
      name: f.name || f.fundName,
      company: f.companyName,
      category: f.categoryName
    }));

    if (results.length > 0) {
      return res.status(200).set(corsHeaders).json({ results });
    }

    // Fallback search in static list
    const filtered = staticFunds.filter(f => f.name.includes(q) || f.code.includes(q));
    res.status(200).set(corsHeaders).json({ results: filtered });

  } catch (e) {
    // Final fallback: just static list match
    const filtered = staticFunds.filter(f => f.name.includes(q) || f.code.includes(q));
    res.status(200).set(corsHeaders).json({ results: filtered });
  }
}
