import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';

export interface LogoLoaderProps {
  /** Size in pixels for the logo icon (default: 64) */
  size?: number;
  /** Optional status text shown below the logo */
  label?: string;
  /** Whether to show full-screen frosted glass overlay */
  fullScreen?: boolean;
  /** Optional callback to close or dismiss (if used as modal) */
  onClose?: () => void;
  /** Show the brand wordmark with typewriter animation */
  showBrandText?: boolean;
  /** Smooth fade-out state when loading finishes */
  fadeOut?: boolean;
  /** Typing speed tempo (fast for snappy page transitions, normal for initial loads) */
  speed?: 'normal' | 'fast';
}

export const LogoLoader: React.FC<LogoLoaderProps> = ({
  size = 64,
  label = 'Memproses kurasi karya seni',
  fullScreen = false,
  showBrandText = true,
  fadeOut = false,
  speed = 'normal',
}) => {
  const { isDark } = useTheme();
  // Typewriter state for "yours..."
  const fullWord = 'yours...';
  const [displayText, setDisplayText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const charDelay = speed === 'fast' ? 48 : 95;
  const backDelay = speed === 'fast' ? 32 : 50;
  const holdDelay = speed === 'fast' ? 600 : 900;

  useEffect(() => {
    let timer: number;

    if (!isDeleting) {
      if (displayText.length < fullWord.length) {
        // Typing forward
        timer = window.setTimeout(() => {
          setDisplayText(fullWord.slice(0, displayText.length + 1));
        }, charDelay);
      } else {
        // Hold on complete "yours..." before deleting
        timer = window.setTimeout(() => {
          setIsDeleting(true);
        }, holdDelay);
      }
    } else {
      if (displayText.length > 0) {
        // Deleting backward
        timer = window.setTimeout(() => {
          setDisplayText(fullWord.slice(0, displayText.length - 1));
        }, backDelay);
      } else {
        // Hold on empty before re-typing
        timer = window.setTimeout(() => {
          setIsDeleting(false);
        }, 220);
      }
    }

    return () => clearTimeout(timer);
  }, [displayText, isDeleting, fullWord, charDelay, backDelay, holdDelay]);

  const content = (
    <div
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
        userSelect: 'none',
      }}
    >
      <style>{`
        /* Smooth gentle floating for the authentic logo */
        @keyframes yoursLogoFloat {
          0%, 100% {
            transform: translateY(0) scale(1);
            filter: drop-shadow(0 4px 12px rgba(0, 0, 114, 0.12));
          }
          50% {
            transform: translateY(-6px) scale(1.04);
            filter: drop-shadow(0 12px 24px rgba(0, 0, 114, 0.22));
          }
        }

        /* Clean typewriter cursor blink */
        @keyframes yoursCursorBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }

        /* Silky smooth overlay entrance */
        @keyframes loaderOverlayFadeIn {
          from {
            opacity: 0;
            backdrop-filter: blur(2px);
            -webkit-backdrop-filter: blur(2px);
          }
          to {
            opacity: 1;
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
          }
        }
      `}</style>

      {/* 100% Original Official Logo without any shape modifications or card box */}
      <div
        style={{
          position: 'relative',
          width: `${size}px`,
          height: `${size}px`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <img
          src={isDark ? '/LogoWhite.png' : '/Logo.png'}
          alt="yours. logo"
          style={{
            width: `${size}px`,
            height: `${size}px`,
            objectFit: 'contain',
            display: 'block',
            animation: 'yoursLogoFloat 2.6s ease-in-out infinite',
            pointerEvents: 'none',
          }}
        />
      </div>

      {/* Typewriter Wordmark: "yours..." in solid black with blinking cursor */}
      <div style={{ textAlign: 'center' }}>
        {showBrandText && (
          <div
            style={{
              fontFamily: 'var(--font-headline)',
              fontWeight: 700,
              fontSize: '34px',
              letterSpacing: '-0.04em',
              color: 'var(--bk)',
              lineHeight: 1.1,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '40px',
              minWidth: '150px',
            }}
          >
            <span>{displayText}</span>
            {/* Blinking typewriter cursor */}
            <span
              style={{
                display: 'inline-block',
                width: '2.5px',
                height: '28px',
                backgroundColor: isDark ? 'var(--accent-red)' : 'var(--bk)',
                marginLeft: '3px',
                verticalAlign: 'middle',
                animation: 'yoursCursorBlink 0.8s ease-in-out infinite',
              }}
            />
          </div>
        )}

        {/* Minimal Editorial Subtitle */}
        {label && (
          <div
            style={{
              fontFamily: 'var(--font-primary)',
              fontSize: '13px',
              fontWeight: 500,
              color: 'var(--mt)',
              marginTop: '4px',
              letterSpacing: '0.01em',
            }}
          >
            {label}
          </div>
        )}
      </div>
    </div>
  );

  if (!fullScreen) {
    return content;
  }

  // Fullscreen frosted overlay without ANY white box shape container
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--backdrop-overlay)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        opacity: fadeOut ? 0 : 1,
        transition: 'opacity 0.28s cubic-bezier(0.4, 0, 0.2, 1), visibility 0.28s ease',
        visibility: fadeOut ? 'hidden' : 'visible',
        pointerEvents: fadeOut ? 'none' : 'auto',
        animation: 'loaderOverlayFadeIn 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Loading..."
    >
      {content}
    </div>
  );
};
