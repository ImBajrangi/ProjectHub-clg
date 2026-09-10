'use client';

import React from 'react';

interface LoadingScreenProps {
  label?: string;
  sublabel?: string;
  fullScreen?: boolean;
}

export default function LoadingScreen({
  label = 'Loading workspace...',
  sublabel = 'Synchronizing project state & permissions',
  fullScreen = true,
}: LoadingScreenProps) {
  return (
    <div
      className={fullScreen ? 'page-loader' : ''}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: fullScreen ? '24px' : '48px 24px',
        width: '100%',
      }}
    >
      <div className="page-loader-card">
        {/* Animated Brand Emblem & Dual Orbit Ring */}
        <div
          style={{
            position: 'relative',
            width: '68px',
            height: '68px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Ambient Glow Aura */}
          <div
            style={{
              position: 'absolute',
              inset: '-10px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(52, 77, 65, 0.35) 0%, rgba(52, 77, 65, 0) 70%)',
              animation: 'glow-breathe 2.4s ease-in-out infinite',
              pointerEvents: 'none',
            }}
          />

          {/* Outer Orbital Ring */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              border: '2px dashed rgba(52, 77, 65, 0.25)',
              animation: 'orbit-spin 12s linear infinite',
            }}
          />

          {/* Active Gradient Accent Spinner */}
          <div
            style={{
              position: 'absolute',
              inset: '-2px',
              borderRadius: '50%',
              border: '2.5px solid transparent',
              borderTopColor: '#344D41',
              borderRightColor: '#52796F',
              animation: 'orbit-spin 0.9s cubic-bezier(0.5, 0.1, 0.4, 0.9) infinite',
            }}
          />

          {/* Secondary Reverse Orbit Micro Spinner */}
          <div
            style={{
              position: 'absolute',
              inset: '4px',
              borderRadius: '50%',
              border: '1.5px solid transparent',
              borderBottomColor: '#84A98C',
              opacity: 0.8,
              animation: 'orbit-spin-reverse 1.4s linear infinite',
            }}
          />

          {/* Center Brand Icon Badge in #344D41 */}
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: '#344D41',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(52, 77, 65, 0.35)',
              zIndex: 2,
              border: '1px solid rgba(255, 255, 255, 0.15)',
              position: 'relative',
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 7L3 12L8 17" stroke="#A3B18A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M16 7L21 12L16 17" stroke="#A3B18A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M14 4.5L10 19.5" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
            <span
              style={{
                position: 'absolute',
                top: '5px',
                right: '5px',
                width: '5px',
                height: '5px',
                borderRadius: '50%',
                backgroundColor: '#22C55E',
                boxShadow: '0 0 4px #22C55E',
              }}
            />
          </div>
        </div>

        {/* Text and Branding */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', textAlign: 'center' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '10px',
              fontWeight: 700,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              color: '#344D41',
              background: '#EAEFE9',
              padding: '3px 9px',
              borderRadius: '6px',
              border: '1px solid #D8DFD5',
              marginBottom: '2px',
            }}
          >
            CodeShastra Hub
          </div>
          <p className="page-loader-text" style={{ color: '#1B2D24', fontWeight: 700 }}>
            {label}
          </p>
          {sublabel && (
            <span
              style={{
                fontSize: '11px',
                color: '#52796F',
                fontWeight: 500,
                letterSpacing: '-0.01em',
              }}
            >
              {sublabel}
            </span>
          )}
        </div>

        {/* Indeterminate Shimmer Progress Bar in Theme Gradient */}
        <div
          style={{
            width: '130px',
            height: '3px',
            backgroundColor: '#EAEFE9',
            borderRadius: '9999px',
            overflow: 'hidden',
            position: 'relative',
            marginTop: '2px',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              height: '100%',
              width: '60%',
              background: 'linear-gradient(90deg, transparent 0%, #344D41 50%, #52796F 80%, transparent 100%)',
              borderRadius: '9999px',
              animation: 'shimmer-line 1.5s cubic-bezier(0.4, 0, 0.2, 1) infinite',
            }}
          />
        </div>
      </div>
    </div>
  );
}

