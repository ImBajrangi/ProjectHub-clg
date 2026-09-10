'use client';

import React, { useState } from 'react';
import { Linkedin, Instagram } from 'lucide-react';

export default function Footer() {
  const developers = [
    {
      name: 'Arpit Pandey',
      role: 'BCA (DS)',
      link: 'https://www.linkedin.com/in/dev-arpit/',
      image: '/image/arpit.webp',
      initials: 'AP',
      type: 'linkedin',
    },
    {
      name: 'Rishabh Mishra',
      role: 'BCA (DS)',
      link: 'https://www.linkedin.com/in/rishabh-mishra-bab420309/',
      image: '/image/rishabh.webp',
      initials: 'RM',
      type: 'linkedin',
    },
    {
      name: 'Harsh Sharma',
      role: 'BCA (DS)',
      link: 'https://www.linkedin.com/in/harshiitm/',
      image: '/image/harsh.webp',
      initials: 'HS',
      type: 'linkedin',
    },
    {
      name: 'CodeShastra',
      role: 'Code Master',
      link: 'https://www.instagram.com/code___shastra/',
      image: '/image/CodeShastra.webp',
      initials: 'CS',
      type: 'instagram',
    },
  ];

  return (
    <footer className="site-footer">
      <div className="container" style={{ maxWidth: '1160px', margin: '0 auto' }}>
        <div className="footer-content">
          {/* Brand Info */}
          <div className="footer-brand-info">
            <span style={{ fontWeight: 700, fontSize: '12.5px', color: 'var(--color-ink)' }}>
              CodeShastra ProjectHub
            </span>
            <span style={{ fontSize: '11px', color: 'var(--color-text-faint)', marginLeft: '6px' }}>
              • GLA University
            </span>
          </div>

          {/* Compact Developer Credits */}
          <div className="footer-devs-section">
            <span style={{ fontSize: '10px', color: 'var(--color-text-faint)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Crafted by
            </span>
            <div className="footer-devs-list">
              {developers.map((dev) => (
                <DeveloperPill key={dev.name} dev={dev} />
              ))}
            </div>
          </div>
        </div>

        {/* Minimal Copyright Strip */}
        <div className="footer-bottom-strip">
          <span>© {new Date().getFullYear()} CodeShastra • Dept. of Computer Applications</span>
          <span>Odd Sem 2026–27</span>
        </div>
      </div>

      <style jsx global>{`
        .site-footer {
          background-color: #FFFFFF;
          border-top: 1px solid var(--color-hairline);
          padding: 12px 16px 10px;
          margin-top: auto;
          width: 100%;
        }
        .footer-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 10px;
          padding-bottom: 8px;
          border-bottom: 1px solid #F1F5F9;
        }
        .footer-brand-info {
          display: flex;
          align-items: center;
          flex: 0 1 auto;
        }
        .footer-devs-section {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }
        .footer-devs-list {
          display: flex;
          align-items: center;
          gap: 5px;
          flex-wrap: wrap;
        }
        .dev-pill {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 2px 7px 2px 2px;
          background-color: var(--color-canvas-soft);
          border: 1px solid var(--color-hairline);
          border-radius: 9999px;
          text-decoration: none;
          color: var(--color-ink);
          font-size: 10.5px;
          font-weight: 600;
          transition: all 0.15s ease;
        }
        .dev-pill:hover {
          background-color: #EFF6FF;
          border-color: #BFDBFE;
          color: #1D4ED8;
        }
        .dev-pill.is-insta:hover {
          background-color: #FDF2F8;
          border-color: #FBCFE8;
          color: #BE185D;
        }
        .dev-pill-img {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          object-fit: cover;
          display: block;
        }
        .dev-pill-fallback {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #E2E8F0;
          color: #475569;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 8px;
          font-weight: 700;
        }
        .footer-bottom-strip {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 4px;
          padding-top: 6px;
          font-size: 10.5px;
          color: var(--color-text-faint);
        }
        @media (max-width: 640px) {
          .site-footer {
            padding: 10px 14px 8px !important;
          }
          .footer-content {
            flex-direction: column;
            align-items: flex-start;
            justify-content: flex-start !important;
            gap: 8px;
            padding-bottom: 6px;
          }
          .footer-devs-section {
            flex-direction: column;
            align-items: flex-start;
            gap: 4px;
            width: 100%;
          }
          .footer-devs-list {
            display: flex;
            flex-wrap: wrap;
            gap: 4px;
            width: 100%;
          }
          .dev-pill {
            padding: 2px 6px 2px 2px;
            font-size: 10px;
            gap: 4px;
          }
          .footer-bottom-strip {
            flex-direction: column;
            align-items: flex-start;
            gap: 2px;
            padding-top: 5px;
          }
        }
      `}</style>
    </footer>
  );
}

function DeveloperPill({ dev }: { dev: any }) {
  const [currentSrc, setCurrentSrc] = useState(dev.image);
  const [hasError, setHasError] = useState(false);

  const targetUrl = dev.link || dev.linkedin || '#';
  const isInstagram = dev.type === 'instagram' || targetUrl.includes('instagram.com');

  const handleImageError = () => {
    if (currentSrc && currentSrc.endsWith('.webp')) {
      // Try png fallback
      setCurrentSrc(currentSrc.replace('.webp', '.png'));
    } else {
      setHasError(true);
    }
  };

  return (
    <a
      href={targetUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`dev-pill ${isInstagram ? 'is-insta' : ''}`}
      title={`${dev.name} • ${dev.role} (${isInstagram ? 'Instagram' : 'LinkedIn'})`}
    >
      {!hasError ? (
        <img
          src={currentSrc}
          alt={dev.name}
          onError={handleImageError}
          className="dev-pill-img"
        />
      ) : (
        <div className="dev-pill-fallback">{dev.initials}</div>
      )}
      <span>{dev.name}</span>
      {isInstagram ? (
        <Instagram size={11} style={{ opacity: 0.9, color: '#E1306C' }} />
      ) : (
        <Linkedin size={11} style={{ opacity: 0.7, color: '#0A66C2' }} />
      )}
    </a>
  );
}
