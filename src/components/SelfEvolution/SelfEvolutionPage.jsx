import React, { useState, useEffect, useRef } from 'react';
import {
  detectAvailableImprovements,
  runSelfImprovementCycle,
  getEvolutionLog,
  restoreBackup,
  getCurrentGeneration,
  generateLLMImprovement,
  applyImprovement,
  logEvolutionEntry
} from '../Agent/selfImprove';

// ─── Diff Viewer ──────────────────────────────────────────────────────────────
function DiffViewer({ oldContent, newContent }) {
  if (!oldContent && !newContent) return null;

  const oldLines = (oldContent || '').split('\n');
  const newLines = (newContent || '').split('\n');
  const oldSet = new Set(oldLines);
  const newSet = new Set(newLines);

  // Show only changed regions (lines that differ, with 2 lines of context)
  const allLines = [];
  const maxLen = Math.max(oldLines.length, newLines.length);

  // Build a simple unified diff
  const removedLines = oldLines.filter(l => !newSet.has(l)).slice(0, 25);
  const addedLines = newLines.filter(l => !oldSet.has(l)).slice(0, 25);

  return (
    <div style={{ fontFamily: 'var(--font-code)', fontSize: '0.78rem', lineHeight: 1.5 }}>
      {removedLines.length > 0 && (
        <div style={{ marginBottom: '8px' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--color-error)', marginBottom: '4px', fontWeight: '600' }}>
            — Removed / Modified
          </div>
          {removedLines.map((l, i) => (
            <div key={`r${i}`} style={{
              background: 'rgba(255,82,82,0.08)', borderLeft: '3px solid var(--color-error)',
              padding: '1px 8px', color: '#ff8888', whiteSpace: 'pre-wrap', wordBreak: 'break-all'
            }}>- {l}</div>
          ))}
        </div>
      )}
      {addedLines.length > 0 && (
        <div>
          <div style={{ fontSize: '0.7rem', color: 'var(--color-success)', marginBottom: '4px', fontWeight: '600' }}>
            + Added / Updated
          </div>
          {addedLines.map((l, i) => (
            <div key={`a${i}`} style={{
              background: 'rgba(0,255,157,0.06)', borderLeft: '3px solid var(--color-success)',
              padding: '1px 8px', color: '#88ffcc', whiteSpace: 'pre-wrap', wordBreak: 'break-all'
            }}>+ {l}</div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Category Badge ───────────────────────────────────────────────────────────
function CategoryBadge({ category }) {
  const colors = {
    'New Capability': { bg: 'rgba(0,242,254,0.1)', border: 'rgba(0,242,254,0.3)', color: 'var(--color-primary)' },
    'Intelligence Improvement': { bg: 'rgba(161,85,255,0.1)', border: 'rgba(161,85,255,0.3)', color: 'var(--color-secondary)' },
    'Architecture Improvement': { bg: 'rgba(0,255,157,0.08)', border: 'rgba(0,255,157,0.2)', color: 'var(--color-success)' },
  };
  const style = colors[category] || colors['Architecture Improvement'];
  return (
    <span style={{
      fontSize: '0.65rem', fontWeight: '700', letterSpacing: '0.5px',
      padding: '2px 8px', borderRadius: '10px',
      background: style.bg, border: `1px solid ${style.border}`, color: style.color
    }}>
      {category}
    </span>
  );
}

// ─── Evolution Log Entry ──────────────────────────────────────────────────────
function LogEntry({ entry, onRestore }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={{
      background: entry.success ? 'rgba(0,255,157,0.03)' : 'rgba(255,82,82,0.03)',
      border: `1px solid ${entry.success ? 'rgba(0,255,157,0.12)' : 'rgba(255,82,82,0.12)'}`,
      borderRadius: '10px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px',
      animation: 'slideUp 0.2s ease-out'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <span style={{
            width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
            background: entry.success ? 'rgba(0,255,157,0.15)' : 'rgba(255,82,82,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem'
          }}>
            {entry.success ? '✅' : '⚠️'}
          </span>
          <div>
            <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{entry.title}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Gen {entry.generation} · {new Date(entry.timestamp).toLocaleString()}
            </div>
          </div>
          <CategoryBadge category={entry.category} />
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {entry.stats && (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-code)' }}>
              +{entry.stats.added} / -{entry.stats.removed} lines
            </span>
          )}
          <button onClick={() => setExpanded(p => !p)} className="btn"
            style={{ padding: '3px 10px', fontSize: '0.75rem' }}>
            {expanded ? 'Collapse' : 'View Diff'}
          </button>
          {entry.success && entry.backup && (
            <button
              onClick={() => onRestore(entry.targetFile, entry.backup)}
              className="btn btn-danger"
              style={{ padding: '3px 10px', fontSize: '0.75rem' }}
              title="Roll back this change"
            >
              ↩ Rollback
            </button>
          )}
        </div>
      </div>

      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
        {entry.description}
      </div>
      <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-code)', color: 'var(--text-dark)' }}>
        📄 {entry.targetFile}
      </div>

      {expanded && (
        <div style={{
          background: '#03050a', border: '1px solid var(--card-border)',
          borderRadius: '8px', padding: '12px', maxHeight: '300px', overflowY: 'auto'
        }}>
          {entry.error
            ? <span style={{ color: 'var(--color-error)', fontSize: '0.8rem' }}>Error: {entry.error}</span>
            : <DiffViewer oldContent={entry.oldContent} newContent={entry.newContent} />
          }
        </div>
      )}
    </div>
  );
}

// ─── Progress Log ─────────────────────────────────────────────────────────────
function ProgressLog({ messages }) {
  const endRef = useRef(null);
  useEffect(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), [messages]);

  const phaseIcon = { detecting: '🔍', planning: '📋', applying: '⚡', applied: '✅', error: '⚠️', complete: '🎉' };
  const phaseColor = { detecting: 'var(--text-muted)', planning: 'var(--color-secondary)', applying: 'var(--color-primary)', applied: 'var(--color-success)', error: 'var(--color-error)', complete: 'var(--color-success)' };

  return (
    <div style={{
      background: '#03050a', border: '1px solid var(--card-border)', borderRadius: '10px',
      padding: '14px', height: '180px', overflowY: 'auto',
      fontFamily: 'var(--font-code)', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '6px'
    }}>
      {messages.length === 0
        ? <span style={{ color: 'var(--text-dark)', fontStyle: 'italic', margin: 'auto' }}>Cycle output will appear here...</span>
        : messages.map((m, i) => (
          <div key={i} style={{ color: phaseColor[m.phase] || 'var(--text-main)', display: 'flex', gap: '8px' }}>
            <span>{phaseIcon[m.phase] || '•'}</span>
            <span>{m.message}</span>
          </div>
        ))}
      <div ref={endRef} />
    </div>
  );
}

// ─── Available Improvement Card ───────────────────────────────────────────────
function AvailableCard({ imp, onApply, applying }) {
  return (
    <div className="glass-card" style={{
      padding: '14px 16px', display: 'flex', gap: '12px',
      alignItems: 'center', justifyContent: 'space-between',
      opacity: applying ? 0.6 : 1, transition: 'opacity 0.3s'
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: '600', fontSize: '0.88rem' }}>{imp.title}</span>
          <CategoryBadge category={imp.category} />
        </div>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>{imp.description}</div>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-dark)', marginTop: '4px', fontFamily: 'var(--font-code)' }}>
          📄 {imp.targetFile.split('/').pop()}
        </div>
      </div>
      <button
        onClick={() => onApply(imp)}
        disabled={applying}
        className="btn btn-primary"
        style={{ padding: '6px 14px', fontSize: '0.8rem', whiteSpace: 'nowrap', flexShrink: 0 }}
      >
        {applying ? '⏳' : '⚡ Apply'}
      </button>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
function SelfEvolutionPage({ apiKey }) {
  const [generation, setGeneration] = useState(0);
  const [log, setLog] = useState([]);
  const [available, setAvailable] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [applyingId, setApplyingId] = useState(null);
  const [progressMessages, setProgressMessages] = useState([]);
  const [activeTab, setActiveTab] = useState('available'); // 'available' | 'log'
  const [llmImprovementText, setLlmImprovementText] = useState('');
  const [isGeneratingLLM, setIsGeneratingLLM] = useState(false);

  const loadData = async () => {
    const [gen, evLog, avail] = await Promise.all([
      getCurrentGeneration(),
      getEvolutionLog(),
      detectAvailableImprovements()
    ]);
    setGeneration(gen);
    setLog(evLog.reverse());
    setAvailable(avail);
    localStorage.setItem('5s_generation', String(gen));
  };

  useEffect(() => { loadData(); }, []);

  const handleRunCycle = async () => {
    setIsRunning(true);
    setProgressMessages([]);
    setActiveTab('available');

    await runSelfImprovementCycle({
      maxImprovements: 2,
      apiKey,
      onProgress: (msg) => setProgressMessages(prev => [...prev, msg])
    });

    await loadData();
    setIsRunning(false);
  };

  const handleApplySingle = async (imp) => {
    setApplyingId(imp.id);
    const gen = (await getCurrentGeneration()) + 1;
    const result = await applyImprovement(imp, gen);

    await logEvolutionEntry({
      id: `gen-${gen}-${imp.id}`,
      generation: gen,
      improvementId: imp.id,
      title: imp.title,
      category: imp.category,
      targetFile: imp.targetFile,
      description: imp.description,
      timestamp: new Date().toISOString(),
      success: result.success,
      stats: result.stats,
      backup: result.backup,
      error: result.error || null,
      oldContent: result.oldContent,
      newContent: result.newContent
    });

    await loadData();
    setApplyingId(null);
  };

  const handleRestore = async (file, backupName) => {
    if (!confirm(`Roll back ${file} to backup "${backupName}"? This will undo that improvement.`)) return;
    await restoreBackup(file, backupName);
    await loadData();
  };

  const handleLLMGenerate = async () => {
    if (!apiKey) {
      alert('A Gemini API key is required to generate novel LLM improvements. Add it in the sidebar settings.');
      return;
    }
    setIsGeneratingLLM(true);
    try {
      const improvement = await generateLLMImprovement({ apiKey, context: 'Recent conversation usage' });
      setLlmImprovementText(JSON.stringify(improvement, null, 2));
    } catch (e) {
      setLlmImprovementText(`Error: ${e.message}`);
    } finally {
      setIsGeneratingLLM(false);
    }
  };

  const appliedCount = log.filter(e => e.success).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', flex: 1 }}>

      {/* ── Header ── */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        paddingBottom: '20px', borderBottom: '1px solid var(--card-border)', flexWrap: 'wrap', gap: '16px'
      }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: '800', marginBottom: '4px' }}>
            Self-Evolution Engine
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', maxWidth: '600px' }}>
            5s reads its own source code, detects improvement opportunities, applies targeted code patches,
            and hot-reloads through Vite HMR — becoming smarter with each cycle.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Generation badge */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(0,242,254,0.1), rgba(161,85,255,0.1))',
            border: '1px solid rgba(0,242,254,0.2)', borderRadius: '12px',
            padding: '12px 20px', textAlign: 'center'
          }}>
            <div style={{ fontSize: '2rem', fontWeight: '800', lineHeight: 1 }}>Gen {generation}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              {appliedCount} improvements applied
            </div>
          </div>

          <button
            onClick={handleRunCycle}
            disabled={isRunning || available.length === 0}
            className="btn btn-primary"
            style={{ padding: '12px 24px', fontSize: '0.95rem' }}
          >
            {isRunning ? '⏳ Running Cycle...' : `⚡ Auto-Improve (${Math.min(2, available.length)} selected)`}
          </button>
        </div>
      </div>

      {/* ── Stats Row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        {[
          { label: 'Current Generation', value: `Gen ${generation}`, color: 'var(--color-primary)' },
          { label: 'Improvements Applied', value: appliedCount, color: 'var(--color-success)' },
          { label: 'Available Improvements', value: available.length, color: 'var(--color-secondary)' },
          { label: 'Rollbacks Available', value: log.filter(e => e.backup).length, color: 'var(--color-warning)' },
        ].map(s => (
          <div key={s.label} className="glass-card" style={{ padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.8rem', fontWeight: '700', color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'start' }}>
        {/* ── Left: Improvement Selection & Progress ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Tab Header */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--card-border)', paddingBottom: '10px', gap: '16px' }}>
            {['available', 'log'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{
                background: 'none', border: 'none', cursor: 'pointer', paddingBottom: '6px',
                fontSize: '0.95rem', fontWeight: activeTab === tab ? '700' : '400',
                color: activeTab === tab ? 'var(--color-primary)' : 'var(--text-muted)',
                borderBottom: activeTab === tab ? '2px solid var(--color-primary)' : 'none'
              }}>
                {tab === 'available' ? `Available (${available.length})` : `Evolution Log (${log.length})`}
              </button>
            ))}
          </div>

          {/* Available Improvements */}
          {activeTab === 'available' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '500px', overflowY: 'auto' }}>
              {available.length === 0 ? (
                <div style={{
                  textAlign: 'center', color: 'var(--color-success)', padding: '40px 20px',
                  border: '1px dashed rgba(0,255,157,0.2)', borderRadius: '12px'
                }}>
                  <div style={{ fontSize: '2rem', marginBottom: '8px' }}>✨</div>
                  <div style={{ fontWeight: '600' }}>All improvements applied!</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    5s is fully optimized at this capability level.
                  </div>
                </div>
              ) : (
                available.map(imp => (
                  <AvailableCard
                    key={imp.id}
                    imp={imp}
                    onApply={handleApplySingle}
                    applying={applyingId === imp.id}
                  />
                ))
              )}
            </div>
          )}

          {/* Evolution Log */}
          {activeTab === 'log' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '500px', overflowY: 'auto' }}>
              {log.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-dark)', padding: '40px', fontStyle: 'italic' }}>
                  No improvements applied yet. Run the self-improvement cycle to begin.
                </div>
              ) : (
                log.map(entry => (
                  <LogEntry key={entry.id} entry={entry} onRestore={handleRestore} />
                ))
              )}
            </div>
          )}
        </div>

        {/* ── Right: Cycle Runner + LLM Generator ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Auto-Cycle Progress */}
          <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1rem' }}>Cycle Progress Log</h3>
              {progressMessages.length > 0 && (
                <button onClick={() => setProgressMessages([])} style={{ background: 'none', border: 'none', color: 'var(--text-dark)', cursor: 'pointer', fontSize: '0.75rem' }}>
                  Clear
                </button>
              )}
            </div>
            <ProgressLog messages={progressMessages} />
            <p style={{ fontSize: '0.75rem', color: 'var(--text-dark)', lineHeight: 1.4 }}>
              The auto-cycle selects 2 improvements by priority (Capabilities first, then Intelligence, then Architecture) and applies them in sequence. Vite HMR hot-reloads the app instantly after each patch.
            </p>
          </div>

          {/* LLM Novel Improvement Generator */}
          <div className="glass-card glow-purple" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <h3 style={{ fontSize: '1rem', marginBottom: '4px' }}>🤖 LLM-Generated Novel Improvement</h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                Uses Gemini to read 5s's own source and generate a brand-new improvement beyond the built-in library. Requires API key.
              </p>
            </div>

            <button
              onClick={handleLLMGenerate}
              disabled={isGeneratingLLM || !apiKey}
              className="btn"
              style={{ borderColor: 'var(--color-secondary)', color: 'var(--color-secondary)', alignSelf: 'flex-start' }}
            >
              {isGeneratingLLM ? '⏳ Generating...' : '✨ Generate Novel Improvement'}
            </button>

            {!apiKey && (
              <span style={{ fontSize: '0.75rem', color: 'var(--color-warning)' }}>
                ⚠️ Add a Gemini API key in the sidebar to enable LLM-powered improvements.
              </span>
            )}

            {llmImprovementText && (
              <div style={{
                background: '#03050a', border: '1px solid var(--card-border)',
                borderRadius: '8px', padding: '12px', fontFamily: 'var(--font-code)',
                fontSize: '0.78rem', color: '#c9d1d9', whiteSpace: 'pre-wrap',
                maxHeight: '200px', overflowY: 'auto'
              }}>
                {llmImprovementText}
              </div>
            )}
          </div>

          {/* How It Works */}
          <div className="glass-card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '12px' }}>How Self-Modification Works</h3>
            {[
              { icon: '🔍', title: 'Scan', desc: 'Reads its own source files via /api/self/source' },
              { icon: '🧩', title: 'Detect', desc: 'Each improvement has a detect() function that checks if it\'s already applied' },
              { icon: '✏️', title: 'Patch', desc: 'apply() returns a new source with the targeted code section replaced' },
              { icon: '💾', title: 'Backup', desc: 'Old version is saved to .self_backups/ before writing' },
              { icon: '⚡', title: 'Hot Reload', desc: 'Vite HMR instantly reloads the modified module in the browser' },
              { icon: '📝', title: 'Log', desc: 'Entry written to self_evolution.json with diff stats and backup ref' },
            ].map(step => (
              <div key={step.title} style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '1rem', flexShrink: 0 }}>{step.icon}</span>
                <div>
                  <span style={{ fontWeight: '600', fontSize: '0.85rem' }}>{step.title}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}> — {step.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SelfEvolutionPage;
