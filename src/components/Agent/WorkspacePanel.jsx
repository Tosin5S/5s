import React, { useState, useEffect } from 'react';

function WorkspacePanel({ onSandboxRun, refreshTrigger }) {
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState('');
  
  const [sandboxCode, setSandboxCode] = useState(`// Manually execute code in the 5s sandbox\nconsole.log("Running in sandbox...");\nconst fs = require('fs');\nconsole.log("Workspace files:", fs.readdirSync(process.cwd()));`);
  const [sandboxLanguage, setSandboxLanguage] = useState('javascript');
  const [sandboxResult, setSandboxResult] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState('files'); // 'files' or 'sandbox'

  // Fetch file list
  const fetchFiles = async () => {
    try {
      const res = await fetch('/api/files');
      const data = await res.json();
      if (data.success) {
        setFiles(data.files);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [refreshTrigger]);

  // Load selected file content
  const handleSelectFile = async (filePath) => {
    setSelectedFile(filePath);
    try {
      const res = await fetch(`/api/file?filePath=${encodeURIComponent(filePath)}`);
      const data = await res.json();
      if (data.success) {
        setFileContent(data.content);
      } else {
        setFileContent(`Error loading file: ${data.error}`);
      }
    } catch (e) {
      setFileContent(`Failed to read file: ${e.message}`);
    }
  };

  // Delete file
  const handleDeleteFile = async (filePath) => {
    if (!confirm(`Are you sure you want to delete "${filePath}"?`)) return;
    try {
      const res = await fetch('/api/file', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath })
      });
      const data = await res.json();
      if (data.success) {
        setSelectedFile(null);
        setFileContent('');
        fetchFiles();
      }
    } catch (e) {
      alert(`Error deleting file: ${e.message}`);
    }
  };

  // Run custom sandbox script
  const handleRunCode = async () => {
    setIsRunning(true);
    setSandboxResult(null);
    try {
      if (onSandboxRun) onSandboxRun();
      
      const res = await fetch('/api/sandbox/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: sandboxCode, language: sandboxLanguage })
      });
      const data = await res.json();
      setSandboxResult(data);
      fetchFiles(); // Refresh file list in case the script created a file!
    } catch (e) {
      setSandboxResult({ success: false, error: e.message });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
      {/* Sub Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--card-border)', paddingBottom: '10px', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => setActiveSubTab('files')}
            style={{
              background: 'none',
              border: 'none',
              color: activeSubTab === 'files' ? 'var(--color-primary)' : 'var(--text-muted)',
              fontSize: '0.95rem',
              fontWeight: activeSubTab === 'files' ? '600' : '400',
              cursor: 'pointer',
              borderBottom: activeSubTab === 'files' ? '2px solid var(--color-primary)' : 'none',
              paddingBottom: '4px'
            }}
          >
            Workspace Explorer
          </button>
          <button
            onClick={() => setActiveSubTab('sandbox')}
            style={{
              background: 'none',
              border: 'none',
              color: activeSubTab === 'sandbox' ? 'var(--color-secondary)' : 'var(--text-muted)',
              fontSize: '0.95rem',
              fontWeight: activeSubTab === 'sandbox' ? '600' : '400',
              cursor: 'pointer',
              borderBottom: activeSubTab === 'sandbox' ? '2px solid var(--color-secondary)' : 'none',
              paddingBottom: '4px'
            }}
          >
            Sandbox Runner
          </button>
        </div>
        <button onClick={fetchFiles} className="btn" style={{ padding: '4px 8px', fontSize: '0.7rem' }}>
          ↻ Refresh
        </button>
      </div>

      {/* Explorer Tab */}
      {activeSubTab === 'files' && (
        <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '16px', height: '360px' }}>
          {/* File List */}
          <div style={{
            borderRight: '1px solid var(--card-border)',
            paddingRight: '8px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px'
          }}>
            {files.length === 0 ? (
              <span style={{ fontSize: '0.8rem', color: 'var(--text-dark)', fontStyle: 'italic', padding: '8px' }}>
                No workspace files found.
              </span>
            ) : (
              files.map(f => {
                const isSelected = selectedFile === f.path;
                return (
                  <button
                    key={f.path}
                    onClick={() => handleSelectFile(f.path)}
                    style={{
                      width: '100%',
                      background: isSelected ? 'rgba(255,255,255,0.05)' : 'none',
                      border: 'none',
                      color: isSelected ? 'var(--color-primary)' : 'var(--text-main)',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontSize: '0.8rem',
                      fontFamily: 'var(--font-code)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    📄 {f.path}
                  </button>
                );
              })
            )}
          </div>

          {/* File content display */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', height: '100%' }}>
            {selectedFile ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', fontFamily: 'var(--font-code)', color: 'var(--color-primary)' }}>
                    {selectedFile}
                  </span>
                  <button onClick={() => handleDeleteFile(selectedFile)} className="btn btn-danger" style={{ padding: '2px 8px', fontSize: '0.7rem' }}>
                    Delete
                  </button>
                </div>
                <textarea
                  readOnly
                  value={fileContent}
                  style={{
                    flex: 1,
                    background: '#040711',
                    border: '1px solid var(--card-border)',
                    borderRadius: '8px',
                    padding: '12px',
                    fontFamily: 'var(--font-code)',
                    fontSize: '0.8rem',
                    color: '#c9d1d9',
                    resize: 'none',
                    outline: 'none'
                  }}
                />
              </>
            ) : (
              <div style={{
                margin: 'auto',
                color: 'var(--text-dark)',
                fontSize: '0.8rem',
                fontStyle: 'italic'
              }}>
                Select a file from the explorer list to read content
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sandbox Tab */}
      {activeSubTab === 'sandbox' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', height: '360px' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Language:</span>
            <select
              value={sandboxLanguage}
              onChange={(e) => setSandboxLanguage(e.target.value)}
              className="input-text"
              style={{ width: '120px', padding: '4px 8px', fontSize: '0.8rem', background: 'var(--bg-primary)' }}
            >
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
            </select>

            <button
              onClick={handleRunCode}
              disabled={isRunning}
              className="btn btn-primary"
              style={{ padding: '6px 16px', fontSize: '0.8rem' }}
            >
              {isRunning ? 'Running...' : '⚡ Execute Code'}
            </button>
          </div>

          <textarea
            value={sandboxCode}
            onChange={(e) => setSandboxCode(e.target.value)}
            style={{
              flex: 1.5,
              background: '#040711',
              border: '1px solid var(--card-border)',
              borderRadius: '8px',
              padding: '12px',
              fontFamily: 'var(--font-code)',
              fontSize: '0.8rem',
              color: '#c9d1d9',
              resize: 'none',
              outline: 'none'
            }}
          />

          <div style={{
            flex: 1,
            background: '#02040a',
            border: '1px solid var(--card-border)',
            borderRadius: '8px',
            padding: '12px',
            fontFamily: 'var(--font-code)',
            fontSize: '0.75rem',
            color: sandboxResult?.success ? 'var(--color-success)' : 'var(--text-main)',
            overflowY: 'auto',
            whiteSpace: 'pre-wrap'
          }}>
            {sandboxResult ? (
              <>
                {sandboxResult.success ? (
                  <div>
                    <div style={{ color: 'var(--color-success)', fontWeight: 'bold', marginBottom: '4px' }}>✓ Success</div>
                    {sandboxResult.stdout && <div>{sandboxResult.stdout}</div>}
                    {sandboxResult.stderr && <div style={{ color: 'var(--color-warning)' }}>{sandboxResult.stderr}</div>}
                  </div>
                ) : (
                  <div>
                    <div style={{ color: 'var(--color-error)', fontWeight: 'bold', marginBottom: '4px' }}>✗ Failed</div>
                    {sandboxResult.error && <div style={{ color: 'var(--color-error)' }}>{sandboxResult.error}</div>}
                    {sandboxResult.stderr && <div>{sandboxResult.stderr}</div>}
                    {sandboxResult.stdout && <div>{sandboxResult.stdout}</div>}
                  </div>
                )}
              </>
            ) : (
              <span style={{ color: 'var(--text-dark)', fontStyle: 'italic' }}>Output results will display here.</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default WorkspacePanel;
