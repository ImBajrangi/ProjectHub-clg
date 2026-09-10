'use client';

import React, { useState } from 'react';
import { Linkedin, ExternalLink, Code2 } from 'lucide-react';

export default function Footer() {
  const developers = [
    {
      name: 'Arpit Pandey',
      role: 'BCA (DS) 3rd Year',
      university: 'GLA University',
      linkedin: 'https://www.linkedin.com/in/dev-arpit/',
      image: '/image/arpit.png',
      initials: 'AP',
    },
    {
      name: 'Rishabh Mishra',
      role: 'BCA (DS) 3rd Year',
      university: 'GLA University',
      linkedin: 'https://www.linkedin.com/in/rishabh-mishra-bab420309/',
      image: '/image/rishabh.png',
      initials: 'RM',
    },
    {
      name: 'Harsh Sharma',
      role: 'BCA (DS) 3rd Year',
      university: 'GLA University',
      linkedin: 'https://www.linkedin.com/in/harshiitm/',
      image: '/image/harsh.png',
      initials: 'HS',
    },
  ];

  return (
    <footer
      style={{
        backgroundColor: '#FFFFFF',
        color: 'var(--color-ink)',
        borderRadius: '24px 24px 0 0',
        padding: '52px 24px 32px',
        marginTop: 'auto',
        borderTop: '1px solid var(--color-hairline)',
        boxShadow: '0 -4px 24px rgba(0, 0, 0, 0.02)',
      }}
      className="site-footer"
    >
      <div className="container" style={{ maxWidth: '1160px', margin: '0 auto' }}>
        {/* Header Block */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 16px',
              borderRadius: '9999px',
              backgroundColor: 'var(--color-canvas-soft)',
              border: '1px solid var(--color-hairline)',
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--color-ink)',
              marginBottom: '14px',
            }}
          >
            <Code2 size={14} color="var(--color-ink)" /> Developed by CodeShastra Team
          </div>
          <h3
            style={{
              fontSize: 'clamp(22px, 3vw, 28px)',
              fontWeight: 700,
              letterSpacing: '-0.025em',
              color: 'var(--color-ink)',
              marginBottom: '8px',
            }}
          >
            Engineering Academic Excellence
          </h3>
          <p
            style={{
              color: 'var(--color-text-muted)',
              fontSize: '13px',
              maxWidth: '520px',
              margin: '0 auto',
              lineHeight: '1.5',
            }}
          >
            Built for the Department of Computer Applications, GLA University, to streamline milestone governance and project evaluations.
          </p>
        </div>

        {/* 3 Separate LinkedIn Cards with Profile Pictures */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '20px',
            marginBottom: '40px',
          }}
          className="developer-cards-grid"
        >
          {developers.map((dev) => (
            <DeveloperCard key={dev.name} dev={dev} />
          ))}
        </div>

        {/* Bottom Credits */}
        <div
          style={{
            borderTop: '1px solid var(--color-hairline)',
            paddingTop: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            fontSize: '12px',
            color: 'var(--color-text-muted)',
          }}
          className="footer-bottom-bar"
        >
          <div>
            © {new Date().getFullYear()} CodeShastra ProjectHub. Institutional Academic Project Management.
          </div>
          <div>
            GLA University • Odd Sem 2026–27 Research Project Groups
          </div>
        </div>
      </div>

      <style jsx global>{`
        .dev-profile-card {
          background-color: #FFFFFF;
          border: 1px solid var(--color-hairline);
          border-radius: 16px;
          padding: 22px 20px;
          display: flex;
          flex-direction: column;
          justifyContent: space-between;
          transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
        }
        .dev-profile-card:hover {
          border-color: var(--color-hairline-strong);
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
        }
        .linkedin-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          padding: 10px 16px;
          border-radius: 9999px;
          background-color: #0A66C2;
          color: #FFFFFF !important;
          font-size: 13px;
          font-weight: 600;
          text-decoration: none;
          transition: background-color 0.2s ease, transform 0.2s ease;
          box-sizing: border-box;
        }
        .linkedin-btn:hover {
          background-color: #004182 !important;
          transform: translateY(-1px);
        }
        .linkedin-btn * {
          color: #FFFFFF !important;
        }
        @media (max-width: 768px) {
          .site-footer {
            padding: 36px 16px 24px !important;
            border-radius: 16px 16px 0 0 !important;
          }
          .developer-cards-grid {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }
          .footer-bottom-bar {
            flex-direction: column !important;
            text-align: center !important;
            gap: 8px !important;
          }
        }
      `}</style>
    </footer>
  );
}

function DeveloperCard({ dev }: { dev: any }) {
  const [imgError, setImgError] = useState(false);

  return (
    <div className="dev-profile-card">
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '18px' }}>
        {/* Profile Picture with Initials Fallback */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          {!imgError ? (
            <img
              src={dev.image}
              alt={dev.name}
              onError={() => setImgError(true)}
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '2px solid #FFFFFF',
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
                display: 'block',
              }}
            />
          ) : (
            <div
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-canvas-soft)',
                color: 'var(--color-ink)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '16px',
                border: '1px solid var(--color-hairline)',
              }}
            >
              {dev.initials}
            </div>
          )}
        </div>

        <div>
          <h4 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-ink)', marginBottom: '2px' }}>
            {dev.name}
          </h4>
          <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 500 }}>
            {dev.role}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-faint)' }}>
            {dev.university}
          </div>
        </div>
      </div>

      <a
        href={dev.linkedin}
        target="_blank"
        rel="noopener noreferrer"
        className="linkedin-btn"
      >
        <Linkedin size={15} />
        <span>Visit LinkedIn</span>
        <ExternalLink size={13} style={{ opacity: 0.85 }} />
      </a>
    </div>
  );
}
