import React, { useEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';

export interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  type?: 'confirm' | 'alert' | 'danger';
  onConfirm: () => void;
  onCancel?: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel,
  cancelLabel = 'Cancel',
  isDestructive = false,
  type = 'confirm',
  onConfirm,
  onCancel,
}) => {
  const { isDark } = useTheme();
  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  const isDanger = isDestructive || type === 'danger';
  const isAlertOnly = type === 'alert';

  // Default labels
  const finalConfirmLabel = confirmLabel || (isAlertOnly ? 'OK' : isDanger ? 'Delete' : 'Confirm');

  // Focus confirmation button when opened
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => confirmBtnRef.current?.focus(), 40);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        if (onCancel) {
          onCancel();
        } else {
          onConfirm();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel, onConfirm]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: isDark ? 'rgba(0, 0, 40, 0.65)' : 'rgba(20, 22, 31, 0.45)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        padding: '16px',
        animation: 'modalBackdropFade 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      }}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      aria-describedby="confirm-modal-desc"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          if (onCancel) onCancel();
          else onConfirm();
        }
      }}
    >
      <style>{`
        @keyframes modalBackdropFade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modalDialogPop {
          0% {
            opacity: 0;
            transform: scale(0.94) translateY(8px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>

      <div
        className="glass-panel"
        style={{
          width: 'min(440px, 100%)',
          padding: '28px 24px 24px',
          borderRadius: '24px',
          position: 'relative',
          boxShadow: isDark
            ? '0 24px 64px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(255, 255, 255, 0.15) inset'
            : '0 24px 64px rgba(0, 0, 114, 0.16), 0 0 0 1px rgba(255, 255, 255, 0.8) inset',
          animation: 'modalDialogPop 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        }}
      >
        {/* Top Header Row with Icon Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              backgroundColor: isDanger
                ? 'rgba(255, 38, 47, 0.12)'
                : 'rgba(0, 0, 114, 0.1)',
              color: isDanger ? 'var(--accent-red)' : 'var(--cb)',
              border: isDanger
                ? '1px solid rgba(255, 38, 47, 0.25)'
                : '1px solid rgba(0, 0, 114, 0.2)',
            }}
          >
            {isDanger ? (
              // Warning / Trash Icon
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            ) : isAlertOnly ? (
              // Info / Notice Icon
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
            ) : (
              // Question / Help Icon
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            )}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <h3
              id="confirm-modal-title"
              className="font-headline"
              style={{
                fontSize: '20px',
                fontWeight: 700,
                margin: 0,
                color: 'var(--bk)',
                letterSpacing: '-0.02em',
                lineHeight: 1.25,
                wordBreak: 'break-word',
              }}
            >
              {title}
            </h3>
          </div>
        </div>

        {/* Message Content */}
        <p
          id="confirm-modal-desc"
          style={{
            fontSize: '14px',
            lineHeight: 1.55,
            color: 'var(--mt)',
            margin: '0 0 24px',
            wordBreak: 'break-word',
            paddingLeft: '2px',
          }}
        >
          {message}
        </p>

        {/* Action Buttons */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: '10px',
            flexWrap: 'wrap',
          }}
        >
          {!isAlertOnly && onCancel && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onCancel}
              style={{
                padding: '9px 18px',
                fontSize: '13px',
                borderRadius: '999px',
              }}
            >
              {cancelLabel}
            </button>
          )}

          <button
            ref={confirmBtnRef}
            type="button"
            className={isDanger ? 'btn' : 'btn btn-primary'}
            onClick={onConfirm}
            style={{
              padding: '9px 22px',
              fontSize: '13px',
              borderRadius: '999px',
              fontWeight: 600,
              backgroundColor: isDanger ? 'var(--accent-red)' : undefined,
              color: isDanger ? '#ffffff' : undefined,
              border: isDanger ? 'none' : undefined,
              boxShadow: isDanger ? '0 4px 14px rgba(255, 38, 47, 0.35)' : undefined,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {finalConfirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
