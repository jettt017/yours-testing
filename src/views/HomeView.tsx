import React from 'react';
import { TileGrid } from '../components/TileGrid';
import { ViewType, User } from '../types';

interface HomeViewProps {
  currentUser: User | null;
  onNavigate: (view: ViewType) => void;
  onOpenAuth: (intent?: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  currentUser,
  onNavigate,
  onOpenAuth,
}) => {
  const handleSubmitClick = () => {
    if (!currentUser) {
      onOpenAuth('Please sign in to submit your artwork.');
    } else if (currentUser.role === 'admin') {
      onNavigate('admin');
    } else {
      onNavigate('submit');
    }
  };

  const handleTrackClick = () => {
    if (!currentUser) {
      onOpenAuth('Please sign in to track your submissions.');
    } else if (currentUser.role === 'admin') {
      onNavigate('admin');
    } else {
      onNavigate('track');
    }
  };

  return (
    <div>
      {/* Hero Section */}
      <section
        style={{
          position: 'relative',
          padding: '40px 24px 120px',
          minHeight: '720px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        {/* Dot grid at bottom of hero: 28 cols x 14 rows (smaller & denser) */}
        <TileGrid cols={28} rows={14} shape="circle" />

        {/* Content above tile grid */}
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            maxWidth: '1100px',
            margin: '0 auto',
            width: '100%',
          }}
        >
          {/* Top-left small label */}
          <div
            className="small-label"
            style={{
              marginBottom: '48px',
            }}
          >
            Editorial<br />submissions
          </div>

          {/* Headline */}
          <h1
            className="font-headline"
            style={{
              fontSize: 'clamp(46px, 13vw, 168px)',
              lineHeight: 0.94,
              letterSpacing: '-0.045em',
              fontWeight: 600,
              margin: '0 0 28px',
            }}
          >
            <span className="headline-hero-title">
              Your art.
            </span>
            <span
              className="accent-gradient"
              style={{
                display: 'inline-block',
                paddingBottom: '0.12em',
                paddingRight: '0.08em',
                marginBottom: '-0.12em',
              }}
            >
              Your story.
            </span>
          </h1>

          {/* Manifesto */}
          <p
            style={{
              maxWidth: '440px',
              fontSize: '16px',
              lineHeight: 1.6,
              color: 'var(--bk)',
              margin: '0 0 36px',
            }}
          >
            yours. is a place to send us what you made. A curator reads every entry, tells you where it stands, and asks for changes when it needs them. Nothing disappears into an inbox.
          </p>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSubmitClick}
            >
              [ SUBMIT YOUR ARTWORK ↗ ]
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleTrackClick}
            >
              [ TRACK STATUS ]
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
