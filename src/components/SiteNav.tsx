'use client';
import { useCart } from '@/hooks/useCart';

interface SiteNavProps {
  activePage?: 'home' | 'catalogo' | 'blog' | 'comicsIA';
}

export default function SiteNav({ activePage }: SiteNavProps) {
  const { totalItems } = useCart();
  return (
    <>
      <style>{`
        .site-nav{background:var(--site-header,#CC0000);border-bottom:4px solid #0A0A0A;position:sticky;top:0;z-index:50;padding:9px 28px;display:flex;align-items:center;gap:14px}
        .site-nav-logo img{height:36px;object-fit:contain;display:block;flex-shrink:0}
        .site-nav-links{display:flex;gap:5px;flex:1;margin-left:6px;flex-wrap:wrap}
        .nav-a{padding:5px 11px;font-size:11px;font-weight:700;font-family:monospace;letter-spacing:.06em;text-transform:uppercase;border:2px solid rgba(255,255,255,.35);color:rgba(255,255,255,.85);border-radius:3px;text-decoration:none;white-space:nowrap;transition:background .15s,color .15s}
        .nav-a:hover,.nav-a.active{background:#fff;color:var(--site-header,#CC0000);border-color:#fff}
        .site-nav-cart{background:#F5C518;color:#0A0A0A;padding:6px 14px;font-size:11px;font-weight:800;font-family:monospace;letter-spacing:.08em;border:2px solid #0A0A0A;text-transform:uppercase;box-shadow:2px 2px 0 #0A0A0A;text-decoration:none;position:relative;white-space:nowrap;flex-shrink:0;margin-left:auto}
        .site-nav-cart-badge{position:absolute;top:-7px;right:-7px;background:#CC0000;color:#fff;border-radius:50%;width:18px;height:18px;font-size:9px;font-weight:800;display:flex;align-items:center;justify-content:center;border:2px solid #0A0A0A}
        @media(max-width:640px){
          .site-nav{padding:8px 12px;gap:8px}
          .site-nav-logo img{height:26px}
          .site-nav-links .nav-a{font-size:9px;padding:4px 7px}
          [data-nav="marvel"],[data-nav="dc"]{display:none}
        }
      `}</style>
      <header className="site-nav">
        <a href="/" className="site-nav-logo"><img src="/logo.webp" alt="La Tienda de Comics" /></a>
        <nav className="site-nav-links">
          <a data-nav="catalogo" href="/catalogo" className={`nav-a${activePage==='catalogo'?' active':''}`}>Catálogo</a>
          <a data-nav="blog" href="/blog" className={`nav-a${activePage==='blog'?' active':''}`}>Blog Portadas</a>
          <a data-nav="marvel" href="/blog/marvel" className="nav-a" style={{opacity:.8}}>Marvel</a>
          <a data-nav="dc" href="/blog/dc" className="nav-a" style={{opacity:.8}}>DC</a>
          <a data-nav="comicsia" href="/comicsIA" className={`nav-a${activePage==='comicsIA'?' active':''}`}>Comics IA</a>
        </nav>
        <a href="/checkout" className="site-nav-cart">
          🛒 Carrito
          {totalItems > 0 && <span className="site-nav-cart-badge">{totalItems}</span>}
        </a>
      </header>
    </>
  );
}
