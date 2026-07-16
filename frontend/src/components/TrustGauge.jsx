import React, { useEffect, useState } from 'react';
import { useAnalysisStore } from '../store/analysisStore';

export default function TrustGauge({ score = 0, size = 180, strokeWidth = 14 }) {
  const { language } = useAnalysisStore();
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    // Animate score count up on load
    const duration = 1200; // ms
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing out quadratic
      const easeProgress = progress * (2 - progress);
      setAnimatedScore(Math.floor(easeProgress * score));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [score]);

  // SVG Calculations
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference;

  // Determine colors based on score
  let strokeColor = 'var(--color-success)';
  let verdictTextEn = 'Credible';
  let verdictTextHi = 'विश्वसनीय';

  if (score < 40) {
    strokeColor = 'var(--color-danger)';
    verdictTextEn = 'Misleading';
    verdictTextHi = 'भ्रामक';
  } else if (score < 75) {
    strokeColor = 'var(--color-warning)';
    verdictTextEn = 'Caution';
    verdictTextHi = 'सावधान';
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      width: size,
      height: size
    }}>
      {/* SVG Arc Gauge */}
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* Track circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--border-color)"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 100ms ease-out' }}
        />
      </svg>

      {/* Internal Text Container */}
      <div style={{
        position: 'absolute',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center'
      }}>
        <span style={{
          fontSize: '2.5rem',
          fontFamily: 'var(--font-display)',
          fontWeight: 800,
          color: strokeColor,
          lineHeight: '1'
        }}>
          {animatedScore}%
        </span>
        <span style={{
          fontSize: '0.85rem',
          textTransform: 'uppercase',
          fontWeight: 700,
          color: 'var(--text-secondary)',
          marginTop: '4px',
          letterSpacing: '0.05em'
        }}>
          {language === 'en' ? verdictTextEn : verdictTextHi}
        </span>
      </div>
    </div>
  );
}
