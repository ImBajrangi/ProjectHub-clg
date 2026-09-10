import { ImageResponse } from 'next/og';

export const alt = 'CodeShastra Hub | Academic Project Lifecycle & Milestone Evaluation';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '60px 70px',
          background: 'linear-gradient(135deg, #0E1713 0%, #17241E 45%, #2D4439 100%)',
          color: '#FFFFFF',
          fontFamily: 'sans-serif',
          position: 'relative',
        }}
      >
        {/* Subtle decorative border frame */}
        <div
          style={{
            position: 'absolute',
            top: 24,
            left: 24,
            right: 24,
            bottom: 24,
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '20px',
            display: 'flex',
          }}
        />

        {/* Top Header Row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '14px',
                background: '#23342C',
                border: '1px solid rgba(134, 239, 172, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span style={{ fontSize: '26px', fontWeight: 800, color: '#FFFFFF' }}>&lt;</span>
              <span style={{ fontSize: '28px', fontWeight: 800, color: '#86EFAC', margin: '0 2px' }}>/</span>
              <span style={{ fontSize: '26px', fontWeight: 800, color: '#FFFFFF' }}>&gt;</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '28px', fontWeight: 800, color: '#F8FAFC' }}>CodeShastra</span>
                <span style={{ fontSize: '28px', fontWeight: 500, color: '#94A3B8' }}>Hub</span>
              </div>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#86EFAC', letterSpacing: '2px' }}>
                DEPARTMENT OF DATA SCIENCE
              </span>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'rgba(52, 77, 65, 0.7)',
              border: '1px solid rgba(134, 239, 172, 0.3)',
              padding: '8px 20px',
              borderRadius: '999px',
            }}
          >
            <div
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '4px',
                backgroundColor: '#4ADE80',
                display: 'flex',
              }}
            />
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#D1FAE5', letterSpacing: '1px' }}>
              ACADEMIC CYCLE 2026
            </span>
          </div>
        </div>

        {/* Center Main Message */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '980px' }}>
          <div
            style={{
              fontSize: '56px',
              fontWeight: 800,
              lineHeight: 1.12,
              color: '#FFFFFF',
              letterSpacing: '-1px',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <span>Continuous Roster Sync.</span>
            <span style={{ color: '#86EFAC' }}>Zero Lost Submissions.</span>
          </div>
          <span
            style={{
              fontSize: '21px',
              color: '#CBD5E1',
              lineHeight: 1.4,
              fontWeight: 400,
            }}
          >
            Unified milestone submissions, verified faculty consultations, and conflict-free panel defenses.
          </span>
        </div>

        {/* Bottom Feature Badges & Credit */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
          }}
        >
          <div style={{ display: 'flex', gap: '12px' }}>
            <div
              style={{
                display: 'flex',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                padding: '10px 18px',
                borderRadius: '10px',
              }}
            >
              <span style={{ fontSize: '14px', fontWeight: 700, color: '#F1F5F9' }}>102 Project Teams</span>
            </div>
            <div
              style={{
                display: 'flex',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                padding: '10px 18px',
                borderRadius: '10px',
              }}
            >
              <span style={{ fontSize: '14px', fontWeight: 700, color: '#F1F5F9' }}>601 Students</span>
            </div>
            <div
              style={{
                display: 'flex',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                padding: '10px 18px',
                borderRadius: '10px',
              }}
            >
              <span style={{ fontSize: '14px', fontWeight: 700, color: '#F1F5F9' }}>23 Faculty Mentors</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '14px', color: '#94A3B8' }}>Partnership with</span>
            <span style={{ fontSize: '14px', fontWeight: 700, color: '#FFFFFF' }}>Vrindopnishad</span>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
