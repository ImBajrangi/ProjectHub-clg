import { ImageResponse } from 'next/og';

export const alt = 'CodeShastra Hub • Vrindopnishad | Academic Project Lifecycle & Milestone Evaluation';
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
          padding: '56px 64px',
          background: 'linear-gradient(135deg, #09130F 0%, #15241D 40%, #294035 100%)',
          color: '#FFFFFF',
          fontFamily: 'sans-serif',
          position: 'relative',
        }}
      >
        {/* Subtle decorative outer card border */}
        <div
          style={{
            position: 'absolute',
            top: 20,
            left: 20,
            right: 20,
            bottom: 20,
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '20px',
            display: 'flex',
          }}
        />

        {/* Top Header Bar: Corner Brand & Partnership Tag */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
          }}
        >
          {/* Top Left: CodeShastra Hub Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '14px',
                background: '#1F3127',
                border: '1.5px solid rgba(134, 239, 172, 0.4)',
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '30px', fontWeight: 800, color: '#F8FAFC', letterSpacing: '-0.5px' }}>
                  CodeShastra
                </span>
                <span style={{ fontSize: '30px', fontWeight: 500, color: '#94A3B8' }}>Hub</span>
              </div>
              <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#86EFAC', letterSpacing: '2px' }}>
                DEPARTMENT OF DATA SCIENCE • GLA
              </span>
            </div>
          </div>

          {/* Top Right: Vrindopnishad Partnership Badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              backgroundColor: 'rgba(35, 54, 44, 0.85)',
              border: '1.5px solid rgba(134, 239, 172, 0.35)',
              padding: '10px 22px',
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '13px', color: '#CBD5E1' }}>In Partnership with</span>
              <span style={{ fontSize: '14px', fontWeight: 800, color: '#86EFAC' }}>Vrindopnishad</span>
            </div>
          </div>
        </div>

        {/* Center Punchy Headline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '1000px' }}>
          <div
            style={{
              fontSize: '56px',
              fontWeight: 800,
              lineHeight: 1.1,
              color: '#FFFFFF',
              letterSpacing: '-1.5px',
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
              lineHeight: 1.45,
              fontWeight: 400,
            }}
          >
            Synchronized milestone management, verified consultation attendance, and conflict-free panel defense evaluations.
          </span>
        </div>

        {/* Bottom Bar: Stats Metrics & Academic Cycle */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
          }}
        >
          {/* Bottom Left: Audited Metrics */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <div
              style={{
                display: 'flex',
                background: 'rgba(255, 255, 255, 0.07)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                padding: '10px 20px',
                borderRadius: '10px',
              }}
            >
              <span style={{ fontSize: '14.5px', fontWeight: 700, color: '#F8FAFC' }}>102 Project Teams</span>
            </div>
            <div
              style={{
                display: 'flex',
                background: 'rgba(255, 255, 255, 0.07)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                padding: '10px 20px',
                borderRadius: '10px',
              }}
            >
              <span style={{ fontSize: '14.5px', fontWeight: 700, color: '#F8FAFC' }}>601 Students</span>
            </div>
            <div
              style={{
                display: 'flex',
                background: 'rgba(255, 255, 255, 0.07)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                padding: '10px 20px',
                borderRadius: '10px',
              }}
            >
              <span style={{ fontSize: '14.5px', fontWeight: 700, color: '#F8FAFC' }}>23 Faculty Mentors</span>
            </div>
          </div>

          {/* Bottom Right: Academic Cycle Tag */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(134, 239, 172, 0.1)',
              border: '1px solid rgba(134, 239, 172, 0.2)',
              padding: '8px 16px',
              borderRadius: '8px',
            }}
          >
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#86EFAC', letterSpacing: '1px' }}>
              ACADEMIC CYCLE 2026
            </span>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
