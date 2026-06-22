import React, { useState, useEffect } from 'react';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function uid() { return Math.random().toString(36).slice(2, 9); }

async function loadGoals() {
  try {
    const r = await fetch('/api/goals');
    const d = await r.json();
    return d.success ? d.goals : [];
  } catch { return []; }
}

async function saveGoals(goals) {
  await fetch('/api/goals', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ goals })
  });
}

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS = {
  active:    { label: 'Active',    color: 'var(--color-primary)',   bg: 'rgba(0,242,254,0.08)'  },
  paused:    { label: 'Paused',    color: 'var(--color-warning)',   bg: 'rgba(255,159,67,0.08)' },
  completed: { label: 'Done ✓',   color: 'var(--color-success)',   bg: 'rgba(0,255,157,0.08)'  },
};

function nextStatus(s) { return s === 'active' ? 'paused' : s === 'paused' ? 'completed' : 'active'; }

// ─── Single Goal Card ─────────────────────────────────────────────────────────
function GoalCard({ goal, onChange, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const [newTask, setNewTask] = useState('');

  const done  = goal.subtasks.filter(t => t.done).length;
  const total = goal.subtasks.length;
  const pct   = total > 0 ? Math.round((done / total) * 100) : 0;
  const st    = STATUS[goal.status] || STATUS.active;

  const toggleTask = (tid) => {
    const subtasks = goal.subtasks.map(t => t.id === tid ? { ...t, done: !t.done } : t);
    const allDone  = subtasks.length > 0 && subtasks.every(t => t.done);
    onChange({ ...goal, subtasks, status: allDone ? 'completed' : goal.status });
  };

  const addTask = () => {
    if (!newTask.trim()) return;
    onChange({ ...goal, subtasks: [...goal.subtasks, { id: uid(), text: newTask.trim(), done: false }] });
    setNewTask('');
  };

  const removeTask = (tid) => onChange({ ...goal, subtasks: goal.subtasks.filter(t => t.id !== tid) });

  return (
    <div style={{
      background: st.bg, border: `1px solid ${st.color}22`,
      borderRadius: '10px', overflow: 'hidden',
      transition: 'all 0.2s ease', animation: 'slideUp 0.2s ease-out'
    }}>
      {/* Header */}
      <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontWeight: '600', fontSize: '0.88rem', flex: 1,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {goal.title}
            </span>
            <button onClick={() => onChange({ ...goal, status: nextStatus(goal.status) })} style={{
              background: st.bg, border: `1px solid ${st.color}44`, color: st.color,
              borderRadius: '8px', padding: '1px 8px', fontSize: '0.65rem', fontWeight: '700',
              cursor: 'pointer', flexShrink: 0
            }}>
              {st.label}
            </button>
          </div>

          {/* Progress bar */}
          {total > 0 && (
            <div style={{ height: '3px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: `${pct}%`,
                background: `linear-gradient(90deg, ${st.color}, ${st.color}99)`,
                transition: 'width 0.4s ease', borderRadius: '2px'
              }} />
            </div>
          )}

          {total > 0 && (
            <div style={{ fontSize: '0.68rem', color: 'var(--text-dark)', marginTop: '3px' }}>
              {done}/{total} subtasks · {pct}%
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
          <button onClick={() => setExpanded(p => !p)} style={{
            background: 'none', border: '1px solid var(--card-border)', borderRadius: '6px',
            color: 'var(--text-muted)', cursor: 'pointer', width: '26px', height: '26px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem'
          }}>
            {expanded ? '▲' : '▼'}
          </button>
          <button onClick={() => onDelete(goal.id)} style={{
            background: 'none', border: '1px solid rgba(255,82,82,0.2)', borderRadius: '6px',
            color: 'var(--color-error)', cursor: 'pointer', width: '26px', height: '26px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem'
          }}>×</button>
        </div>
      </div>

      {/* Expanded subtasks */}
      {expanded && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {goal.subtasks.map(task => (
            <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input type="checkbox" checked={task.done} onChange={() => toggleTask(task.id)}
                style={{ cursor: 'pointer', accentColor: 'var(--color-primary)', width: '14px', height: '14px' }} />
              <span style={{
                fontSize: '0.82rem', flex: 1,
                color: task.done ? 'var(--text-dark)' : 'var(--text-main)',
                textDecoration: task.done ? 'line-through' : 'none'
              }}>{task.text}</span>
              <button onClick={() => removeTask(task.id)} style={{
                background: 'none', border: 'none', color: 'var(--text-dark)',
                cursor: 'pointer', fontSize: '0.8rem', lineHeight: 1, padding: '0 2px'
              }}>×</button>
            </div>
          ))}

          {/* Add subtask */}
          <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
            <input
              value={newTask}
              onChange={e => setNewTask(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addTask()}
              placeholder="Add subtask…"
              style={{
                flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--card-border)',
                borderRadius: '6px', padding: '4px 8px', color: 'var(--text-main)',
                fontSize: '0.8rem', outline: 'none'
              }}
            />
            <button onClick={addTask} className="btn btn-primary" style={{ padding: '4px 10px', fontSize: '0.8rem' }}>+</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Goals Panel ──────────────────────────────────────────────────────────────
export default function GoalsPanel({ onGoalContext }) {
  const [goals, setGoals]     = useState([]);
  const [title, setTitle]     = useState('');
  const [adding, setAdding]   = useState(false);
  const [firstTask, setFirst] = useState('');

  useEffect(() => { loadGoals().then(setGoals); }, []);

  // Export active goal context for chat
  useEffect(() => {
    const active = goals.filter(g => g.status === 'active');
    onGoalContext?.(active);
  }, [goals]);

  const persist = (updated) => { setGoals(updated); saveGoals(updated); };

  const addGoal = () => {
    if (!title.trim()) return;
    const newGoal = {
      id: uid(),
      title: title.trim(),
      status: 'active',
      subtasks: firstTask.trim() ? [{ id: uid(), text: firstTask.trim(), done: false }] : [],
      createdAt: new Date().toISOString()
    };
    persist([newGoal, ...goals]);
    setTitle(''); setFirst(''); setAdding(false);
  };

  const updateGoal = (updated) => persist(goals.map(g => g.id === updated.id ? updated : g));
  const deleteGoal = (id) => persist(goals.filter(g => g.id !== id));

  const active    = goals.filter(g => g.status === 'active').length;
  const completed = goals.filter(g => g.status === 'completed').length;

  return (
    <div className="glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontWeight: '700', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            🎯 Goals
            {active > 0 && (
              <span style={{
                fontSize: '0.65rem', fontWeight: '700', padding: '1px 6px', borderRadius: '8px',
                background: 'rgba(0,242,254,0.1)', color: 'var(--color-primary)', border: '1px solid rgba(0,242,254,0.2)'
              }}>{active} active</span>
            )}
          </div>
          {completed > 0 && (
            <div style={{ fontSize: '0.7rem', color: 'var(--color-success)' }}>{completed} completed</div>
          )}
        </div>
        <button onClick={() => setAdding(p => !p)} className="btn btn-primary"
          style={{ padding: '4px 12px', fontSize: '0.8rem' }}>
          {adding ? 'Cancel' : '+ Add Goal'}
        </button>
      </div>

      {/* Add form */}
      {adding && (
        <div style={{
          background: 'rgba(0,242,254,0.04)', border: '1px solid rgba(0,242,254,0.15)',
          borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px',
          animation: 'slideUp 0.15s ease-out'
        }}>
          <input value={title} onChange={e => setTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addGoal()}
            placeholder="Goal title (e.g. Build a REST API)…"
            style={{
              background: 'rgba(255,255,255,0.05)', border: '1px solid var(--card-border)',
              borderRadius: '7px', padding: '7px 10px', color: 'var(--text-main)',
              fontSize: '0.85rem', outline: 'none', width: '100%'
            }}
          />
          <input value={firstTask} onChange={e => setFirst(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addGoal()}
            placeholder="First subtask (optional)…"
            style={{
              background: 'rgba(255,255,255,0.03)', border: '1px solid var(--card-border)',
              borderRadius: '7px', padding: '6px 10px', color: 'var(--text-muted)',
              fontSize: '0.8rem', outline: 'none', width: '100%'
            }}
          />
          <button onClick={addGoal} className="btn btn-primary"
            disabled={!title.trim()}
            style={{ alignSelf: 'flex-end', padding: '6px 16px', fontSize: '0.82rem' }}>
            Create Goal
          </button>
        </div>
      )}

      {/* Goal list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '360px', overflowY: 'auto' }}>
        {goals.length === 0 ? (
          <div style={{
            textAlign: 'center', color: 'var(--text-dark)', padding: '24px 12px',
            border: '1px dashed rgba(255,255,255,0.06)', borderRadius: '8px',
            fontSize: '0.8rem', fontStyle: 'italic'
          }}>
            No goals yet. Add one and 5s will track progress across sessions.
          </div>
        ) : (
          goals.map(g => (
            <GoalCard key={g.id} goal={g} onChange={updateGoal} onDelete={deleteGoal} />
          ))
        )}
      </div>
    </div>
  );
}
