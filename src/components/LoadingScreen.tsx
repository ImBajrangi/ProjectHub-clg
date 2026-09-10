'use client';

import React from 'react';

interface LoadingScreenProps {
  label?: string;
}

export default function LoadingScreen({ label = 'Loading workspace...' }: LoadingScreenProps) {
  return (
    <div className="page-loader">
      <div className="page-loader-card">
        <div
          style={{
            position: 'relative',
            width: '38px',
            height: '38px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Subtle Outer Track */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              border: '3px solid #E2E8F0',
            }}
          />
          {/* Active Accent Spinner */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              border: '3px solid transparent',
              borderTopColor: '#2563EB',
              borderRightColor: '#2563EB',
              animation: 'spin 0.75s cubic-bezier(0.4, 0, 0.2, 1) infinite',
            }}
          />
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#1E40AF',
            }}
          />
        </div>
        <p className="page-loader-text">{label}</p>
      </div>
    </div>
  );
}
