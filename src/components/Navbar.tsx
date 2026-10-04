import React, { useState, useEffect } from 'react';
import { ViewType, User } from '../types';
import { useTheme } from '../context/ThemeContext';
import { ThemeToggle } from './ThemeToggle';

interface NavbarProps {
  currentView: ViewType;
  adminTab?: 'curate' | 'categories' | 'users';
  currentUser: User | null;
  onNavigate: (view: ViewType) => void;
  onSelectAdminTab?: (tab: 'curate' | 'categories' | 'users') => void;
  onOpenAuth: (intent?: string) => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  adminTab = 'curate',
  currentUser,
  onNavigate,
  onSelectAdminTab,
  onOpenAuth,
  onLogout,
}) => {
  const { isDark } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isAdmin = currentUser?.role === 'admin';
  const isCreator = currentUser?.role === 'creator';

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileMenuOpen]);

  const handleNavClick = (view: ViewType) => {
    setIsMobileMenuOpen(false);
    onNavigate(view);
  };

  const handleAuthClick = (intent?: string) => {
    setIsMobileMenuOpen(false);
    onOpenAuth(intent);
  };

  const handleLogoutClick = () => {
    setIsMobileMenuOpen(false);
    onLogout();
  };

  return (
    <header style={{ position: 'relative', zIndex: 30 }}>
      <nav
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 24px',
          backgroundColor: 'transparent',
          gap: '12px',
        }}
        aria-label="Main Navigation"
      >
        {/* Logo button */}
        <button
          onClick={() => handleNavClick('home')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: 'none',
            border: 'none',
            padding: '4px 0',
            cursor: 'pointer',
            color: 'var(--bk)',
            fontSize: '26px',
            fontFamily: 'var(--font-headline)',
            fontWeight: 500,
            letterSpacing: '-0.045em',
          }}
          aria-label="yours home"
        >
          {/* Dynamic brand logo: LogoWhite.png in dark mode, Logo.png in light mode */}
          <img
            src={isDark ? '/LogoWhite.png' : '/Logo.png'}
            alt="yours logo"
            style={{
              height: '32px',
              width: '32px',
              objectFit: 'contain',
              display: 'block',
              flexShrink: 0,
            }}
          />
          <span>yours</span>
        </button>

        {/* Desktop Navigation (min-width: 681px) */}
        <div
          className="desktop-nav"
          style={{
            gap: '10px',
            alignItems: 'center',
          }}
        >
          {/* Role-Based Tabs */}
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }} role="tablist">
            {isAdmin ? (
              <>
                <button
                  role="tab"
                  aria-selected={currentView === 'admin' && adminTab === 'curate'}
                  onClick={() => {
                    onSelectAdminTab?.('curate');
                    handleNavClick('admin');
                  }}
                  style={{
                    borderRadius: '999px',
                    padding: '8px 18px',
                    border: 'none',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: 'var(--font-body)',
                    backgroundColor: currentView === 'admin' && adminTab === 'curate' ? 'var(--bk)' : 'var(--btn-sec-bg)',
                    color: currentView === 'admin' && adminTab === 'curate' ? 'var(--bg)' : 'var(--bk)',
                    transition: 'background-color 0.15s ease, color 0.15s ease',
                  }}
                >
                  Curate
                </button>

                <button
                  role="tab"
                  aria-selected={currentView === 'admin' && adminTab === 'categories'}
                  onClick={() => {
                    onSelectAdminTab?.('categories');
                    handleNavClick('admin');
                  }}
                  style={{
                    borderRadius: '999px',
                    padding: '8px 18px',
                    border: 'none',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: 'var(--font-body)',
                    backgroundColor: currentView === 'admin' && adminTab === 'categories' ? 'var(--bk)' : 'var(--btn-sec-bg)',
                    color: currentView === 'admin' && adminTab === 'categories' ? 'var(--bg)' : 'var(--bk)',
                    transition: 'background-color 0.15s ease, color 0.15s ease',
                  }}
                >
                  Category
                </button>

                <button
                  role="tab"
                  aria-selected={currentView === 'admin' && adminTab === 'users'}
                  onClick={() => {
                    onSelectAdminTab?.('users');
                    handleNavClick('admin');
                  }}
                  style={{
                    borderRadius: '999px',
                    padding: '8px 18px',
                    border: 'none',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: 'var(--font-body)',
                    backgroundColor: currentView === 'admin' && adminTab === 'users' ? 'var(--bk)' : 'var(--btn-sec-bg)',
                    color: currentView === 'admin' && adminTab === 'users' ? 'var(--bg)' : 'var(--bk)',
                    transition: 'background-color 0.15s ease, color 0.15s ease',
                  }}
                >
                  User
                </button>
              </>
            ) : (
              <>
                <button
                  role="tab"
                  aria-selected={currentView === 'submit'}
                  onClick={() => {
                    if (!currentUser) {
                      handleAuthClick('Please sign in to submit your artwork.');
                    } else {
                      handleNavClick('submit');
                    }
                  }}
                  style={{
                    borderRadius: '999px',
                    padding: '8px 18px',
                    border: 'none',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    fontFamily: 'var(--font-body)',
                    backgroundColor: currentView === 'submit' ? 'var(--bk)' : 'transparent',
                    color: currentView === 'submit' ? 'var(--bg)' : 'var(--mt)',
                    transition: 'background-color 0.15s ease, color 0.15s ease',
                  }}
                >
                  Submit
                </button>

                <button
                  role="tab"
                  aria-selected={currentView === 'track'}
                  onClick={() => {
                    if (!currentUser) {
                      handleAuthClick('Please sign in to track your submissions.');
                    } else {
                      handleNavClick('track');
                    }
                  }}
                  style={{
                    borderRadius: '999px',
                    padding: '8px 18px',
                    border: 'none',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    fontFamily: 'var(--font-body)',
                    backgroundColor: currentView === 'track' ? 'var(--bk)' : 'transparent',
                    color: currentView === 'track' ? 'var(--bg)' : 'var(--mt)',
                    transition: 'background-color 0.15s ease, color 0.15s ease',
                  }}
                >
                  {isCreator ? 'My Submissions' : 'Track'}
                </button>
              </>
            )}
          </div>

          {/* Theme Toggle (Desktop) */}
          <ThemeToggle />

          {/* User Status / Auth Button */}
          <div>
            {currentUser ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    backgroundColor: 'var(--card-bg)',
                    border: '1px solid var(--ln)',
                    borderRadius: '999px',
                    padding: '6px 14px',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: 'var(--bk)',
                  }}
                >
                  {/* Outline Profile Icon (Kosongan) */}
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ color: 'var(--mt)', flexShrink: 0 }}
                    aria-hidden="true"
                  >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  {currentUser.name} {isAdmin && '(Admin)'}
                </span>

                <button
                  type="button"
                  onClick={handleLogoutClick}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '13px',
                    color: 'var(--mt)',
                    cursor: 'pointer',
                    padding: '6px 10px',
                    textDecoration: 'underline',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  Logout
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => handleAuthClick()}
                style={{ padding: '8px 18px', fontSize: '13px' }}
              >
                [ Log in ]
              </button>
            )}
          </div>
        </div>

        {/* Mobile Header Controls: Theme Toggle & Hamburger */}
        <div
          className="mobile-nav-toggle"
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <ThemeToggle />
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isMobileMenuOpen}
            style={{
              padding: '8px 14px',
              fontSize: '16px',
              borderRadius: '999px',
              minWidth: '44px',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {isMobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>
      </nav>

      {/* Mobile Dropdown Menu */}
      {isMobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(20, 22, 31, 0.25)',
              zIndex: 31,
            }}
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Menu Panel */}
          <div
            className="glass-panel"
            style={{
              position: 'absolute',
              top: 'calc(100% - 4px)',
              left: '16px',
              right: '16px',
              zIndex: 32,
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              boxShadow: '0 12px 32px rgba(0, 0, 0, 0.08), 0 0 0 1px var(--ln)',
            }}
          >
            {/* User Profile Info in Mobile */}
            {currentUser ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingBottom: '12px',
                  borderBottom: '1px solid var(--ln)',
                }}
              >
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: 'var(--bk)',
                  }}
                >
                  {/* Outline Profile Icon (Kosongan) */}
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ color: 'var(--mt)', flexShrink: 0 }}
                    aria-hidden="true"
                  >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  {currentUser.name} {isAdmin && '(Admin)'}
                </span>

                <button
                  type="button"
                  onClick={handleLogoutClick}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '13px',
                    color: 'var(--rd)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                >
                  Logout
                </button>
              </div>
            ) : (
              <div style={{ paddingBottom: '12px', borderBottom: '1px solid var(--ln)' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => handleAuthClick()}
                  style={{ width: '100%' }}
                >
                  [ Log in / Sign up ]
                </button>
              </div>
            )}

            {/* Role-Based Nav Links */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {isAdmin ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectAdminTab?.('curate');
                      handleNavClick('admin');
                    }}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      border: 'none',
                      backgroundColor: currentView === 'admin' && adminTab === 'curate' ? 'var(--bk)' : 'var(--btn-sec-bg)',
                      color: currentView === 'admin' && adminTab === 'curate' ? 'var(--bg)' : 'var(--bk)',
                      fontWeight: 600,
                      fontSize: '15px',
                      fontFamily: 'var(--font-body)',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <span>Curate</span>
                    <span>→</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onSelectAdminTab?.('categories');
                      handleNavClick('admin');
                    }}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      border: 'none',
                      backgroundColor: currentView === 'admin' && adminTab === 'categories' ? 'var(--bk)' : 'var(--btn-sec-bg)',
                      color: currentView === 'admin' && adminTab === 'categories' ? 'var(--bg)' : 'var(--bk)',
                      fontWeight: 600,
                      fontSize: '15px',
                      fontFamily: 'var(--font-body)',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <span>Category</span>
                    <span>→</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onSelectAdminTab?.('users');
                      handleNavClick('admin');
                    }}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      border: 'none',
                      backgroundColor: currentView === 'admin' && adminTab === 'users' ? 'var(--bk)' : 'var(--btn-sec-bg)',
                      color: currentView === 'admin' && adminTab === 'users' ? 'var(--bg)' : 'var(--bk)',
                      fontWeight: 600,
                      fontSize: '15px',
                      fontFamily: 'var(--font-body)',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <span>User</span>
                    <span>→</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      if (!currentUser) {
                        handleAuthClick('Please sign in to submit your artwork.');
                      } else {
                        handleNavClick('submit');
                      }
                    }}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      border: 'none',
                      backgroundColor: currentView === 'submit' ? 'var(--bk)' : 'var(--btn-sec-bg)',
                      color: currentView === 'submit' ? 'var(--bg)' : 'var(--bk)',
                      fontWeight: 600,
                      fontSize: '15px',
                      fontFamily: 'var(--font-body)',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <span>Submit Artwork</span>
                    <span>↗</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (!currentUser) {
                        handleAuthClick('Please sign in to track your submissions.');
                      } else {
                        handleNavClick('track');
                      }
                    }}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      border: 'none',
                      backgroundColor: currentView === 'track' ? 'var(--bk)' : 'var(--btn-sec-bg)',
                      color: currentView === 'track' ? 'var(--bg)' : 'var(--bk)',
                      fontWeight: 600,
                      fontSize: '15px',
                      fontFamily: 'var(--font-body)',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <span>{isCreator ? 'My Submissions' : 'Track Status'}</span>
                    <span>→</span>
                  </button>
                </>
              )}
            </div>

            {/* Mobile Menu Theme Toggle Row */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 16px',
                borderRadius: '12px',
                backgroundColor: 'var(--tab-active-bg)',
                border: '1px solid var(--ln)',
              }}
            >
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--bk)' }}>
                Theme ({isDark ? 'Dark' : 'Light'})
              </span>
              <ThemeToggle />
            </div>
          </div>
        </>
      )}
    </header>
  );
};
