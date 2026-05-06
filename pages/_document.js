import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta charSet="utf-8" />
        <meta name="theme-color" content="#000000" />
        
        {/* 基础 SEO 标签 */}
        <meta name="description" content="Explore a unique collection of 3D-modeled travel artifacts from around the world. This interactive showcase features carefully curated souvenirs and memorable items, each telling its own story through immersive 3D visualization. Experience travel memories in a whole new dimension." />
        <meta name="keywords" content="travel collections, 3D models, souvenirs, digital artifacts, interactive showcase, travel memories, 3D visualization, virtual collection" />
        
        {/* Open Graph 标签 */}
        <meta property="og:title" content="VOYAGE ARTIFACTS | 3D Travel Collection Showcase" />
        <meta property="og:description" content="Discover an interactive 3D showcase of travel artifacts and souvenirs, bringing memories to life through immersive digital experiences." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://voyage-artifacts.vercel.app" />
        <meta property="og:image" content="/og-image.jpg" />
        
        {/* Twitter Card 标签 */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="VOYAGE ARTIFACTS | 3D Travel Collection Showcase" />
        <meta name="twitter:description" content="Explore a curated collection of 3D-modeled travel artifacts and souvenirs from around the world." />
        <meta name="twitter:image" content="/og-image.jpg" />
        
        {/* Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet" />

        {/* 网站图标 */}
        <link
          rel="icon"
          href="/favicon.ico"
          type="image/x-icon"
        />
        <link 
          rel="shortcut icon" 
          href="/favicon.ico" 
          type="image/x-icon"
        />
        
        {/* 确保缓存刷新 */}
        <meta name="version" content="1.0" />
      </Head>
      <body className="antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
