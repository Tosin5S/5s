import React, { useState } from 'react';

function MemoryMap({ memories = [], onRefresh }) {
  const [selectedMem, setSelectedMem] = useState(null);
  
  const width = 450;
  const height = 280;
  const cx = width / 2;
  const cy = height / 2;

  // Lays out nodes in a circle
  const getCoordinates = (index, total) => {
    if (total === 0) return { x: cx, y: cy };
    const radius = 90;
    const angle = (index * 2 * Math.PI) / total;
    return {
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle)
    };
  };

  const getTagColor = (tags = []) => {
    if (tags.includes('error')) return 'var(--color-error)';
    if (tags.includes('agent-run')) return 'var(--color-secondary)';
    if (tags.includes('workspace')) return 'var(--color-primary)';
    if (tags.includes('sandbox')) return 'var(--color-success)';
    return 'var(--text-muted)';
  };

  return (
    <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ fontSize: '1.05rem' }}>Long-Term Memory Web</h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Semantic associations saved on local disk</p>
        </div>
        <button onClick={onRefresh} className="btn" style={{ padding: '4px 8px', fontSize: '0.75rem' }}>
          ↻ Sync
        </button>
      </div>

      {memories.length === 0 ? (
        <div style={{
          height: '220px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-dark)',
          fontSize: '0.8rem',
          fontStyle: 'italic',
          border: '1px dashed var(--card-border)',
          borderRadius: '8px'
        }}>
          No memories stored yet. Let the agent run to capture facts.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* SVG Map */}
          <div style={{
            background: 'rgba(5, 8, 15, 0.7)',
            borderRadius: '10px',
            border: '1px solid var(--card-border)',
            overflow: 'hidden'
          }}>
            <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
              {/* Lines from Core to Nodes */}
              {memories.map((mem, idx) => {
                const { x, y } = getCoordinates(idx, memories.length);
                const color = getTagColor(mem.tags);
                return (
                  <g key={`link-${mem.id}`}>
                    <line
                      x1={cx}
                      y1={cy}
                      x2={x}
                      y2={y}
                      stroke={color}
                      strokeWidth="1.5"
                      opacity="0.25"
                    />
                    <circle r="3" fill={color} opacity="0.8">
                      <animateMotion
                        dur="3s"
                        repeatCount="indefinite"
                        path={`M ${cx} ${cy} L ${x} ${y}`}
                      />
                    </circle>
                  </g>
                );
              })}

              {/* Central Core Node */}
              <g transform={`translate(${cx}, ${cy})`}>
                <circle
                  r="24"
                  fill="rgba(161, 85, 255, 0.1)"
                  stroke="var(--color-secondary)"
                  strokeWidth="2"
                  className="pulse"
                />
                <circle
                  r="18"
                  fill="var(--bg-secondary)"
                  stroke="var(--color-secondary)"
                  strokeWidth="2"
                />
                <text
                  y="4"
                  textAnchor="middle"
                  fill="var(--color-secondary)"
                  fontSize="10px"
                  fontWeight="bold"
                  fontFamily="var(--font-code)"
                >
                  CORE
                </text>
              </g>

              {/* Memory Nodes */}
              {memories.map((mem, idx) => {
                const { x, y } = getCoordinates(idx, memories.length);
                const color = getTagColor(mem.tags);
                const isSelected = selectedMem?.id === mem.id;

                return (
                  <g
                    key={`node-${mem.id}`}
                    transform={`translate(${x}, ${y})`}
                    style={{ cursor: 'pointer' }}
                    onClick={() => setSelectedMem(mem)}
                  >
                    {isSelected && (
                      <circle
                        r="14"
                        fill="none"
                        stroke={color}
                        strokeWidth="1.5"
                        style={{ filter: 'drop-shadow(0px 0px 3px currentColor)' }}
                      />
                    )}
                    <circle
                      r="8"
                      fill={color}
                      stroke="var(--bg-primary)"
                      strokeWidth="2"
                    />
                    {/* Node text hover tooltip */}
                    <title>{`${mem.content.slice(0, 40)}...\nTags: ${mem.tags.join(', ')}`}</title>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Details Card */}
          <div style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid var(--card-border)',
            borderRadius: '8px',
            padding: '12px',
            minHeight: '80px',
            fontSize: '0.8rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}>
            {selectedMem ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                  <span>📅 {new Date(selectedMem.timestamp).toLocaleTimeString()}</span>
                  <span>ID: {String(selectedMem.id).slice(-4)}</span>
                </div>
                <div style={{ color: 'var(--text-main)', lineHeight: 1.4 }}>
                  {selectedMem.content}
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                  {selectedMem.tags.map(t => (
                    <span key={t} style={{
                      fontSize: '0.65rem',
                      padding: '1px 6px',
                      borderRadius: '4px',
                      backgroundColor: 'rgba(255,255,255,0.06)',
                      color: 'var(--text-muted)'
                    }}>
                      #{t}
                    </span>
                  ))}
                </div>
              </>
            ) : (
              <span style={{ color: 'var(--text-dark)', fontStyle: 'italic', margin: 'auto' }}>
                Click a memory node above to inspect details
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default MemoryMap;
