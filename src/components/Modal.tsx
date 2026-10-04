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
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(20, 22, 31, 0.45)',
        padding: '16px',
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="glass-panel"
        style={{
          width: 'min(480px, 100%)',
          padding: '28px',
          position: 'relative',
        }}
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
            <button type="submit" className="btn btn-primary">
              [ SEND REVISION REQUEST ]
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              [ CANCEL ]
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
