// components/MatrixRain.tsx
import { useEffect, useRef } from 'react';

interface MatrixRainProps {
  className?: string;
}

const MatrixRain: React.FC<MatrixRainProps> = ({ className }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const generateRandomString = (length: number) => {
      const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ¥₿#*!アカサタナハマヤラワ';
      return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    };

    const createColumn = (index: number) => {
      const column = document.createElement('div');
      column.className = 'matrix-column';
      column.style.left = `${index * 20}px`; // Matches --matrix-column-gap
      column.style.setProperty('--animation-duration', `${Math.random() * 8 + 6}s`); // 6-14s
      column.style.setProperty('--animation-delay', `${Math.random() * 5}s`); // 0-5s delay

      // Generate multiple characters for the column
      const charCount = Math.floor(window.innerHeight / 16) + 10; // Approx. chars to cover screen height
      for (let i = 0; i < charCount; i++) {
        const char = document.createElement('span');
        char.className = 'matrix-char';
        char.textContent = generateRandomString(1);
        // Randomly apply accent color to some characters
        if (Math.random() < 0.1) {
          char.classList.add('matrix-accent');
        }
        column.appendChild(char);
      }

      return column;
    };

    const updateColumns = () => {
      const columnGap = 20; // Matches --matrix-column-gap
      const columnCount = Math.floor(window.innerWidth / columnGap) + 1; // Ensure full coverage
      container.innerHTML = ''; // Clear existing columns

      for (let i = 0; i < columnCount; i++) {
        container.appendChild(createColumn(i));
      }
    };

    updateColumns();
    window.addEventListener('resize', updateColumns);

    // Respect prefers-reduced-motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleReducedMotion = () => {
      if (mediaQuery.matches) {
        container.innerHTML = ''; // Clear columns
        console.log('[MatrixRain] Animation stopped due to prefers-reduced-motion');
      } else {
        updateColumns();
      }
    };
    mediaQuery.addEventListener('change', handleReducedMotion);
    handleReducedMotion();

    return () => {
      window.removeEventListener('resize', updateColumns);
      mediaQuery.removeEventListener('change', handleReducedMotion);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`absolute top-0 left-0 w-full h-full pointer-events-none cypherpunk-loading-container ${className}`}
      style={{ zIndex: 1 }}
    />
  );
};

export default MatrixRain;