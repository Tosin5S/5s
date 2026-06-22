import React, { useState, useRef } from 'react';

function DrawGrid({ onDrawChange, onAddPattern, labelOptions = ['Pattern A', 'Pattern B'] }) {
  const [pixels, setPixels] = useState(Array(64).fill(0));
  const [selectedLabel, setSelectedLabel] = useState(labelOptions[0]);
  const isDrawing = useRef(false);

  const updatePixel = (index, value) => {
    const nextPixels = [...pixels];
    nextPixels[index] = value;
    setPixels(nextPixels);
    if (onDrawChange) onDrawChange(nextPixels);
  };

  const handleMouseDown = (index) => {
    isDrawing.current = true;
    updatePixel(index, pixels[index] === 1 ? 0 : 1);
  };

  const handleMouseEnter = (index) => {
    if (isDrawing.current) {
      updatePixel(index, 1);
    }
  };

  const handleMouseUp = () => {
    isDrawing.current = false;
  };

  const handleClear = () => {
    const cleared = Array(64).fill(0);
    setPixels(cleared);
    if (onDrawChange) onDrawChange(cleared);
  };

  const handleSave = () => {
    if (onAddPattern) {
      onAddPattern(pixels, selectedLabel);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
        <h4 style={{ fontSize: '0.95rem', color: 'var(--text-main)' }}>Draw a Pattern (8x8 Grid)</h4>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Click & drag to paint pixels</p>
      </div>

      <div className="pixel-grid" style={{ width: '220px', height: '220px' }}>
        {pixels.map((val, idx) => (
          <div
            key={idx}
            className={`pixel-cell ${val === 1 ? 'active' : ''}`}
            onMouseDown={() => handleMouseDown(idx)}
            onMouseEnter={() => handleMouseEnter(idx)}
          />
        ))}
      </div>

      <div style={{ display: 'flex', gap: '12px', width: '100%', justifyContent: 'center' }}>
        <button onClick={handleClear} className="btn btn-danger" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
          Clear
        </button>

        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <select
            value={selectedLabel}
            onChange={(e) => setSelectedLabel(e.target.value)}
            className="input-text"
            style={{ width: '110px', padding: '6px', fontSize: '0.8rem' }}
          >
            {labelOptions.map((opt) => (
              <option key={opt} value={opt} style={{ background: 'var(--bg-secondary)', color: 'white' }}>
                {opt}
              </option>
            ))}
          </select>
          <button onClick={handleSave} className="btn" style={{ padding: '6px 12px', fontSize: '0.8rem', borderColor: 'var(--color-secondary)' }}>
            Add Pattern
          </button>
        </div>
      </div>
    </div>
  );
}

export default DrawGrid;
