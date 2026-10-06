import React, { useRef } from 'react';
import { ViewType, User } from '../types';
import { VariableProximity } from '../components/VariableProximity';

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
  const headlineRef = useRef<HTMLHeadingElement>(null);

  const handleSubmitClick = () => {
    if (!currentUser) {
      onOpenAuth('Please sign in to submit your artwork.');
    } else if (currentUser.role === 'admin' || currentUser.role === 'superadmin') {
      onNavigate('admin');
    } else {
      onNavigate('submit');
    }
  };

  const handleTrackClick = () => {
    if (!currentUser) {
      onOpenAuth('Please sign in to track your submissions.');
    } else if (currentUser.role === 'admin' || currentUser.role === 'superadmin') {
      onNavigate('admin');
    } else {
      onNavigate('track');
    }
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="home-hero-section">
        {/* Content above background */}
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

          {/* Headline with Magnetic Variable Proximity Typography */}
          <h1
            ref={headlineRef}
            className="font-headline"
            style={{
              fontSize: 'clamp(46px, 13vw, 168px)',
              lineHeight: 0.94,
              letterSpacing: '-0.045em',
              fontWeight: 600,
              margin: '0 0 28px',
              position: 'relative',
              cursor: 'default',
            }}
          >
            <span className="headline-hero-title">
              <VariableProximity
                label="Your art."
                fromFontVariationSettings="'wght' 600, 'opsz' 24"
                toFontVariationSettings="'wght' 800, 'opsz' 96"
                containerRef={headlineRef}
                radius={160}
                falloff="gaussian"
              />
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
              <VariableProximity
                label="Your story."
                fromFontVariationSettings="'wght' 600, 'opsz' 24"
                toFontVariationSettings="'wght' 800, 'opsz' 96"
                containerRef={headlineRef}
                radius={160}
                falloff="gaussian"
              />
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
            yours is a place to send us what you made. A curator reads every entry, tells you where it stands, and asks for changes when it needs them. Nothing disappears into an inbox.
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

export default HomeView;
