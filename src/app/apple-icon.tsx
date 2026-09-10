import { ImageResponse } from 'next/og';

export const size = {
  width: 180,
  height: 180,
};
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #1A2721 0%, #344D41 100%)',
          borderRadius: '40px',
          boxShadow: 'inset 0 0 0 2px rgba(255, 255, 255, 0.15)',
          position: 'relative',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
            fontSize: 72,
            fontFamily: 'monospace',
            fontWeight: 800,
          }}
        >
          <span style={{ color: '#FFFFFF' }}>&lt;</span>
          <span style={{ color: '#86EFAC', margin: '0 4px' }}>/</span>
          <span style={{ color: '#FFFFFF' }}>&gt;</span>
        </div>
        <div
          style={{
            position: 'absolute',
            top: 26,
            right: 26,
            width: 16,
            height: 16,
            borderRadius: 8,
            backgroundColor: '#4ADE80',
            border: '3px solid #1A2721',
          }}
        />
      </div>
    ),
    {
      ...size,
    }
  );
}
