import React, { useEffect } from 'react';
import { Submission, SubmissionStatus } from '../types';
import { useTheme } from '../context/ThemeContext';

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
  const { isDark } = useTheme();

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
    <div
      className="drawer-backdrop-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="drawer-submission-title"
    >
      {/* Floating Centered Modal Card */}
      <aside
        role="document"
        className="glass-panel drawer-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="drawer-header">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: '12px',
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2
                id="drawer-submission-title"
                className="font-headline"
                style={{
                  fontSize: 'clamp(20px, 3.5vw, 24px)',
                  margin: '0 0 6px',
                  color: 'var(--bk)',
                  wordBreak: 'break-word',
                  overflowWrap: 'anywhere',
                  lineHeight: 1.25,
                }}
              >
                {submission.title}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
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
              className="drawer-close-btn"
              onClick={onClose}
              aria-label="Close dialog"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="drawer-body">
          {/* Data Table */}
          <div className="table-container" style={{ margin: '0 0 20px' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                background: 'transparent',
                fontSize: '13.5px',
              }}
            >
              <tbody>
                {fields.map(([label, val]) => (
                  <tr key={label} style={{ borderBottom: '1px solid var(--ln)' }}>
                    <td
                      style={{
                        padding: '11px 8px',
                        color: 'var(--mt)',
                        fontWeight: 600,
                        width: '34%',
                        verticalAlign: 'top',
                      }}
                    >
                      {label}
                    </td>
                    <td
                      style={{
                        padding: '11px 8px',
                        color: 'var(--bk)',
                        wordBreak: 'break-word',
                        overflowWrap: 'anywhere',
                        verticalAlign: 'top',
                      }}
                    >
                      {label === 'Portfolio' && val !== '—' ? (
                        <a
                          href={val}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: 'var(--cb)', wordBreak: 'break-all' }}
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
                borderRadius: '12px',
                backgroundColor: isDark ? 'rgba(255, 38, 47, 0.08)' : 'rgba(0, 0, 114, 0.05)',
                marginBottom: '20px',
                fontSize: '13.5px',
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
          <div style={{ marginBottom: '14px' }}>
            <a
              href={submission.link}
              target="_blank"
              rel="noopener noreferrer"
              className="curator-drive-btn"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
              <span>Open Google Drive</span>
            </a>
          </div>
        </div>

        {/* Fixed Pinned Footer Actions */}
        <div className="drawer-footer">
          <div
            style={{
              fontSize: '11px',
              fontWeight: 700,
              textTransform: 'uppercase',
              color: 'var(--mt)',
              letterSpacing: '0.06em',
              marginBottom: '10px',
            }}
          >
            Curator Actions
          </div>
          <div className="drawer-actions-grid">
            <button
              type="button"
              className="curator-btn curator-btn-approve"
              onClick={() => onAction('approved')}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>Approve</span>
            </button>

            <button
              type="button"
              className="curator-btn curator-btn-revision"
              onClick={onRequestRevision}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
              <span>Request Revision</span>
            </button>

            <button
              type="button"
              className="curator-btn curator-btn-review"
              onClick={() => onAction('review')}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span>Mark Review</span>
            </button>

            <button
              type="button"
              className="curator-btn curator-btn-reject"
              onClick={() => onAction('rejected')}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
              <span>Reject</span>
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
};
