'use client';
import { useEffect } from 'react';

const DEFAULTS: Record<string, string> = {
  site_font: 'Inter',
  font_heading: '',
  font_body: '',
  font_cards: '',
  font_chat: '',
  color_h1: '#0A0A0A',
  color_h2: '#111111',
  color_body: '#333333',
  color_price: '#CC0000',
  color_card_title: '#0A0A0A',
  color_btn_buy_bg: '#CC0000',
  color_btn_buy_text: '#ffffff',
  color_btn_view_bg: '#0A0A0A',
  color_btn_view_text: '#ffffff',
  btn_radius: '10px',
  btn_style: 'solid',
  card_radius: '12px',
  card_border: '1.5px solid #EFEFEF',
  card_shadow: '0 2px 8px rgba(0,0,0,.05)',
  card_shadow_hover: '0 8px 24px rgba(0,0,0,.14)',
  site_bg: '#F5F0E6',
  site_bg_type: 'pattern',
  site_bg_value: '',
  site_bg_opacity: '88',
  site_header_color: '#CC0000',
  header_buttons: '{}',
};

function loadGoogleFont(name: string, id: string) {
  if (!name || name === 'Inter') return;
  const existing = document.getElementById(id) as HTMLLinkElement | null;
  const href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(name)}:wght@400;500;600;700;800;900&display=swap`;
  if (existing) { existing.href = href; return; }
  const link = document.createElement('link');
  link.id = id; link.rel = 'stylesheet'; link.href = href;
  document.head.appendChild(link);
}

export default function SiteTheme() {
  useEffect(() => {
    const keys = Object.keys(DEFAULTS).join(',');
    fetch(`/api/settings?keys=${keys}`)
      .then(r => r.json())
      .then((d: Record<string, string>) => {
        const get = (k: string) => d[k] ?? DEFAULTS[k];
        const root = document.documentElement;
        const set = (v: string, val: string) => root.style.setProperty(v, val);

        // ── Fonts ─────────────────────────────────────────────────────
        const globalFont = get('site_font') || 'Inter';
        const headingFont = get('font_heading') || globalFont;
        const bodyFont = get('font_body') || globalFont;
        const cardsFont = get('font_cards') || globalFont;
        const chatFont = get('font_chat') || globalFont;

        loadGoogleFont(globalFont, 'font-global');
        loadGoogleFont(headingFont, 'font-heading');
        loadGoogleFont(bodyFont, 'font-body');
        loadGoogleFont(cardsFont, 'font-cards');
        loadGoogleFont(chatFont, 'font-chat');

        set('--font-global', `'${globalFont}', sans-serif`);
        set('--font-heading', `'${headingFont}', sans-serif`);
        set('--font-body', `'${bodyFont}', sans-serif`);
        set('--font-cards', `'${cardsFont}', sans-serif`);
        set('--font-chat', `'${chatFont}', sans-serif`);

        // ── Colors ────────────────────────────────────────────────────
        set('--color-h1', get('color_h1'));
        set('--color-h2', get('color_h2'));
        set('--color-body', get('color_body'));
        set('--color-price', get('color_price'));
        set('--color-card-title', get('color_card_title'));
        set('--color-btn-buy-bg', get('color_btn_buy_bg'));
        set('--color-btn-buy-text', get('color_btn_buy_text'));
        set('--color-btn-view-bg', get('color_btn_view_bg'));
        set('--color-btn-view-text', get('color_btn_view_text'));

        // ── Buttons ───────────────────────────────────────────────────
        const btnR = get('btn_radius');
        const btnStyle = get('btn_style');
        set('--btn-radius', btnR);
        if (btnStyle === 'outline') {
          set('--btn-buy-bg', 'transparent');
          set('--btn-buy-border', `2px solid ${get('color_btn_buy_bg')}`);
          set('--btn-buy-text', get('color_btn_buy_bg'));
        } else if (btnStyle === 'brutalist') {
          set('--btn-buy-bg', get('color_btn_buy_bg'));
          set('--btn-buy-border', `3px solid #0A0A0A`);
          set('--btn-buy-text', get('color_btn_buy_text'));
          set('--btn-buy-shadow', '4px 4px 0 #0A0A0A');
        } else {
          set('--btn-buy-bg', get('color_btn_buy_bg'));
          set('--btn-buy-border', 'none');
          set('--btn-buy-text', get('color_btn_buy_text'));
          set('--btn-buy-shadow', 'none');
        }

        // ── Cards ─────────────────────────────────────────────────────
        set('--card-radius', get('card_radius'));
        set('--card-border', get('card_border'));
        set('--card-shadow', get('card_shadow'));
        set('--card-shadow-hover', get('card_shadow_hover'));

        // ── Background ────────────────────────────────────────────────
        const bgType = get('site_bg_type');
        const bgValue = get('site_bg_value');
        const bgOpacity = parseInt(get('site_bg_opacity')) / 100;
        if (bgType === 'color' && bgValue) {
          set('--site-bg', bgValue);
          set('--site-bg-image', 'none');
          set('--site-bg-size', 'auto');
        } else if (bgType === 'image' && bgValue) {
          set('--site-bg', '#F5F0E6');
          set('--site-bg-image', `url(${bgValue})`);
          set('--site-bg-size', 'cover');
          set('--site-overlay', `rgba(245,240,230,${bgOpacity})`);
        } else {
          set('--site-bg', '#F5F0E6');
          set('--site-bg-image', 'radial-gradient(circle at 1px 1px,rgba(0,0,0,.09) 1px,transparent 0)');
          set('--site-bg-size', '6px 6px');
        }

        // ── Header ────────────────────────────────────────────────────
        set('--site-header', get('site_header_color'));

        // ── Header button visibility ──────────────────────────────────
        try {
          const buttons = JSON.parse(get('header_buttons') || '{}');
          const ids = ['catalogo', 'blog', 'marvel', 'dc', 'comicsia'];
          ids.forEach(id => {
            const visible = buttons[id] !== false;
            document.querySelectorAll(`[data-nav="${id}"]`).forEach(el => {
              (el as HTMLElement).style.display = visible ? '' : 'none';
            });
          });
        } catch {}
      }).catch(() => {});
  }, []);
  return null;
}
