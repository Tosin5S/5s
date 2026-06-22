import React, { useState, useEffect } from 'react';
import { runAgentLoop } from './agentService';
import ThoughtTree from './ThoughtTree';
import MemoryMap from './MemoryMap';
import WorkspacePanel from './WorkspacePanel';

function AgentPage({ apiKey, onSandboxRun }) {
  const [prompt, setPrompt] = useState('Create a hello_world.js file, run it in the sandbox, and save the result to memory');
  const [steps, setSteps] = useState([]);
  const [memories, setMemories] = useState([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [finalResponse, setFinalResponse] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Load memories from backend
  const loadMemories = async () => {
    try {
      const res = await fetch('/api/memory');
      const data = await res.json();
      if (data.success && data.memories) {
        setMemories(data.memories);
      }
    } catch (e) {
      console.error('Failed to load memories', e);
    }
  };

  useEffect(() => {
    loadMemories();
  }, []);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!prompt.trim() || isExecuting) return;

    setIsExecuting(true);
    setFinalResponse('');
    setSteps([]);

    const result = await runAgentLoop({
      prompt,
      apiKey,
      onStepUpdate: (updatedSteps) => {
        setSteps(updatedSteps);
      },
      onSandboxRun
    });

    setIsExecuting(false);
    if (result.success) {
      setFinalResponse(result.response);
    } else {
      setFinalResponse(`### Error Executing Loop\n\n${result.response}`);
    }

    // Refresh memory nodes and files list on completion
    loadMemories();
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '800' }}>5S Cognitive Agent</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          An autonomous reasoning agent operating under the Sort, Set in Order, Shine, Standardize, Sustain workspace methodology.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '24px', alignItems: 'start' }}>
        {/* Left Column: Chat input & Thought Stream */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Query input card */}
          <div className="glass-card glow-teal" style={{ padding: '20px' }}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: '600' }}>Instruct 5s Agent</label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Ask the agent to build, examine, execute or remember..."
                  rows="3"
                  className="input-text"
                  style={{ resize: 'vertical', fontSize: '0.9rem', lineHeight: 1.4 }}
                  disabled={isExecuting}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {!apiKey && (
                    <span style={{ color: 'var(--color-warning)' }}>
                      ⚠️ Running in <b>Simulated Reasoning Mode</b> (Mock LLM, actual file/sandbox calls). Enter a key in the sidebar for Live Mode.
                    </span>
                  )}
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isExecuting || !prompt.trim()}
                  style={{ alignSelf: 'flex-end', padding: '10px 24px' }}
                >
                  {isExecuting ? (
                    <>
                      <span className="pulse">🤖 Executing Cycle...</span>
                    </>
                  ) : (
                    'Run 5S Agent'
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Thought stream logs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-main)', paddingLeft: '4px' }}>
              Cognitive Thought Stream
            </span>
            <ThoughtTree steps={steps} />
          </div>

          {/* Final response card */}
          {finalResponse && (
            <div className="glass-card" style={{
              padding: '24px',
              border: '1px solid rgba(0, 255, 157, 0.25)',
              background: 'rgba(5, 15, 10, 0.45)',
              animation: 'fadeIn 0.3s ease-out'
            }}>
              <h3 style={{ fontSize: '1.05rem', color: 'var(--color-success)', marginBottom: '12px', borderBottom: '1px solid rgba(0, 255, 157, 0.1)', paddingBottom: '6px' }}>
                Terminal Output Response
              </h3>
              <div style={{
                fontSize: '0.9rem',
                lineHeight: 1.6,
                color: '#fff',
                whiteSpace: 'pre-wrap'
              }}>
                {finalResponse}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Memory Map & Workspace Explorer */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Memory Web */}
          <MemoryMap memories={memories} onRefresh={loadMemories} />
          
          {/* Workspace view */}
          <WorkspacePanel onSandboxRun={onSandboxRun} refreshTrigger={refreshTrigger} />
        </div>
      </div>
    </div>
  );
}

export default AgentPage;
