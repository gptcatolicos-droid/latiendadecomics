'use client';
import { useState } from 'react';
import type { ProductImage } from '@/types';

export default function ProductImages({ images, title }: { images: ProductImage[]; title: string }) {
  const [active, setActive] = useState(0);
  const [imgError, setImgError] = useState<Record<number, boolean>>({});

  if (!images.length) {
    return (
      <div style={{ aspectRatio: '1/1', background: '#f7f7f7', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 80, border: '1px solid #ebebeb' }}>
        📚
      </div>
    );
  }

  const current = images[active];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Main image */}
      <div style={{
        aspectRatio: '1/1',
        background: '#f7f7f7',
        borderRadius: 16,
        overflow: 'hidden',
        border: '1px solid #ebebeb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {!imgError[active] ? (
          <img
            src={current.url}
            alt={current.alt || title}
            onError={() => setImgError(prev => ({ ...prev, [active]: true }))}
            style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 16 }}
          />
        ) : (
          <span style={{ fontSize: 64 }}>📚</span>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
          {images.map((img, i) => (
            <button
              key={img.id || i}
              onClick={() => setActive(i)}
              style={{
                flexShrink: 0, width: 64, height: 64, borderRadius: 8,
                overflow: 'hidden', border: `2px solid ${i === active ? '#CC0000' : '#e0e0e0'}`,
                background: '#f7f7f7', cursor: 'pointer', padding: 0,
              }}
            >
              <img src={img.url} alt={img.alt || `${title} ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
