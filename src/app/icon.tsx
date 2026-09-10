import { ImageResponse } from 'next/og';

export const size = {
  width: 32,
  height: 32,
};
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #23342C 0%, #344D41 100%)',
          borderRadius: '8px',
          color: '#FFFFFF',
          fontSize: 16,
          fontWeight: 800,
          letterSpacing: '-1px',
          boxShadow: 'inset 0 0 0 1px rgba(255, 255, 255, 0.2)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1px' }}>
          <span style={{ color: '#FFFFFF', fontSize: 13, fontWeight: 700 }}>&lt;</span>
          <span style={{ color: '#86EFAC', fontSize: 14, fontWeight: 800, margin: '0 1px' }}>/</span>
          <span style={{ color: '#FFFFFF', fontSize: 13, fontWeight: 700 }}>&gt;</span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
