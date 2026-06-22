import React, { useState, useEffect } from 'react';

function Sidebar({ activeTab, setActiveTab, apiKey, setApiKey }) {
  const [showKey, setShowKey] = useState(false);
  const [generation, setGeneration] = useState(() => parseInt(localStorage.getItem('5s_generation') || '0'));

  // Poll generation from localStorage (updated by SelfEvolutionPage)
  useEffect(() => {
    const interval = setInterval(() => {
      const gen = parseInt(localStorage.getItem('5s_generation') || '0');
      setGeneration(gen);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const menuItems = [
    {
      id: 'dashboard',
      name: 'Console Overview',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="9" rx="1" />
          <rect x="14" y="3" width="7" height="5" rx="1" />
          <rect x="14" y="12" width="7" height="9" rx="1" />
          <rect x="3" y="16" width="7" height="5" rx="1" />
        </svg>
      )
    },
    {
      id: 'toynn',
      name: 'Toy Neural Net (Scratch)',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="5" r="3" />
          <circle cx="5" cy="12" r="3" />
          <circle cx="19" cy="12" r="3" />
          <circle cx="12" cy="19" r="3" />
          <line x1="12" y1="8" x2="12" y2="16" />
          <line x1="8" y1="12" x2="16" y2="12" />
          <line x1="7.12" y1="7.12" x2="16.88" y2="16.88" />
          <line x1="7.12" y1="16.88" x2="16.88" y2="7.12" />
        </svg>
      )
    },
    {
      id: 'agent',
      name: '5S Cognitive Agent',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2a10 10 0 0 1 7.54 16.59" />
          <path d="M12 2a10 10 0 0 0-7.54 16.59" />
          <path d="M8 12h8" />
          <path d="M12 8v8" />
          <circle cx="12" cy="12" r="3" fill="currentColor" opacity="0.2" />
        </svg>
      )
    },
    {
      id: 'evolution',
      name: 'Self-Evolution',
      badge: generation > 0 ? `Gen ${generation}` : null,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 12C2 6.48 6.48 2 12 2" />
          <path d="M22 12c0 5.52-4.48 10-10 10" />
          <path d="M7 7c0 5 3 8 5 10" />
          <path d="M17 17c0-5-3-8-5-10" />
          <path d="M7 7c2-2 6-2 8 0" />
          <path d="M17 17c-2 2-6 2-8 0" />
        </svg>
      )
    }
  ];

  return (
    <aside style={{
      width: '280px',
      height: '100%',
      backgroundColor: 'var(--bg-secondary)',
      borderRight: '1px solid var(--card-border)',
      display: 'flex',
      flexDirection: 'column',
      padding: '24px 16px',
      justifyContent: 'space-between',
      zIndex: 10
    }}>
      {/* Brand Header */}
      <div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '32px',
          padding: '0 8px'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-glow)'
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#080c14" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="pulse">
              <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
              <path d="M12 6v12" />
              <path d="M8 10h8" />
            </svg>
          </div>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: '800', lineHeight: 1 }}>5s AGI</h2>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-primary)', letterSpacing: '2px', fontWeight: '700' }}>HYBRID ENGINE</span>
          </div>
        </div>

        {/* Menu Navigation */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {menuItems.map(item => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  border: '1px solid transparent',
                  background: isActive ? 'rgba(0, 242, 254, 0.08)' : 'transparent',
                  color: isActive ? 'var(--color-primary)' : 'var(--text-muted)',
                  fontSize: '0.95rem',
                  fontWeight: isActive ? '600' : '400',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'var(--transition-smooth)',
                  borderColor: isActive ? 'rgba(0, 242, 254, 0.2)' : 'transparent'
                }}
                className={isActive ? 'glow-teal' : ''}
              >
                <span style={{ color: isActive ? 'var(--color-primary)' : 'var(--text-dark)' }}>
                  {item.icon}
                </span>
                <span style={{ flex: 1 }}>{item.name}</span>
                {item.badge && (
                  <span style={{
                    fontSize: '0.6rem', fontWeight: '700', padding: '1px 6px', borderRadius: '8px',
                    background: 'rgba(161,85,255,0.15)', border: '1px solid rgba(161,85,255,0.3)',
                    color: 'var(--color-secondary)'
                  }}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Settings Panel */}
      <div className="glass-card" style={{
        padding: '16px',
        borderRadius: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        border: '1px solid rgba(255,255,255,0.05)',
        background: 'rgba(8, 12, 20, 0.4)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
          <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-main)' }}>Configuration</span>
        </div>
        
        <div>
          <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Gemini API Key</label>
          <div style={{ position: 'relative' }}>
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="API Key (Optional)"
              className="input-text"
              style={{ paddingRight: '36px', fontSize: '0.8rem' }}
            />
            <button
              onClick={() => setShowKey(!showKey)}
              style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              {showKey ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <div style={{
          fontSize: '0.7rem',
          color: apiKey ? 'var(--color-success)' : 'var(--text-dark)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          marginTop: '4px'
        }}>
          <span style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: apiKey ? 'var(--color-success)' : 'var(--text-dark)',
            display: 'inline-block'
          }}></span>
          {apiKey ? 'API Agent Mode Connected' : 'Simulated Agent Mode'}
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
