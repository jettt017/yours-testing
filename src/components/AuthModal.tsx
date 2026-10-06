import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { authService } from '../services/authService';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: User) => void;
  intentMessage?: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  intentMessage,
}) => {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setError('');
      setName('');
      setEmail('');
      setPassword('');
    }
  }, [isOpen, tab]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (tab === 'register' && !name.trim()) {
      setError('Please enter your name.');
      return;
    }
    if (!email.trim()) {
      setError('Please enter your email.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }
    if (tab === 'register' && password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setIsLoading(true);
    try {
      let user: User;
      if (tab === 'login') {
        user = await authService.login(email, password);
      } else {
        user = await authService.register(name, email, password);
      }
      onSuccess(user);
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Authentication failed. Please check your credentials.');
      }
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(20, 22, 31, 0.45)',
        padding: '16px',
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div
        className="glass-panel"
        style={{
          width: 'min(440px, 100%)',
          padding: '32px 28px',
          position: 'relative',
        }}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close modal"
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'none',
            border: 'none',
            fontSize: '18px',
            cursor: 'pointer',
            color: 'var(--mt)',
          }}
        >
          ✕
        </button>

        {/* Title */}
        <h3
          id="auth-modal-title"
          className="font-headline"
          style={{
            fontSize: '26px',
            margin: '0 0 6px',
            color: 'var(--cb)',
          }}
        >
          {tab === 'login' ? 'Sign in to yours.' : 'Create your account'}
        </h3>

        {intentMessage && (
          <p style={{ margin: '0 0 18px', fontSize: '13px', color: 'var(--mt)' }}>
            {intentMessage}
          </p>
        )}

        {/* Tab Toggle */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            margin: '16px 0 20px',
            borderBottom: '1px solid var(--ln)',
            paddingBottom: '8px',
          }}
        >
          <button
            type="button"
            onClick={() => setTab('login')}
            style={{
              background: 'none',
              border: 'none',
              padding: '6px 12px',
              fontFamily: 'var(--font-body)',
              fontSize: '14px',
              fontWeight: tab === 'login' ? 700 : 500,
              color: tab === 'login' ? 'var(--cb)' : 'var(--mt)',
              cursor: 'pointer',
              borderBottom: tab === 'login' ? '2px solid var(--cb)' : '2px solid transparent',
              marginBottom: '-9px',
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setTab('register')}
            style={{
              background: 'none',
              border: 'none',
              padding: '6px 12px',
              fontFamily: 'var(--font-body)',
              fontSize: '14px',
              fontWeight: tab === 'register' ? 700 : 500,
              color: tab === 'register' ? 'var(--cb)' : 'var(--mt)',
              cursor: 'pointer',
              borderBottom: tab === 'register' ? '2px solid var(--cb)' : '2px solid transparent',
              marginBottom: '-9px',
            }}
          >
            Create Account
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate>
          {tab === 'register' && (
            <div style={{ marginBottom: '14px' }}>
              <label htmlFor="auth-name" className="field-label">
                Full Name *
              </label>
              <input
                id="auth-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Rani Wulandari"
              />
            </div>
          )}

          <div style={{ marginBottom: '14px' }}>
            <label htmlFor="auth-email" className="field-label">
              Email *
            </label>
            <input
              id="auth-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@mail.com"
            />
          </div>

          <div style={{ marginBottom: '6px' }}>
            <label htmlFor="auth-password" className="field-label">
              Password * {tab === 'register' && <span style={{ fontSize: '11px', color: 'var(--mt)', fontWeight: 400 }}>(min. 8 characters)</span>}
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="auth-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{ paddingRight: '56px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'var(--mt)',
                  cursor: 'pointer',
                  padding: '4px 6px',
                  letterSpacing: '0.02em',
                }}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? 'HIDE' : 'SHOW'}
              </button>
            </div>
          </div>

          <div className="field-error">{error}</div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '14px' }}
            disabled={isLoading}
          >
            {isLoading
              ? 'Authenticating...'
              : tab === 'login'
              ? '[ SIGN IN → ]'
              : '[ CREATE ACCOUNT → ]'}
          </button>
        </form>


      </div>
    </div>
  );
};
