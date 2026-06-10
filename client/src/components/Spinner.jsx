import React from 'react';

const Spinner = ({ size = 'medium', color = 'primary', inline = false }) => {
  const sizeMap = {
    small: '16px',
    medium: '32px',
    large: '48px',
  };

  const colorMap = {
    primary: 'var(--color-primary)',
    secondary: 'var(--color-secondary)',
    white: '#ffffff',
  };

  const spinnerStyle = {
    width: sizeMap[size],
    height: sizeMap[size],
    border: `3px solid rgba(255, 255, 255, 0.1)`,
    borderTop: `3px solid ${colorMap[color]}`,
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
    display: 'inline-block',
  };

  const containerStyle = inline
    ? { display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }
    : {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 0',
        width: '100%',
      };

  return (
    <div style={containerStyle}>
      <span style={spinnerStyle} role="status" aria-label="loading" />
    </div>
  );
};

export default Spinner;
