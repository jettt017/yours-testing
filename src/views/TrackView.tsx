import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Submission, SubmissionStatus, User, ViewType } from '../types';
import { ISubmissionRepository } from '../services/submissionRepository';

interface TrackViewProps {
  repository: ISubmissionRepository;
  currentUser: User | null;
  selectedId?: string;
  onNavigate: (view: ViewType) => void;
  onOpenAuth: (intent?: string) => void;
}

const STATUS_DISPLAY_TITLE: Record<SubmissionStatus, string> = {
  pending: 'Decision',
  review: 'Decision',
  approved: 'Approved',
  revision: 'Revision Required',
  rejected: 'Rejected',
};

const STATUS_TAG_LABELS: Record<SubmissionStatus, string> = {
  pending: 'Pending',
  review: 'Under Review',
  approved: 'Approved',
  revision: 'Revision Required',
  rejected: 'Rejected',
};

export const TrackView: React.FC<TrackViewProps> = ({
  repository,
  currentUser,
  selectedId,
  onNavigate,
  onOpenAuth,
}) => {
  const [userSubmissions, setUserSubmissions] = useState<Submission[]>([]);
  const [selectedSub, setSelectedSub] = useState<Submission | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Modern horizontal scroll carousel state
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 6);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 6);
  }, []);

  useEffect(() => {
    updateScrollState();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', updateScrollState, { passive: true });
    window.addEventListener('resize', updateScrollState);
    return () => {
      el.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
    };
  }, [updateScrollState, userSubmissions]);

  const scrollHorizontally = (delta: number) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: delta, behavior: 'smooth' });
    }
  };

  const loadUserSubmissions = useCallback(async () => {
    if (!currentUser) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const all = await repository.getAll();
      const userMatches = all.filter(
        (s) => s.email.trim().toLowerCase() === currentUser.email.trim().toLowerCase()
      );
      setUserSubmissions(userMatches);
      if (userMatches.length > 0) {
        const found = selectedId
          ? userMatches.find((s) => s.id === selectedId) || userMatches[0]
          : userMatches[0];
        setSelectedSub(found);
      } else {
        setSelectedSub(null);
      }
    } catch (err) {
      console.error('Failed to load user submissions', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, repository, selectedId]);

  useEffect(() => {
    loadUserSubmissions();
  }, [loadUserSubmissions]);

  if (!currentUser) {
    return (
      <main className="main-container" style={{ textAlign: 'center', padding: '80px 20px' }}>
        <div className="glass-panel" style={{ padding: '48px 24px', maxWidth: '560px', margin: '0 auto' }}>
          <h2 className="font-headline" style={{ fontSize: '32px', margin: '0 0 12px', color: 'var(--cb)' }}>
            Sign in to track
          </h2>
          <p style={{ color: 'var(--bk)', fontSize: '15px', marginBottom: '28px' }}>
            Sign in with your creator account to automatically view the real-time review progress and feedback for your submissions.
          </p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => onOpenAuth('Sign in to track your submissions.')}
          >
            [ SIGN IN TO YOUR ACCOUNT ]
          </button>
        </div>
      </main>
    );
  }

  // Node helper
  const getNodeState = (nodeIndex: 0 | 1 | 2, currentStatus: SubmissionStatus) => {
    if (nodeIndex === 0) return 'done';
    if (nodeIndex === 1) {
      if (currentStatus === 'pending') return 'upcoming';
      if (currentStatus === 'review') return 'current';
      return 'done';
    }
    if (nodeIndex === 2) {
      if (currentStatus === 'pending' || currentStatus === 'review') return 'upcoming';
      if (currentStatus === 'approved') return 'done';
      if (currentStatus === 'revision' || currentStatus === 'rejected') return 'alert';
    }
    return 'upcoming';
  };

  return (
    <main className="main-container" style={{ maxWidth: '840px' }}>
      <div className="track-header-actions">
        <div>
          <h2 className="page-title">My Submissions</h2>
          <p className="page-subtitle" style={{ margin: 0 }}>
            Tracking for {currentUser.name} ({currentUser.email})
          </p>
        </div>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => onNavigate('submit')}
          style={{ fontSize: '13px' }}
        >
          [ + SUBMIT NEW ARTWORK ]
        </button>
      </div>

      {isLoading ? (
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--mt)' }}>
          Loading your submissions...
        </div>
      ) : userSubmissions.length === 0 ? (
        <div className="glass-panel" style={{ padding: '48px 24px', textAlign: 'center' }}>
          <h3 className="font-headline" style={{ fontSize: '24px', margin: '0 0 10px', color: 'var(--bk)' }}>
            No submissions yet
          </h3>
          <p style={{ color: 'var(--mt)', fontSize: '15px', maxWidth: '420px', margin: '0 auto 24px' }}>
            You haven't submitted any artworks under this account yet. Ready to send your artwork for editorial curation?
          </p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => onNavigate('submit')}
          >
            [ SUBMIT YOUR ARTWORK ↗ ]
          </button>
        </div>
      ) : (
        <div>
          {/* If multiple submissions, modern smooth scrollable pill carousel */}
          {userSubmissions.length > 1 && (
            <div className="carousel-scroll-wrapper">
              {/* Left Scroll Chevron Button (Desktop Only) */}
              {canScrollLeft && (
                <button
                  type="button"
                  onClick={() => scrollHorizontally(-220)}
                  aria-label="Scroll left"
                  className="carousel-chevron-desktop"
                  style={{
                    position: 'absolute',
                    left: '-12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    zIndex: 10,
                    width: '34px',
                    height: '34px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--card-bg)',
                    border: '1px solid var(--panel-border)',
                    color: 'var(--bk)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 6px 16px rgba(0, 0, 0, 0.1)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>
              )}

              {/* Scrollable Container with Soft Edge Fade Mask */}
              <div
                ref={scrollRef}
                className="hide-scrollbar"
                style={{
                  display: 'flex',
                  gap: '10px',
                  overflowX: 'auto',
                  padding: '6px 4px',
                  scrollBehavior: 'smooth',
                  WebkitOverflowScrolling: 'touch',
                  WebkitMaskImage:
                    canScrollLeft && canScrollRight
                      ? 'linear-gradient(to right, transparent 0%, black 28px, black calc(100% - 28px), transparent 100%)'
                      : canScrollRight
                      ? 'linear-gradient(to right, black calc(100% - 36px), transparent 100%)'
                      : canScrollLeft
                      ? 'linear-gradient(to right, transparent 0%, black 36px)'
                      : 'none',
                  maskImage:
                    canScrollLeft && canScrollRight
                      ? 'linear-gradient(to right, transparent 0%, black 28px, black calc(100% - 28px), transparent 100%)'
                      : canScrollRight
                      ? 'linear-gradient(to right, black calc(100% - 36px), transparent 100%)'
                      : canScrollLeft
                      ? 'linear-gradient(to right, transparent 0%, black 36px)'
                      : 'none',
                }}
              >
                {userSubmissions.map((sub) => {
                  const isSelected = selectedSub?.id === sub.id;
                  return (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={(e) => {
                        setSelectedSub(sub);
                        (e.currentTarget as HTMLElement).scrollIntoView({
                          behavior: 'smooth',
                          inline: 'center',
                          block: 'nearest',
                        });
                      }}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        borderRadius: '999px',
                        padding: '8px 18px',
                        border: isSelected
                          ? '1px solid var(--cb)'
                          : '1px solid var(--panel-border)',
                        backgroundColor: isSelected
                          ? 'var(--tab-active-bg)'
                          : 'var(--card-bg)',
                        backdropFilter: 'blur(14px)',
                        WebkitBackdropFilter: 'blur(14px)',
                        color: isSelected ? 'var(--cb)' : 'var(--bk)',
                        fontWeight: 600,
                        fontSize: '13px',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                        maxWidth: 'min(280px, 85vw)',
                        boxShadow: isSelected
                          ? '0 4px 16px rgba(0, 0, 114, 0.14)'
                          : '0 2px 8px rgba(0, 0, 0, 0.04)',
                        transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
                      }}
                    >
                      {/* Status indicator dot */}
                      <span
                        style={{
                          width: '7px',
                          height: '7px',
                          borderRadius: '50%',
                          backgroundColor:
                            sub.status === 'approved'
                              ? '#10b981'
                              : sub.status === 'review'
                              ? 'var(--cb)'
                              : sub.status === 'revision'
                              ? 'var(--rd)'
                              : sub.status === 'rejected'
                              ? 'var(--mt)'
                              : '#f59e0b',
                          flexShrink: 0,
                        }}
                      />
                      <span
                        style={{
                          maxWidth: '140px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          lineHeight: 1.2,
                        }}
                      >
                        {sub.title}
                      </span>
                      <span
                        style={{
                          fontSize: '11px',
                          opacity: 0.65,
                          fontWeight: 500,
                          letterSpacing: '0.02em',
                        }}
                      >
                        {sub.id.replace('#ART-2026-', '#')}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Right Scroll Chevron Button (Desktop Only) */}
              {canScrollRight && (
                <button
                  type="button"
                  onClick={() => scrollHorizontally(220)}
                  aria-label="Scroll right"
                  className="carousel-chevron-desktop"
                  style={{
                    position: 'absolute',
                    right: '-12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    zIndex: 10,
                    width: '34px',
                    height: '34px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--card-bg)',
                    border: '1px solid var(--panel-border)',
                    color: 'var(--bk)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 6px 16px rgba(0, 0, 0, 0.1)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              )}
            </div>
          )}

          {/* Active Submission Card with Fluid Typography & Word Breaking */}
          {selectedSub && (
            <div className="glass-panel track-detail-card">
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  flexWrap: 'wrap',
                  gap: '14px',
                  marginBottom: '26px',
                }}
              >
                <div style={{ flex: '1 1 200px', minWidth: 0 }}>
                  <h3
                    className="font-headline"
                    style={{
                      fontSize: 'clamp(24px, 5.5vw, 34px)',
                      margin: '0 0 8px',
                      color: 'var(--bk)',
                      wordBreak: 'break-word',
                      overflowWrap: 'anywhere',
                      lineHeight: 1.18,
                    }}
                  >
                    {selectedSub.title}
                  </h3>
                  <div
                    style={{
                      fontSize: '14px',
                      color: 'var(--mt)',
                      wordBreak: 'break-word',
                      overflowWrap: 'anywhere',
                      lineHeight: 1.4,
                    }}
                  >
                    {selectedSub.id} · {selectedSub.cat} {selectedSub.year && `(${selectedSub.year})`}
                  </div>
                </div>

                <span
                  className={`status-tag status-${selectedSub.status}`}
                  style={{ alignSelf: 'flex-start', flexShrink: 0 }}
                >
                  {STATUS_TAG_LABELS[selectedSub.status]}
                </span>
              </div>

              {/* Vertical Timeline */}
              <div style={{ margin: '32px 0 20px' }}>
                {/* Step 1: Submitted */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '32px 1fr',
                    gap: '16px',
                    minHeight: '80px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                    }}
                  >
                    <div
                      style={{
                        width: '14px',
                        height: '14px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--cb)',
                        border: '2px solid var(--cb)',
                        flexShrink: 0,
                        marginTop: '4px',
                      }}
                    />
                    <div
                      style={{
                        flex: 1,
                        width: 0,
                        borderLeft: '2px dotted var(--timeline-line)',
                        margin: '4px 0',
                      }}
                    />
                  </div>
                  <div style={{ paddingBottom: '16px' }}>
                    <b
                      className="font-headline"
                      style={{ fontSize: '18px', color: 'var(--bk)', display: 'block' }}
                    >
                      Submitted
                    </b>
                    <span style={{ color: 'var(--mt)', fontSize: '14px' }}>
                      Received on {selectedSub.date}
                    </span>
                  </div>
                </div>

                {/* Step 2: Under Review */}
                {(() => {
                  const nodeState = getNodeState(1, selectedSub.status);
                  return (
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '32px 1fr',
                        gap: '16px',
                        minHeight: '80px',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                        }}
                      >
                        <div
                          style={{
                            width: '14px',
                            height: '14px',
                            borderRadius: '50%',
                            backgroundColor:
                              nodeState === 'done'
                                ? 'var(--cb)'
                                : 'var(--wh)',
                            border:
                              nodeState === 'upcoming'
                                ? '2px solid var(--ln)'
                                : '2px solid var(--cb)',
                            boxShadow:
                              nodeState === 'current'
                                ? '0 0 0 4px rgba(0, 0, 114, 0.12)'
                                : 'none',
                            flexShrink: 0,
                            marginTop: '4px',
                          }}
                        />
                        <div
                          style={{
                            flex: 1,
                            width: 0,
                            borderLeft: '2px dotted var(--timeline-line)',
                            margin: '4px 0',
                          }}
                        />
                      </div>
                      <div style={{ paddingBottom: '16px' }}>
                        <b
                          className="font-headline"
                          style={{
                            fontSize: '18px',
                            color: nodeState === 'upcoming' ? 'var(--mt)' : 'var(--bk)',
                            display: 'block',
                          }}
                        >
                          Under Review
                        </b>
                        <span style={{ color: 'var(--mt)', fontSize: '14px' }}>
                          {selectedSub.status === 'pending'
                            ? 'Your submission is queued for curation.'
                            : 'A curator is actively reviewing your submission files.'}
                        </span>
                      </div>
                    </div>
                  );
                })()}

                {/* Step 3: Decision */}
                {(() => {
                  const nodeState = getNodeState(2, selectedSub.status);
                  const isDecided = ['approved', 'revision', 'rejected'].includes(selectedSub.status);
                  const label = STATUS_DISPLAY_TITLE[selectedSub.status];

                  return (
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '32px 1fr',
                        gap: '16px',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                        }}
                      >
                        <div
                          style={{
                            width: '14px',
                            height: '14px',
                            borderRadius: '50%',
                            backgroundColor:
                              nodeState === 'done'
                                ? 'var(--cb)'
                                : nodeState === 'alert'
                                ? 'var(--rd)'
                                : 'var(--wh)',
                            border:
                              nodeState === 'done'
                                ? '2px solid var(--cb)'
                                : nodeState === 'alert'
                                ? '2px solid var(--rd)'
                                : '2px solid var(--ln)',
                            flexShrink: 0,
                            marginTop: '4px',
                          }}
                        />
                      </div>
                      <div>
                        <b
                          className="font-headline"
                          style={{
                            fontSize: '18px',
                            color:
                              nodeState === 'alert'
                                ? 'var(--rd)'
                                : nodeState === 'upcoming'
                                ? 'var(--mt)'
                                : 'var(--bk)',
                            display: 'block',
                          }}
                        >
                          {label}
                        </b>
                        <span style={{ color: 'var(--mt)', fontSize: '14px' }}>
                          {isDecided
                            ? `Curator marked as ${label.toLowerCase()}.`
                            : 'Approved, revision required, or rejected.'}
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Revision Required Callout */}
              {selectedSub.status === 'revision' && (
                <div
                  className="track-revision-box"
                  style={{
                    border: '1px solid rgba(229, 48, 58, 0.35)',
                    backgroundColor: 'rgba(229, 48, 58, 0.08)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    boxShadow: '0 8px 24px rgba(229, 48, 58, 0.08)',
                    borderRadius: '16px',
                    marginTop: '28px',
                  }}
                >
                  <h4
                    className="font-headline"
                    style={{
                      margin: '0 0 8px',
                      color: 'var(--rd)',
                      fontSize: '20px',
                      fontWeight: 500,
                    }}
                  >
                    Revision required
                  </h4>
                  <b style={{ display: 'block', marginBottom: '6px', fontSize: '14px' }}>
                    Curator notes:
                  </b>
                  <div
                    style={{
                      color: 'var(--bk)',
                      fontSize: '15px',
                      lineHeight: 1.6,
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {selectedSub.note || 'No notes provided.'}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </main>
  );
};
