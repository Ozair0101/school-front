import React, { useEffect, useRef } from 'react';

interface ConfettiEffectProps {
  active: boolean;
  duration?: number;
  colors?: string[];
}

const ConfettiEffect: React.FC<ConfettiEffectProps> = ({
  active,
  duration = 3000,
  colors = ['#13a4ec', '#facc15', '#4ade80', '#f87171', '#a78bfa']
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!active || !containerRef.current) return;

    const container = containerRef.current;
    container.innerHTML = '';

    const createConfetti = () => {
      for (let i = 0; i < 100; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = `${Math.random() * 100}vw`;
        confetti.style.animationDuration = `${Math.random() * 2 + 3}s`;
        confetti.style.animationDelay = `${Math.random() * 2}s`;
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.width = `${Math.random() * 8 + 6}px`;
        confetti.style.height = confetti.style.width;
        confetti.style.opacity = String(Math.random());
        
        container.appendChild(confetti);
      }
    };

    createConfetti();

    const timer = setTimeout(() => {
      container.innerHTML = '';
    }, duration);

    return () => {
      clearTimeout(timer);
      if (container) {
        container.innerHTML = '';
      }
    };
  }, [active, duration, colors]);

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 pointer-events-none z-50"
    />
  );
};

export default ConfettiEffect;
