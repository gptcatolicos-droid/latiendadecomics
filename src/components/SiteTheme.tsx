'use client';
import { useEffect } from 'react';

export default function SiteTheme() {
  useEffect(() => {
    fetch('/api/settings?keys=site_font,site_bg_type,site_bg_value,site_bg_opacity,site_header_color')
      .then(r => r.json())
      .then(d => {
        const root = document.documentElement;
        // Font
        if (d.site_font && d.site_font !== 'Inter') {
          const existing = document.getElementById('site-google-font');
          if (!existing) {
            const link = document.createElement('link');
            link.id = 'site-google-font';
            link.rel = 'stylesheet';
            link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(d.site_font)}:wght@400;500;600;700;800;900&display=swap`;
            document.head.appendChild(link);
          }
          root.style.setProperty('--site-font', `'${d.site_font}', sans-serif`);
        }
        // Background
        const bgType = d.site_bg_type || 'pattern';
        const bgValue = d.site_bg_value || '';
        const bgOpacity = parseInt(d.site_bg_opacity || '88');
        if (bgType === 'color' && bgValue) {
          root.style.setProperty('--site-bg', bgValue);
          root.style.setProperty('--site-bg-image', 'none');
          root.style.setProperty('--site-overlay', 'none');
        } else if (bgType === 'image' && bgValue) {
          root.style.setProperty('--site-bg', '#F5F0E6');
          root.style.setProperty('--site-bg-image', `url(${bgValue})`);
          root.style.setProperty('--site-overlay', `rgba(245,240,230,${bgOpacity / 100})`);
        } else {
          // default: halftone pattern
          root.style.setProperty('--site-bg', '#F5F0E6');
          root.style.setProperty('--site-bg-image', 'none');
          root.style.setProperty('--site-overlay', 'none');
        }
        // Header color
        if (d.site_header_color) {
          root.style.setProperty('--site-header', d.site_header_color);
        }
      }).catch(() => {});
  }, []);
  return null;
}
