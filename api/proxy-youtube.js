// Vercel Serverless Function for YouTube Proxy
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ message: "URL é obrigatória" });
    }

    console.log("🔍 [VERCEL PROXY] Request received:", url);

    // Fetch YouTube with optimized headers for Vercel
    const ytRes = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'pt-PT,pt;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
      redirect: 'follow',
      timeout: 25000 // Vercel timeout limit
    });

    console.log("📊 [VERCEL PROXY] YouTube response status:", ytRes.status);

    if (!ytRes.ok) {
      console.log("❌ [VERCEL PROXY] YouTube fetch failed:", ytRes.status);
      throw new Error(`YouTube respondeu com erro ${ytRes.status}`);
    }

    const html = await ytRes.text();
    console.log("✅ [VERCEL PROXY] Successfully fetched HTML, length:", html.length);

    res.json({ html });
  } catch (error) {
    console.error("💥 [VERCEL PROXY] Error:", error.message);
    res.status(500).json({ 
      message: error.message || "Erro ao aceder ao YouTube" 
    });
  }
}
