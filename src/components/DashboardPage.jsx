import React from 'react';

function DashboardPage({ stats, setTab }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', flex: 1 }}>
      {/* Welcome Banner */}
      <div className="glass-card glow-teal" style={{
        padding: '32px',
        background: 'linear-gradient(135deg, rgba(8, 20, 36, 0.9), rgba(16, 26, 48, 0.7))',
        border: '1px solid rgba(0, 242, 254, 0.15)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Abstract Background Design */}
        <div style={{
          position: 'absolute',
          right: '-50px',
          top: '-50px',
          width: '200px',
          height: '200px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, var(--color-primary) 0%, transparent 70%)',
          opacity: 0.1,
          filter: 'blur(30px)'
        }}></div>

        <h1 style={{ fontSize: '2.2rem', marginBottom: '8px', fontWeight: '800' }}>
          5s General Intelligence Workspace
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', maxWidth: '800px', lineHeight: 1.6 }}>
          An experimental AGI environment that merges foundational AI concepts. Explore **neural network logic built completely from scratch** alongside a **structured 5S cognitive agent** powered by advanced LLMs to manipulate files, run sandboxed code, and maintain long-term memory.
        </p>
      </div>

      {/* Grid of Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '20px'
      }}>
        {/* Stat 1 */}
        <div className="glass-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '8px',
            backgroundColor: 'rgba(0, 242, 254, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-primary)'
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: '1.8rem', fontWeight: '700' }}>{stats.fileCount}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Workspace Files Created</div>
          </div>
        </div>

        {/* Stat 2 */}
        <div className="glass-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '8px',
            backgroundColor: 'rgba(161, 85, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-secondary)'
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
              <path d="M12 6v6l4 2" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: '1.8rem', fontWeight: '700' }}>{stats.memoryCount}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Semantic Memories Stored</div>
          </div>
        </div>

        {/* Stat 3 */}
        <div className="glass-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '8px',
            backgroundColor: 'rgba(0, 255, 157, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-success)'
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="4 17 10 11 15 16 20 9" />
              <polyline points="14 9 20 9 20 15" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: '1.8rem', fontWeight: '700' }}>{stats.nnTrainedEpochs}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Neural Net Training Epochs</div>
          </div>
        </div>

        {/* Stat 4 */}
        <div className="glass-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '8px',
            backgroundColor: 'rgba(255, 159, 67, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-warning)'
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="12 2 2 22 22 22" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: '1.8rem', fontWeight: '700' }}>{stats.sandboxRuns}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Sandbox Code Runs</div>
          </div>
        </div>
      </div>

      {/* Feature Modules */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '24px',
        marginTop: '12px'
      }}>
        {/* Module A: Neural Net */}
        <div className="glass-card glow-purple" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: 'rgba(161, 85, 255, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-secondary)'
            }}>
              🧠
            </div>
            <h3 style={{ fontSize: '1.25rem' }}>Toy Neural Network from Scratch</h3>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6, flex: 1 }}>
            Demystify AI foundations by watching training loops step-by-step. Configure hidden layer matrices, adjust learning rates, choose activations (Sigmoid, Tanh, ReLU), and watch backpropagation adapt synaptic weights on XOR math gates or an interactive draw-to-recognize character grid.
          </p>
          <button onClick={() => setTab('toynn')} className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
            Launch Neural Net Drawer
          </button>
        </div>

        {/* Module B: 5S Agent */}
        <div className="glass-card glow-teal" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: 'rgba(0, 242, 254, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-primary)'
            }}>
              ⚡
            </div>
            <h3 style={{ fontSize: '1.25rem' }}>5S Cognitive Agent Console</h3>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6, flex: 1 }}>
            Run the 5S cognitive cycle: **Sort** inputs for context, **Set in Order** step plans, **Shine** by executing file system toolcalls and sandboxed code, **Standardize** outputs by self-correcting mistakes, and **Sustain** knowledge by writing associations into a permanent JSON semantic memories database.
          </p>
          <button onClick={() => setTab('agent')} className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
            Open Agent Console
          </button>
        </div>
      </div>

      {/* Concept Guide Section */}
      <div className="glass-card" style={{ padding: '24px', marginTop: '12px' }}>
        <h3 style={{ marginBottom: '16px', fontSize: '1.2rem' }}>How 5S Operates on Lean Cognitive Principles</h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: '16px'
        }}>
          {[
            { step: '1. SORT', jp: 'Seiri', desc: 'Sifts incoming query content to isolate target files, workspace status, and relevant memories, trimming semantic clutter.' },
            { step: '2. SET IN ORDER', jp: 'Seiton', desc: 'Schedules a logical hierarchy of action steps (read, code, think, search) in a structured reasoning layout.' },
            { step: '3. SHINE', jp: 'Seiso', desc: 'Executes scripts in the JS/Python subprocess sandbox, reads logs, and builds workspace files to generate answers.' },
            { step: '4. STANDARDIZE', jp: 'Seiketsu', desc: 'Reviews result validity via a self-reflection critic loop, formatting responses and code outputs cleanly.' },
            { step: '5. SUSTAIN', jp: 'Shitsuke', desc: 'Appends learnings to the local long-term memories list and prints detailed audit log trace summaries.' }
          ].map((item, idx) => (
            <div key={idx} style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.04)',
              borderRadius: '8px',
              padding: '16px',
              fontSize: '0.85rem'
            }}>
              <div style={{ fontWeight: '700', color: 'var(--color-primary)', marginBottom: '2px' }}>{item.step}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dark)', marginBottom: '8px', fontStyle: 'italic' }}>{item.jp}</div>
              <div style={{ color: 'var(--text-muted)', lineHeight: 1.4 }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
