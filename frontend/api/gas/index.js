const fetch = global.fetch || require('node-fetch');

/**
 * GAS Proxy Backend
 * Forwards requests to Google Apps Script Web App securely,
 * injecting the GAS_SECRET and user IDs.
 */
export default async function handler(req, res) {
  const gasUrl = process.env.GAS_WEBAPP_URL;
  const gasSecret = process.env.GAS_SECRET;

  if (!gasUrl || !gasSecret) {
    return res.status(500).json({ error: 'GAS configuration missing in environment' });
  }

  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'POST') {
      // Inject secret into body
      const body = { 
        ...req.body, 
        secret: gasSecret 
      };

      const response = await fetch(gasUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const text = await response.text();
      try {
        const json = JSON.parse(text);
        return res.status(response.status).json(json);
      } catch {
        return res.status(response.status).send(text);
      }
    } else if (req.method === 'GET') {
      // Add secret to query params
      const query = new URLSearchParams(req.query);
      query.set('secret', gasSecret);

      const response = await fetch(`${gasUrl}?${query.toString()}`);
      const text = await response.text();
      try {
        const json = JSON.parse(text);
        return res.status(response.status).json(json);
      } catch {
        return res.status(response.status).send(text);
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('GAS Proxy Error:', error);
    return res.status(500).json({ error: 'Proxy calculation failed', detail: error.message });
  }
}
