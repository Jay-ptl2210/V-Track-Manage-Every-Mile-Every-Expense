import React from 'react';

const ProgressBar = ({ progress = 0, label = '', type = 'upload' }) => {
  // Types: upload, download, processing
  const colorMap = {
    upload: 'linear-gradient(90deg, var(--color-primary) 0%, #a78bfa 100%)',
    download: 'linear-gradient(90deg, var(--color-secondary) 0%, #22d3ee 100%)',
    processing: 'linear-gradient(90deg, var(--color-accent-orange) 0%, #fdba74 100%)',
  };

  const shadowMap = {
    upload: '0 0 8px rgba(124, 58, 237, 0.5)',
    download: '0 0 8px rgba(6, 182, 212, 0.5)',
    processing: '0 0 8px rgba(249, 115, 22, 0.5)',
  };

  const pct = Math.min(Math.max(Math.round(progress), 0), 100);

  return (
    <div style={{ margin: '16px 0', width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem' }}>
        <span style={{ fontWeight: '500', color: 'var(--color-text-main)' }}>{label}</span>
        <span style={{ fontWeight: '600', color: 'var(--color-text-main)' }}>{pct}%</span>
      </div>
      <div
        style={{
          width: '100%',
          height: '8px',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '4px',
          overflow: 'hidden',
          border: '1px solid rgba(255, 255, 255, 0.05)',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${pct}%`,
            background: colorMap[type] || colorMap.upload,
            boxShadow: shadowMap[type] || shadowMap.upload,
            borderRadius: '4px',
            transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            position: 'relative',
          }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
