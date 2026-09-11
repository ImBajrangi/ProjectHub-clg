import Link from 'next/link';
import { Compass } from 'lucide-react';

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--color-canvas)',
        padding: '24px',
        textAlign: 'center',
        fontFamily: 'var(--font-sans)',
      }}
    >
      <div
        style={{
          maxWidth: '420px',
          padding: '36px 32px',
          backgroundColor: 'var(--color-surface)',
          borderRadius: '12px',
          border: '1px solid var(--color-hairline)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
        }}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: 'var(--color-canvas-soft)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-accent)',
            marginBottom: '16px',
          }}
        >
          <Compass size={24} />
        </div>
        <h2 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 8px 0', color: 'var(--color-ink)' }}>
          Page Not Found
        </h2>
        <p style={{ fontSize: '13.5px', color: 'var(--color-text-muted)', margin: '0 0 24px 0', lineHeight: 1.5 }}>
          The page or resource you are trying to access does not exist or has been moved.
        </p>
        <Link
          href="/"
          className="btn btn-primary"
          style={{
            display: 'inline-block',
            textDecoration: 'none',
            fontSize: '13px',
            padding: '8px 20px',
          }}
        >
          Return to ProjectHub
        </Link>
      </div>
    </div>
  );
}
