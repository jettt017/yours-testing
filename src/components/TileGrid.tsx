import React, { useMemo } from 'react';
import { useTheme } from '../context/ThemeContext';

interface TileGridProps {
  cols: number;
  rows: number;
  shape?: 'circle' | 'square';
  className?: string;
}

export const TileGrid: React.FC<TileGridProps> = ({
  cols,
  rows,
  shape = 'circle',
  className = '',
}) => {
  const { isDark } = useTheme();
  const isCircle = shape === 'circle';

  // Deterministic calculation for all tiles
  const tiles = useMemo(() => {
    const list: { bg: string; key: string }[] = [];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        // Deterministic PRNG formula based on row and col coordinates
        const n =
          Math.abs(Math.sin((r + 1) * 12.9898 + (c + 1) * 78.233) * 43758.5453) % 1;

        // a = row/(rows-1)*1.15 - abs(col/(cols-1) - 0.78)*0.6 + (n-0.5)*0.45
        let a =
          (r / (rows - 1)) * 1.15 -
          Math.abs(c / (cols - 1) - 0.78) * 0.6 +
          (n - 0.5) * 0.45;

        // clamp a to [0,1]; if a < 0.14 then a = 0.
        a = Math.max(0, Math.min(1, a));
        if (a < 0.14) {
          a = 0;
        }

        // Color & Translucency
        let bg: string;
        if (isCircle) {
          if (isDark) {
            // Translucent red dots in dark mode echoing the art poster palette
            const alpha = (0.03 + a * 0.22).toFixed(3);
            bg = a > 0
              ? `rgba(255, 38, 47, ${alpha})`
              : 'transparent';
          } else {
            // Subtle, ethereal translucent dots in light mode
            const alpha = (0.025 + a * 0.16).toFixed(3);
            const lightness = Math.round(92 - a * 18);
            bg = a > 0
              ? `hsla(240, 70%, ${lightness}%, ${alpha})`
              : 'rgba(255, 255, 255, 0.12)';
          }
        } else {
          // Standard tile
          bg = isDark
            ? (a > 0 ? `rgba(255, 38, 47, ${(0.05 + a * 0.25).toFixed(3)})` : 'transparent')
            : (a > 0
                ? `hsla(240, 95%, ${Math.round(90 - a * 44)}%, ${(0.3 + a * 0.65).toFixed(3)})`
                : 'rgba(255, 255, 255, 0.35)');
        }

        list.push({ bg, key: `${r}-${c}` });
      }
    }

    return list;
  }, [cols, rows, isCircle, isDark]);

  return (
    <div
      className={`tile-grid-container ${className}`}
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: '60%',
        zIndex: 0,
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gap: isCircle ? '3px' : '5px',
        alignContent: 'end',
        overflow: 'hidden',
        pointerEvents: 'none',
        filter: isCircle ? 'blur(0.5px)' : 'blur(1.4px)',
        WebkitMaskImage: 'linear-gradient(to top, #000000 35%, transparent)',
        maskImage: 'linear-gradient(to top, #000000 35%, transparent)',
        padding: isCircle ? '0 8px' : '0',
      }}
      aria-hidden="true"
    >
      {tiles.map((tile) => (
        <i
          key={tile.key}
          style={{
            display: 'block',
            aspectRatio: '1 / 1',
            borderRadius: isCircle ? '50%' : '10px',
            backgroundColor: tile.bg,
            transform: isCircle ? 'scale(0.82)' : 'scale(1)',
            boxShadow: isDark
              ? 'none'
              : isCircle
              ? 'inset 0 0 0 1px rgba(255, 255, 255, 0.4), inset 0 2px 5px rgba(255, 255, 255, 0.2)'
              : 'inset 0 0 0 1px rgba(255, 255, 255, 0.55), inset 0 10px 16px rgba(255, 255, 255, 0.35)',
            transition: 'all 0.15s ease',
          }}
        />
      ))}
    </div>
  );
};
