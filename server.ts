import dotenv from "dotenv";
dotenv.config();

import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { createClient } from "@supabase/supabase-js";

// Import payment logic - fixing extensions for Node 22 type stripping
import { paymentRouter } from "./src/pagamentoAo/paymentController.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Supabase for Server-Side SEO
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Payment Routes
  app.use("/api/payments", paymentRouter);

  // YouTube Proxy for Frontend Extraction
  app.post("/api/proxy-youtube", async (req, res) => {
    try {
      console.log(" [PROXY] Request received:", req.body);
      const { url } = req.body;
      if (!url) {
        console.log(" [PROXY] No URL provided");
        return res.status(400).json({ message: "URL é obrigatória" });
      }
      
      console.log(" [PROXY] Fetching YouTube URL:", url);
      const ytRes = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'pt-PT,pt;q=0.9,en-US;q=0.8,en;q=0.7'
        },
        redirect: 'follow'
      });
      
      console.log(" [PROXY] YouTube response status:", ytRes.status);
      if (!ytRes.ok) {
        console.log(" [PROXY] YouTube fetch failed:", ytRes.status, ytRes.statusText);
        const errorText = await ytRes.text().catch(() => "Sem detalhes");
        console.error(`[YouTube Proxy] Erro ${ytRes.status}: ${errorText.substring(0, 100)}`);
        throw new Error(`YouTube respondeu com erro ${ytRes.status}`);
      }
      
      const html = await ytRes.text();
      res.json({ html });
    } catch (error: any) {
      console.error(`[YouTube Proxy] Erro fatal:`, error.message);
      res.status(500).json({ message: error.message });
    }
  });

  // Dynamic Sitemap
  app.get("/sitemap.xml", async (req, res) => {
    try {
      const { data: contents } = await supabase
        .from('contents')
        .select('id, created_at')
        .eq('status', 'approved');

      let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://bukiangolano.com/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://bukiangolano.com/catalog</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`;

      // Add Category search pages for better indexing
      const categories = ['Economia', 'Direito', 'Medicina', 'Informatica', 'Engenharia', 'Historia', 'Marketing'];
      categories.forEach(cat => {
        sitemap += `
  <url>
    <loc>https://bukiangolano.com/busca/${encodeURIComponent(cat.toLowerCase())}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`;
      });

      contents?.forEach(content => {
        sitemap += `
  <url>
    <loc>https://bukiangolano.com/content/${content.id}</loc>
    <lastmod>${new Date(content.created_at).toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`;
      });

      sitemap += `\n</urlset>`;
      res.header('Content-Type', 'application/xml');
      res.send(sitemap);
    } catch (e) {
      res.status(500).end();
    }
  });

  // SEO Handler for SPA
  const handleSPA = async (req: express.Request, res: express.Response, vite?: any) => {
    const url = req.originalUrl;
    const protocol = req.protocol;
    const host = req.get('host');
    const fullUrl = `${protocol}://${host}${url}`;

    // Aggressive caching for static content
    res.set('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');

    try {
      let template;
      if (vite) {
        template = fs.readFileSync(path.resolve(__dirname, "index.html"), "utf-8");
        template = await vite.transformIndexHtml(url, template);
      } else {
        template = fs.readFileSync(path.resolve(__dirname, "dist/index.html"), "utf-8");
      }

      // Default SEO
      let seoTitle = "BukiAngolano | A maior Biblioteca Digital de Angola";
      let seoDesc = "Encontre e partilhe livros, cursos, TCCs e materiais de estudo. A plataforma feita de estudantes para estudantes angolanos.";
      let seoImage = "https://images.unsplash.com/photo-1544377193-33dcf4d68fb5?q=80&w=1200&auto=format&fit=crop";
      let preloadLink = '';
      let robotsMeta = '<meta name="robots" content="index, follow" />';
      let canonicalLink = `<link rel="canonical" href="${fullUrl.split('?')[0]}" />`;
      
      // Dynamic SEO for Content Pages (/content/:id)
      const contentMatch = url.match(/\/content\/([a-zA-Z0-9-]+)/);
      if (contentMatch) {
        const contentId = contentMatch[1];
        const { data: content } = await supabase
          .from('contents')
          .select('title, subtitle, category, author, thumbnail_url')
          .eq('id', contentId)
          .single();
        
        if (content) {
          seoTitle = `${content.title} | Buki Angolano`;
          seoDesc = content.subtitle || `Trabalho sobre ${content.category} - Partilhado por ${content.author}`;
          seoImage = content.thumbnail_url || seoImage;
          // Preload hero image for LCP
          preloadLink = `<link rel="preload" as="image" href="${seoImage}" />`;
          canonicalLink = `<link rel="canonical" href="https://bukiangolano.com/content/${contentId}" />`;
        }
      }

      // Dynamic SEO for Search Pages (/busca/:query)
      const searchMatch = url.match(/\/busca\/([a-zA-Z0-9%_-]+)/);
      if (searchMatch) {
        const query = decodeURIComponent(searchMatch[1]);
        seoTitle = `Trabalhos de ${query} | Buki Angolano`;
        seoDesc = `Encontra os melhores documentos e resumos académicos sobre ${query} em Angola. Biblioteca Digital Buki Angolano.`;
      }

      // Noindex for complex filters, search results, or admin areas
      const isSearch = url.includes('search=');
      const isFiltered = url.includes('type=') || url.includes('price=') || url.includes('sortBy=');
      const isAdmin = url.includes('/admin');
      
      if (isSearch || isFiltered || isAdmin) {
        robotsMeta = '<meta name="robots" content="noindex, follow" />';
      } else {
        robotsMeta = '<meta name="robots" content="index, follow" />';
      }

      // Inject SEO into HTML
      let html = template
        .replace(/<title>.*?<\/title>/g, `<title>${seoTitle}</title>`)
        .replace(/<link rel="canonical" href=".*?" \/>/g, canonicalLink)
        .replace(/<meta name="robots" content=".*?" \/>/g, robotsMeta)
        .replace('</head>', `${preloadLink}</head>`)
        .replace(/<meta property="og:title" content=".*?" \/>/g, `<meta property="og:title" content="${seoTitle}" />`)
        .replace(/<meta name="twitter:title" content=".*?" \/>/g, `<meta name="twitter:title" content="${seoTitle}" />`)
        .replace(/<meta name="description" content=".*?" \/>/g, `<meta name="description" content="${seoDesc}" />`)
        .replace(/<meta property="og:description" content=".*?" \/>/g, `<meta property="og:description" content="${seoDesc}" />`)
        .replace(/<meta name="twitter:description" content=".*?" \/>/g, `<meta name="twitter:description" content="${seoDesc}" />`)
        .replace(/<meta property="og:image" content=".*?" \/>/g, `<meta property="og:image" content="${seoImage}" />`)
        .replace(/<meta name="twitter:image" content=".*?" \/>/g, `<meta name="twitter:image" content="${seoImage}" />`);

      res.status(200).set({ "Content-Type": "text/html" }).end(html);
    } catch (e) {
      if (vite) vite.ssrFixStacktrace(e as Error);
      console.error(e);
      res.status(500).end((e as Error).message);
    }
  };

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "custom", // Important for custom HTML handling
    });
    app.use(vite.middlewares);
    app.get('*', (req, res) => handleSPA(req, res, vite));
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    // Serve static files but intercept index.html requests
    app.use(express.static(distPath, { index: false }));
    app.get('*', (req, res) => handleSPA(req, res));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
