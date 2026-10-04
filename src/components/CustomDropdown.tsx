import React, { useState, useRef, useEffect } from 'react';

export interface DropdownOption {
  value: string;
  label: string;
  count?: number;
  icon?: React.ReactNode;
}

interface CustomDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  labelPrefix?: string;
  icon?: React.ReactNode;
  placeholder?: string;
  align?: 'left' | 'right';
  menuWidth?: string | number;
  style?: React.CSSProperties;
}

export const CustomDropdown: React.FC<CustomDropdownProps> = ({
  value,
  onChange,
  options,
  labelPrefix,
  icon,
  placeholder = 'Select option',
  align = 'left',
  menuWidth,
  style,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        display: 'inline-block',
        ...style,
      }}
    >
      {/* Trigger Button */}
      <button
        type="button"
        className={`custom-dropdown-trigger ${isOpen ? 'is-open' : ''}`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        {/* Leading Icon */}
        {icon && (
          <span style={{ display: 'inline-flex', color: 'var(--mt)', flexShrink: 0 }}>
            {icon}
          </span>
        )}

        {/* Selected Label */}
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          {labelPrefix && (
            <span style={{ color: 'var(--mt)', fontWeight: 400 }}>{labelPrefix}:</span>
          )}
          <span style={{ fontWeight: 600 }}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          {typeof selectedOption?.count === 'number' && (
            <span
              style={{
                fontSize: '11px',
                color: 'var(--mt)',
                background: 'rgba(0,0,0,0.05)',
                padding: '1px 6px',
                borderRadius: '999px',
                marginLeft: '2px',
              }}
            >
              {selectedOption.count}
            </span>
          )}
        </span>

        {/* Trailing Chevron SVG Icon */}
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            color: 'var(--mt)',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.15s ease',
            marginLeft: '4px',
            flexShrink: 0,
          }}
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Floating Dropdown Menu */}
      {isOpen && (
        <div
          role="listbox"
          className="custom-dropdown-menu"
          style={{
            [align]: 0,
            minWidth: menuWidth || '190px',
            maxWidth: 'calc(100vw - 32px)',
          }}
        >
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <div
                key={opt.value}
                role="option"
                aria-selected={isSelected}
                className={`custom-dropdown-item ${isSelected ? 'is-selected' : ''}`}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                  {opt.icon && (
                    <span style={{ display: 'inline-flex', flexShrink: 0 }}>
                      {opt.icon}
                    </span>
                  )}
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {opt.label}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                  {typeof opt.count === 'number' && (
                    <span
                      style={{
                        fontSize: '11px',
                        color: 'var(--mt)',
                        padding: '1px 6px',
                        borderRadius: '999px',
                        background: 'rgba(0, 0, 0, 0.05)',
                      }}
                    >
                      {opt.count}
                    </span>
                  )}
                  {isSelected && (
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{ color: 'var(--cb)' }}
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
