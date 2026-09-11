'use client';

import React from 'react';

export type GraphicType = 'search' | 'panels' | 'meetings' | 'roster' | 'compliance' | 'attendance' | 'notifications' | 'general';

interface EmptyStateGraphicProps {
  type?: GraphicType;
  title: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  actionIcon?: React.ReactNode;
  secondaryText?: string;
  style?: React.CSSProperties;
}

export default function EmptyStateGraphic({
  type = 'general',
  title,
  description,
  actionText,
  onAction,
  actionIcon,
  secondaryText,
  style,
}: EmptyStateGraphicProps) {
  const renderIllustration = () => {
    switch (type) {
      case 'search':
        return (
          <div style={{ position: 'relative', width: '80px', height: '80px', margin: '0 auto 16px' }}>
            <div
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, rgba(239, 246, 255, 0) 70%)',
                animation: 'pulse 2s infinite ease-in-out',
              }}
            />
            <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="36" cy="36" r="22" stroke="#2563EB" strokeWidth="3" strokeDasharray="3 3" fill="#EFF6FF" />
              <circle cx="36" cy="36" r="15" fill="#DBEAFE" />
              <path d="M52 52L68 68" stroke="#1D4ED8" strokeWidth="4.5" strokeLinecap="round" />
              <circle cx="68" cy="68" r="2.5" fill="#3B82F6" />
              <path d="M30 36H42M36 30V42" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" />
              <circle cx="43" cy="29" r="2" fill="#60A5FA" />
            </svg>
          </div>
        );

      case 'panels':
        return (
          <div style={{ position: 'relative', width: '88px', height: '80px', margin: '0 auto 16px' }}>
            <div
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '16px',
                background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, rgba(245, 243, 255, 0) 70%)',
              }}
            />
            <svg width="88" height="80" viewBox="0 0 88 80" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="14" y="16" width="60" height="48" rx="10" fill="#EEF2FF" stroke="#6366F1" strokeWidth="2.5" />
              <path d="M14 30H74" stroke="#818CF8" strokeWidth="2" strokeDasharray="2 2" />
              <rect x="22" y="38" width="16" height="18" rx="4" fill="#C7D2FE" />
              <rect x="42" y="38" width="24" height="6" rx="3" fill="#818CF8" />
              <rect x="42" y="48" width="16" height="6" rx="3" fill="#A5B4FC" />
              <circle cx="30" cy="16" r="4" fill="#4F46E5" />
              <circle cx="58" cy="16" r="4" fill="#4F46E5" />
              <path d="M66 10L72 16L66 22" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        );

      case 'meetings':
        return (
          <div style={{ position: 'relative', width: '84px', height: '80px', margin: '0 auto 16px' }}>
            <div
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, rgba(236, 253, 245, 0) 70%)',
              }}
            />
            <svg width="84" height="80" viewBox="0 0 84 80" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="16" y="18" width="52" height="46" rx="10" fill="#ECFDF5" stroke="#10B981" strokeWidth="2.5" />
              <path d="M16 32H68" stroke="#34D399" strokeWidth="2" />
              <circle cx="30" cy="18" r="3" fill="#059669" />
              <circle cx="54" cy="18" r="3" fill="#059669" />
              <circle cx="42" cy="46" r="12" fill="#D1FAE5" stroke="#059669" strokeWidth="2" />
              <path d="M42 39V46L46 48" stroke="#047857" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        );

      case 'roster':
        return (
          <div style={{ position: 'relative', width: '84px', height: '80px', margin: '0 auto 16px' }}>
            <div
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '14px',
                background: 'radial-gradient(circle, rgba(245, 158, 11, 0.15) 0%, rgba(254, 243, 199, 0) 70%)',
              }}
            />
            <svg width="84" height="80" viewBox="0 0 84 80" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="32" cy="30" r="10" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="2.2" />
              <circle cx="52" cy="30" r="10" fill="#FDE68A" stroke="#D97706" strokeWidth="2.2" />
              <path d="M18 56C18 48 24 46 32 46C40 46 46 48 46 56" stroke="#F59E0B" strokeWidth="2.2" strokeLinecap="round" fill="#FEF3C7" />
              <path d="M38 56C38 49 44 47 52 47C60 47 66 49 66 56" stroke="#D97706" strokeWidth="2.2" strokeLinecap="round" fill="#FDE68A" />
              <circle cx="62" cy="22" r="3" fill="#F59E0B" />
            </svg>
          </div>
        );

      case 'compliance':
        return (
          <div style={{ position: 'relative', width: '80px', height: '80px', margin: '0 auto 16px' }}>
            <div
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(16, 185, 129, 0.2) 0%, rgba(236, 253, 245, 0) 70%)',
              }}
            />
            <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M40 14L60 22V38C60 52 51 63 40 68C29 63 20 52 20 38V22L40 14Z"
                fill="#ECFDF5"
                stroke="#10B981"
                strokeWidth="2.8"
                strokeLinejoin="round"
              />
              <path d="M32 40L38 46L50 32" stroke="#059669" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        );

      case 'attendance':
        return (
          <div style={{ position: 'relative', width: '80px', height: '80px', margin: '0 auto 16px' }}>
            <div
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(14, 165, 233, 0.15) 0%, rgba(240, 249, 255, 0) 70%)',
              }}
            />
            <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="18" y="16" width="44" height="50" rx="8" fill="#F0F9FF" stroke="#0284C7" strokeWidth="2.5" />
              <path d="M28 28H52M28 38H44M28 48H48" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" />
              <circle cx="56" cy="54" r="10" fill="#E0F2FE" stroke="#0284C7" strokeWidth="2" />
              <path d="M52 54L55 57L61 51" stroke="#0369A1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        );

      default:
        return (
          <div style={{ position: 'relative', width: '76px', height: '76px', margin: '0 auto 16px' }}>
            <svg width="76" height="76" viewBox="0 0 76 76" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="14" y="14" width="48" height="48" rx="12" fill="#F8FAFC" stroke="#94A3B8" strokeWidth="2" strokeDasharray="3 3" />
              <circle cx="38" cy="38" r="12" fill="#E2E8F0" />
              <path d="M38 32V44M32 38H44" stroke="#64748B" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
        );
    }
  };

  return (
    <div
      className="empty-state-graphic-card"
      style={{
        padding: '38px 24px',
        textAlign: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        border: '1px dashed #CBD5E1',
        boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '10px 0',
        ...style,
      }}
    >
      {renderIllustration()}

      <h4 style={{ fontSize: '15.5px', fontWeight: 700, color: '#0F172A', margin: '0 0 6px' }}>
        {title}
      </h4>

      {description && (
        <p style={{ fontSize: '13px', color: '#64748B', maxWidth: '440px', margin: '0 auto 14px', lineHeight: 1.5 }}>
          {description}
        </p>
      )}

      {secondaryText && (
        <div style={{ fontSize: '11.5px', fontWeight: 600, color: '#94A3B8', marginBottom: '12px' }}>
          {secondaryText}
        </div>
      )}

      {actionText && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="btn btn-primary"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12.5px',
            fontWeight: 600,
            padding: '8px 18px',
            borderRadius: '9999px',
            boxShadow: '0 2px 8px rgba(37,99,235,0.25)',
            transition: 'all 0.15s ease',
          }}
        >
          {actionIcon}
          <span>{actionText}</span>
        </button>
      )}
    </div>
  );
}
