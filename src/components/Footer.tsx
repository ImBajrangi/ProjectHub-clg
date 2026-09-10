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
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 800, fontSize: '13px', color: 'var(--color-ink)', letterSpacing: '-0.01em' }}>
                CodeShastra ProjectHub
              </span>
              <span style={{ fontSize: '11.5px', color: 'var(--color-text-muted)', fontWeight: 500 }}>
                • GLA University
              </span>
            </div>
            <div className="footer-subline" style={{ fontSize: '11px', color: 'var(--color-text-faint)', marginTop: '2px' }}>
              Dept. of Computer Applications • Odd Sem 2026–27
            </div>
          </div>

          {/* Compact Developer Credits */}
          <div className="footer-devs-section">
            <div style={{ fontSize: '9.5px', color: 'var(--color-text-faint)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Crafted by
            </div>
            <div className="footer-devs-list">
              {developers.map((dev) => (
                <DeveloperPill key={dev.name} dev={dev} />
              ))}
            </div>
          </div>
        </div>

        {/* Minimal Copyright Strip */}
        <div className="footer-bottom-strip">
          <span>© {new Date().getFullYear()} Vrindopnishad &amp; CodeShastra. All rights reserved.</span>
          <span>Evaluation &amp; Defense Portal v2.4</span>
        </div>
      </div>

      <style jsx global>{`
        .site-footer {
          background-color: #FFFFFF;
          border-top: 1px solid var(--color-hairline);
          padding: 14px 16px 10px;
          margin-top: auto;
          width: 100%;
        }
        .footer-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
          padding-bottom: 10px;
          border-bottom: 1px solid #F1F5F9;
        }
        .footer-brand-info {
          display: flex;
          flex-direction: column;
        }
        .footer-devs-section {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .footer-devs-list {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }
        .dev-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 3px 8px 3px 3px;
          background-color: #F8FAFC;
          border: 1px solid #E2E8F0;
          border-radius: 9999px;
          text-decoration: none;
          color: var(--color-ink);
          font-size: 11px;
          font-weight: 600;
          transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.02);
        }
        .dev-pill:hover {
          background-color: #EFF6FF;
          border-color: #93C5FD;
          color: #1D4ED8;
          box-shadow: 0 2px 6px rgba(37, 99, 235, 0.08);
        }
        .dev-pill.is-insta:hover {
          background-color: #FDF2F8;
          border-color: #F9A8D4;
          color: #BE185D;
          box-shadow: 0 2px 6px rgba(225, 48, 108, 0.08);
        }
        .dev-pill-img {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          object-fit: cover;
          display: block;
          border: 1px solid rgba(0, 0, 0, 0.06);
        }
        .dev-pill-fallback {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #E2E8F0;
          color: #475569;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 8.5px;
          font-weight: 700;
        }
        .footer-bottom-strip {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 4px;
          padding-top: 8px;
          font-size: 10.5px;
          color: var(--color-text-faint);
        }
        @media (max-width: 640px) {
          .site-footer {
            padding: 12px 14px 10px !important;
          }
          .footer-content {
            flex-direction: column;
            align-items: stretch;
            gap: 10px;
            padding-bottom: 8px;
          }
          .footer-devs-section {
            flex-direction: column;
            align-items: flex-start;
            gap: 6px;
            width: 100%;
          }
          .footer-devs-list {
            display: grid !important;
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            gap: 6px !important;
            width: 100% !important;
          }
          .dev-pill {
            width: 100% !important;
            padding: 4px 8px 4px 4px !important;
            border-radius: 10px !important;
            font-size: 11px !important;
            box-sizing: border-box;
          }
          .dev-pill span {
            flex: 1;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            min-width: 0;
          }
          .footer-bottom-strip {
            flex-direction: column;
            align-items: flex-start;
            gap: 2px;
            padding-top: 6px;
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
        <Instagram size={12} style={{ flexShrink: 0, opacity: 0.9, color: '#E1306C' }} />
      ) : (
        <Linkedin size={12} style={{ flexShrink: 0, opacity: 0.7, color: '#0A66C2' }} />
      )}
    </a>
  );
}
