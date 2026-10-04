import React, { useEffect } from 'react';
import { Submission, SubmissionStatus } from '../types';

interface DrawerProps {
  submission: Submission | null;
  isOpen: boolean;
  onClose: () => void;
  onAction: (status: SubmissionStatus) => void;
  onRequestRevision: () => void;
}

const STATUS_LABELS: Record<SubmissionStatus, string> = {
  pending: 'Pending',
  review: 'Under Review',
  approved: 'Approved',
  revision: 'Revision Required',
  rejected: 'Rejected',
};

export const Drawer: React.FC<DrawerProps> = ({
  submission,
  isOpen,
  onClose,
  onAction,
  onRequestRevision,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !submission) return null;

  const fields: [string, string][] = [
    ['ID', submission.id],
    ['Submitted Date', submission.date],
    ['Full Name', submission.name],
    ['Email', submission.email],
    ['WhatsApp', submission.wa],
    ['Institution', submission.inst || '—'],
    ['City', submission.city || '—'],
    ['Portfolio', submission.portfolio || '—'],
    ['Title', submission.title],
    ['Year', submission.year || '—'],
    ['Medium', submission.medium || '—'],
    ['Description', submission.desc],
    ['Category', submission.cat],
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(20, 22, 31, 0.35)',
          zIndex: 40,
        }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <aside
        role="dialog"
        aria-label="Submission details"
        aria-modal="true"
        className="glass-panel drawer-panel"
      >
        {/* Mobile Drag Indicator Handle */}
        <div
          style={{
            width: '40px',
            height: '4px',
            borderRadius: '999px',
            backgroundColor: 'var(--ln)',
            margin: '0 auto 16px',
          }}
          className="drawer-mobile-handle"
          aria-hidden="true"
        />
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '16px',
            gap: '12px',
          }}
        >
          <div>
            <h2
              className="font-headline"
              style={{
                fontSize: '28px',
                margin: '0 0 6px',
                color: 'var(--cb)',
              }}
            >
              {submission.title}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className={`status-tag status-${submission.status}`}>
                {STATUS_LABELS[submission.status]}
              </span>
              <span style={{ fontSize: '13px', color: 'var(--mt)' }}>
                {submission.id}
              </span>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            aria-label="Close drawer"
            style={{ padding: '8px 14px', minWidth: '40px' }}
          >
            ✕
          </button>
        </div>

        {/* Data Table */}
        <div className="table-container" style={{ margin: '20px 0' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              background: 'transparent',
              fontSize: '14px',
            }}
          >
            <tbody>
              {fields.map(([label, val]) => (
                <tr key={label} style={{ borderBottom: '1px solid var(--ln)' }}>
                  <td
                    style={{
                      padding: '10px 8px',
                      color: 'var(--mt)',
                      fontWeight: 700,
                      width: '35%',
                      verticalAlign: 'top',
                    }}
                  >
                    {label}
                  </td>
                  <td
                    style={{
                      padding: '10px 8px',
                      color: 'var(--bk)',
                      wordBreak: 'break-word',
                      verticalAlign: 'top',
                    }}
                  >
                    {label === 'Portfolio' && val !== '—' ? (
                      <a
                        href={val}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: 'var(--cb)' }}
                      >
                        {val}
                      </a>
                    ) : (
                      val
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Curator Notes if present */}
        {submission.note && (
          <div
            style={{
              border: '1px dashed var(--cb)',
              padding: '14px 16px',
              borderRadius: '10px',
              backgroundColor: '#f6f7ff',
              marginBottom: '20px',
              fontSize: '14px',
            }}
          >
            <b style={{ color: 'var(--cb)', display: 'block', marginBottom: '4px' }}>
              Current curator notes:
            </b>
            <div style={{ color: 'var(--bk)', whiteSpace: 'pre-wrap' }}>
              {submission.note}
            </div>
          </div>
        )}

        {/* Open Drive Link */}
        <div style={{ marginBottom: '24px' }}>
          <a
            href={submission.link}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary"
            style={{ width: '100%', textDecoration: 'none' }}
          >
            [ OPEN DRIVE ↗ ]
          </a>
        </div>

        {/* Action Buttons */}
        <div className="drawer-sticky-actions">
          <div
            style={{
              fontSize: '12px',
              fontWeight: 700,
              textTransform: 'uppercase',
              color: 'var(--mt)',
              marginBottom: '10px',
            }}
          >
            Curator Actions
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => onAction('review')}
            >
              Mark Review
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => onAction('approved')}
            >
              Approve
            </button>
            <button
              type="button"
              className="btn"
              style={{
                backgroundColor: '#fff0f0',
                color: 'var(--rd)',
                border: '1px solid var(--rd)',
              }}
              onClick={onRequestRevision}
            >
              Request Revision
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => onAction('rejected')}
            >
              Reject
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
