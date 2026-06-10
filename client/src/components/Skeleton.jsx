import React from 'react';

export const Skeleton = ({ type = 'card', count = 1 }) => {
  const renderSkeleton = (key) => {
    switch (type) {
      case 'card':
        return (
          <div key={key} className="glass-panel" style={{ padding: '24px', flex: '1', minWidth: '240px' }}>
            <div className="skeleton-shimmer" style={{ height: '14px', width: '40%', marginBottom: '16px' }} />
            <div className="skeleton-shimmer" style={{ height: '32px', width: '70%', marginBottom: '12px' }} />
            <div className="skeleton-shimmer" style={{ height: '12px', width: '50%' }} />
          </div>
        );

      case 'feed':
        return (
          <div key={key} className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', width: '60%' }}>
              <div className="skeleton-shimmer" style={{ height: '44px', width: '44px', borderRadius: '50%', flexShrink: 0 }} />
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div className="skeleton-shimmer" style={{ height: '16px', width: '50%' }} />
                <div className="skeleton-shimmer" style={{ height: '12px', width: '80%' }} />
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px', width: '25%' }}>
              <div className="skeleton-shimmer" style={{ height: '18px', width: '60%' }} />
              <div className="skeleton-shimmer" style={{ height: '10px', width: '80%' }} />
            </div>
          </div>
        );

      case 'profile':
        return (
          <div key={key} className="glass-panel" style={{ padding: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '24px' }}>
            <div className="skeleton-shimmer" style={{ height: '100px', width: '100px', borderRadius: '50%' }} />
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <div className="skeleton-shimmer" style={{ height: '24px', width: '40%' }} />
              <div className="skeleton-shimmer" style={{ height: '14px', width: '60%' }} />
            </div>
            <div style={{ width: '80%', display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px' }}>
              <div className="skeleton-shimmer" style={{ height: '16px', width: '100%' }} />
              <div className="skeleton-shimmer" style={{ height: '16px', width: '90%' }} />
              <div className="skeleton-shimmer" style={{ height: '16px', width: '95%' }} />
            </div>
          </div>
        );

      case 'chart':
        return (
          <div key={key} className="glass-panel" style={{ padding: '24px', height: '300px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div className="skeleton-shimmer" style={{ height: '20px', width: '30%' }} />
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '200px', padding: '10px 0' }}>
              <div className="skeleton-shimmer" style={{ height: '60%', width: '10%', borderRadius: '4px' }} />
              <div className="skeleton-shimmer" style={{ height: '40%', width: '10%', borderRadius: '4px' }} />
              <div className="skeleton-shimmer" style={{ height: '85%', width: '10%', borderRadius: '4px' }} />
              <div className="skeleton-shimmer" style={{ height: '50%', width: '10%', borderRadius: '4px' }} />
              <div className="skeleton-shimmer" style={{ height: '70%', width: '10%', borderRadius: '4px' }} />
              <div className="skeleton-shimmer" style={{ height: '30%', width: '10%', borderRadius: '4px' }} />
              <div className="skeleton-shimmer" style={{ height: '90%', width: '10%', borderRadius: '4px' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div className="skeleton-shimmer" style={{ height: '10px', width: '15%' }} />
              <div className="skeleton-shimmer" style={{ height: '10px', width: '15%' }} />
              <div className="skeleton-shimmer" style={{ height: '10px', width: '15%' }} />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      {Array.from({ length: count }).map((_, idx) => renderSkeleton(idx))}
    </>
  );
};

export default Skeleton;
