import React, { useState, useEffect } from 'react';
import { TileGrid } from '../components/TileGrid';
import { ViewType } from '../types';

interface SuccessViewProps {
  submissionId: string;
  submissionEmail: string;
  onNavigate: (view: ViewType) => void;
  onTrackPrefilled: (id: string, email: string) => void;
}

export const SuccessView: React.FC<SuccessViewProps> = ({
  submissionId,
  submissionEmail,
  onNavigate,
  onTrackPrefilled,
}) => {
  const [countdown, setCountdown] = useState(4);

  useEffect(() => {
    if (countdown <= 0) {
      onTrackPrefilled(submissionId, submissionEmail);
      return;
    }
    const timer = window.setTimeout(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [countdown, onTrackPrefilled, submissionId, submissionEmail]);

  return (
    <main className="main-container" style={{ maxWidth: '720px' }}>
      <div
        className="glass-panel"
        style={{
          position: 'relative',
          overflow: 'hidden',
          padding: '56px 24px 110px',
          textAlign: 'center',
          minHeight: '420px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Dot grid at bottom of success card */}
        <TileGrid cols={20} rows={8} shape="circle" />

        <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '540px' }}>
          {/* Received badge with send icon on the right */}
          <div style={{ marginBottom: '20px' }}>
            <span className="received-badge">
              <span>Submission Received</span>
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ transform: 'translate(1px, -0.5px)' }}
                aria-hidden="true"
              >
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </span>
          </div>

          {/* Warm Editorial Headline */}
          <h2
            className="font-headline accent-gradient"
            style={{
              fontSize: 'clamp(36px, 6vw, 56px)',
              fontWeight: 700,
              margin: '0 0 14px',
              letterSpacing: '-0.03em',
              lineHeight: 1.15,
            }}
          >
            Thank you!
          </h2>

          <p
            style={{
              fontSize: '17px',
              color: 'var(--bk)',
              margin: '0 auto 10px',
              lineHeight: 1.5,
              fontWeight: 500,
            }}
          >
            Your artwork has been successfully submitted for curation.
          </p>

          <p
            style={{
              fontSize: '14px',
              color: 'var(--mt)',
              margin: '0 auto 28px',
              lineHeight: 1.6,
            }}
          >
            Tim kurator akan segera meninjau karya Anda. Anda dapat langsung memantau status kurasi dan feedback di halaman <strong>My Submissions</strong>.
          </p>

          {/* Action Buttons */}
          <div
            style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'center',
              flexWrap: 'wrap',
              marginBottom: '20px',
            }}
          >
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => onTrackPrefilled(submissionId, submissionEmail)}
              style={{ padding: '12px 26px', fontSize: '13px' }}
            >
              [ GO TO MY SUBMISSIONS → ]
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => onNavigate('home')}
              style={{ padding: '12px 20px', fontSize: '13px' }}
            >
              [ HOME ]
            </button>
          </div>

          {/* Subtle auto-redirect timer indicator */}
          <div
            style={{
              fontSize: '12px',
              color: 'var(--mt)',
              letterSpacing: '0.01em',
            }}
          >
            Mengalihkan otomatis ke My Submissions dalam {countdown}s...
          </div>
        </div>
      </div>
    </main>
  );
};
