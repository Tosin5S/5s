import React, { useEffect, useRef } from 'react';

function ThoughtTree({ steps = [] }) {
  const containerRef = useRef(null);

  // Auto-scroll on new steps
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [steps]);

  const getStageColor = (stage) => {
    switch (stage) {
      case 'SORT': return '#64748b'; // Slate
      case 'SET IN ORDER': return 'var(--color-secondary)'; // Purple
      case 'SHINE': return 'var(--color-primary)'; // Teal
      case 'STANDARDIZE': return 'var(--color-success)'; // Green
      case 'SUSTAIN': return 'var(--color-warning)'; // Orange
      default: return '#fff';
    }
  };

  const getStepIcon = (type) => {
    switch (type) {
      case 'thought': return '💭';
      case 'tool': return '🛠️';
      case 'observation': return '👁️';
      case 'info': return 'ℹ️';
      case 'error': return '⚠️';
      default: return '•';
    }
  };

  return (
    <div className="terminal-panel" ref={containerRef} style={{
      height: '380px',
      overflowY: 'auto',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      background: '#040711',
      border: '1px solid var(--card-border)',
      borderRadius: '10px',
      padding: '16px',
      color: '#c9d1d9'
    }}>
      {steps.length === 0 ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          color: 'var(--text-dark)',
          gap: '8px'
        }}>
          <span style={{ fontSize: '1.5rem' }}>🤖</span>
          <span style={{ fontSize: '0.8rem', fontStyle: 'italic' }}>Agent idle. Submit a query to activate the 5S cognitive cycle.</span>
        </div>
      ) : (
        steps.map((step) => {
          const borderL = `3px solid ${getStageColor(step.stage)}`;
          
          return (
            <div key={step.id} style={{
              borderLeft: borderL,
              paddingLeft: '12px',
              marginLeft: '4px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              animation: 'fadeIn 0.2s ease-out'
            }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{
                  fontSize: '0.65rem',
                  fontWeight: '800',
                  color: '#fff',
                  backgroundColor: getStageColor(step.stage),
                  padding: '2px 6px',
                  borderRadius: '4px',
                  letterSpacing: '1px'
                }}>
                  {step.stage}
                </span>
                
                <span style={{ fontSize: '0.8rem' }}>{getStepIcon(step.type)}</span>
                
                <strong style={{ fontSize: '0.85rem', color: '#fff' }}>
                  {step.title}
                </strong>
              </div>

              {/* Detail body */}
              <div style={{
                fontSize: '0.8rem',
                color: step.type === 'error' ? 'var(--color-error)' : step.type === 'tool' ? 'var(--color-secondary)' : step.type === 'observation' ? 'var(--text-muted)' : 'var(--text-main)',
                whiteSpace: 'pre-wrap',
                fontFamily: step.type === 'tool' || step.type === 'observation' ? 'var(--font-code)' : 'var(--font-main)',
                backgroundColor: step.type === 'tool' || step.type === 'observation' ? 'rgba(0,0,0,0.3)' : 'transparent',
                padding: step.type === 'tool' || step.type === 'observation' ? '8px' : '0px',
                borderRadius: '6px',
                border: step.type === 'tool' || step.type === 'observation' ? '1px solid rgba(255,255,255,0.02)' : 'none'
              }}>
                {step.detail}
              </div>

              {/* Extra parsed items (if present) */}
              {step.extra && step.extra.files && (
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                  {step.extra.files.map(f => (
                    <span key={f} style={{
                      fontSize: '0.7rem',
                      color: 'var(--color-primary)',
                      background: 'rgba(0, 242, 254, 0.05)',
                      border: '1px solid rgba(0, 242, 254, 0.1)',
                      padding: '1px 6px',
                      borderRadius: '4px',
                      fontFamily: 'var(--font-code)'
                    }}>
                      📁 {f}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}

export default ThoughtTree;
