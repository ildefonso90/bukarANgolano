
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
  category?: string;
  categoryUrl?: string;
  author?: string;
  noindex?: boolean;
  canonical?: string;
  prev?: string;
  next?: string;
}

export default function SEO({ 
  title = "Buki Angolano - Biblioteca Digital Académica", 
  description = "A maior biblioteca digital de trabalhos académicos em Angola. Encontre manuais, teses e exercícios das melhores universidades.",
  image = "https://images.unsplash.com/photo-1544377193-33dcf4d68fb5?q=80&w=1200&auto=format&fit=crop",
  url = "https://bukiangolano.com",
  type = "website",
  category,
  categoryUrl,
  author,
  noindex = false,
  canonical,
  prev,
  next
}: SEOProps) {
  const siteName = "Buki Angolano";
  const fullTitle = title.includes(siteName) ? title : `${title} | ${siteName}`;
  const currentUrl = canonical || url;

  // Structured Data
  const jsonLd: any = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": type === "book" ? "DigitalDocument" : "WebPage",
        "name": title,
        "description": description,
        "image": image,
        "author": author ? { "@type": "Person", "name": author } : undefined,
        "genre": category,
        "publisher": {
          "@type": "Organization",
          "name": siteName,
          "logo": {
            "@type": "ImageObject",
            "url": "https://bukiangolano.com/logo.png"
          }
        }
      }
    ]
  };

  // Add Breadcrumbs if applicable
  if (category && categoryUrl) {
    jsonLd["@graph"].push({
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Biblioteca",
          "item": "https://bukiangolano.com/catalog"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": category,
          "item": `https://bukiangolano.com${categoryUrl}`
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": title,
          "item": currentUrl
        }
      ]
    });
  }

  return (
    <Helmet>
      {/* Standard Metadata */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {author && <meta name="author" content={author} />}
      {category && <meta name="keywords" content={`${category}, Angola, Académico, Universitário, ${siteName}`} />}
      
      {/* Indexing Control */}
      {noindex ? (
        <meta name="robots" content="noindex, follow" />
      ) : (
        <meta name="robots" content="index, follow" />
      )}
      <link rel="canonical" href={currentUrl} />

      {/* Pagination */}
      {prev && <link rel="prev" href={prev} />}
      {next && <link rel="next" href={next} />}
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type === 'book' ? 'article' : type} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content={siteName} />
      {type === 'book' && category && <meta property="article:section" content={category} />}

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@bukiangolano" />
      <meta name="twitter:url" content={currentUrl} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      <meta name="twitter:label1" content="Categoria" />
      <meta name="twitter:data1" content={category || 'Académico'} />
      {author && <meta name="twitter:label2" content="Autor" />}
      {author && <meta name="twitter:data2" content={author} />}

      {/* Structured Data (JSON-LD) */}
      <script type="application/ld+json">
        {JSON.stringify(jsonLd)}
      </script>
    </Helmet>
  );
}
