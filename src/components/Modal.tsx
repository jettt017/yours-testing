import React, { useEffect, useState, useRef } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (feedback: string) => void;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      setFeedback('');
      setError('');
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.trim()) {
      setError('Write what the artist should change.');
      return;
    }
    onSubmit(feedback.trim());
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10005,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(20, 22, 31, 0.5)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        padding: '16px',
        animation: 'modalBackdropFade 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: 'min(480px, 100%)',
          padding: '28px',
          borderRadius: '24px',
          position: 'relative',
          boxShadow: '0 24px 64px rgba(0, 0, 70, 0.25)',
          animation: 'modalDialogPop 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3
          id="modal-title"
          className="font-headline"
          style={{
            margin: '0 0 16px',
            fontSize: '24px',
            color: 'var(--cb)',
          }}
        >
          Request revision
        </h3>

        <form onSubmit={handleSubmit} noValidate>
          <label htmlFor="modal-feedback" className="field-label">
            Feedback for the artist *
          </label>
          <textarea
            id="modal-feedback"
            ref={textareaRef}
            rows={5}
            value={feedback}
            onChange={(e) => {
              setFeedback(e.target.value);
              if (error) setError('');
            }}
            className={error ? 'is-invalid' : ''}
            placeholder="Specify missing items, privacy settings, or requested artistic adjustments..."
          />
          <div className="field-error">{error}</div>

          <div
            style={{
              display: 'flex',
              gap: '10px',
              marginTop: '16px',
              flexWrap: 'wrap',
            }}
          >
            <button
              type="submit"
              className="btn btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
              <span>Send Revision Request</span>
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
