'use client';

import React, { useState } from 'react';
import { Linkedin } from 'lucide-react';

export default function Footer() {
  const developers = [
    {
      name: 'Arpit Pandey',
      role: 'BCA (DS) 3rd Year',
      linkedin: 'https://www.linkedin.com/in/dev-arpit/',
      image: '/image/arpit.png',
      initials: 'AP',
    },
    {
      name: 'Rishabh Mishra',
      role: 'BCA (DS) 3rd Year',
      linkedin: 'https://www.linkedin.com/in/rishabh-mishra-bab420309/',
      image: '/image/rishabh.png',
      initials: 'RM',
    },
    {
      name: 'Harsh Sharma',
      role: 'BCA (DS) 3rd Year',
      linkedin: 'https://www.linkedin.com/in/harshiitm/',
      image: '/image/harsh.png',
      initials: 'HS',
    },
  ];

  return (
    <footer className="site-footer">
      <div className="container" style={{ maxWidth: '1160px', margin: '0 auto' }}>
        <div className="footer-content">
          {/* Left / Top: Subtle Project Info */}
          <div className="footer-brand-info">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--color-ink)' }}>
                CodeShastra ProjectHub
              </span>
              <span className="badge badge-neutral" style={{ fontSize: '10px', padding: '1px 6px' }}>
                GLA University
              </span>
            </div>
            <p style={{ fontSize: '11.5px', color: 'var(--color-text-faint)', marginTop: '3px' }}>
              Dept. of Computer Applications • Academic Milestone Governance
            </p>
          </div>

          {/* Right / Middle: Compact Developer Credits */}
          <div className="footer-devs-section">
            <span style={{ fontSize: '11px', color: 'var(--color-text-faint)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Crafted by
            </span>
            <div className="footer-devs-list">
              {developers.map((dev) => (
                <DeveloperPill key={dev.name} dev={dev} />
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Copyright Strip */}
        <div className="footer-bottom-strip">
          <span>© {new Date().getFullYear()} CodeShastra. Institutional Academic Project Portal.</span>
          <span>Odd Sem 2026–27 Research Groups</span>
        </div>
      </div>

      <style jsx global>{`
        .site-footer {
          background-color: #FFFFFF;
          border-top: 1px solid var(--color-hairline);
          padding: 24px 16px 18px;
          margin-top: auto;
        }
        .footer-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 16px;
          padding-bottom: 14px;
          border-bottom: 1px solid var(--color-hairline);
        }
        .footer-brand-info {
          flex: 1 1 240px;
        }
        .footer-devs-section {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }
        .footer-devs-list {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .dev-pill {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 3px 10px 3px 4px;
          background-color: var(--color-canvas-soft);
          border: 1px solid var(--color-hairline);
          border-radius: 9999px;
          text-decoration: none;
          color: var(--color-ink);
          font-size: 11.5px;
          font-weight: 600;
          transition: all 0.15s ease;
        }
        .dev-pill:hover {
          background-color: #EFF6FF;
          border-color: #BFDBFE;
          color: #1D4ED8;
        }
        .dev-pill-img {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          object-fit: cover;
          display: block;
        }
        .dev-pill-fallback {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: #E2E8F0;
          color: #475569;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 9px;
          font-weight: 700;
        }
        .footer-bottom-strip {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
          padding-top: 12px;
          font-size: 11px;
          color: var(--color-text-faint);
        }
        @media (max-width: 640px) {
          .site-footer {
            padding: 16px 12px 14px !important;
          }
          .footer-content {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
            padding-bottom: 12px;
          }
          .footer-devs-section {
            flex-direction: column;
            align-items: flex-start;
            gap: 6px;
            width: 100%;
          }
          .footer-devs-list {
            width: 100%;
          }
          .footer-bottom-strip {
            flex-direction: column;
            align-items: flex-start;
            gap: 4px;
          }
        }
      `}</style>
    </footer>
  );
}

function DeveloperPill({ dev }: { dev: any }) {
  const [imgError, setImgError] = useState(false);

  return (
    <a
      href={dev.linkedin}
      target="_blank"
      rel="noopener noreferrer"
      className="dev-pill"
      title={`${dev.name} • ${dev.role} (LinkedIn)`}
    >
      {!imgError ? (
        <img
          src={dev.image}
          alt={dev.name}
          onError={() => setImgError(true)}
          className="dev-pill-img"
        />
      ) : (
        <div className="dev-pill-fallback">{dev.initials}</div>
      )}
      <span>{dev.name}</span>
      <Linkedin size={11} style={{ opacity: 0.7, color: '#0A66C2' }} />
    </a>
  );
}
