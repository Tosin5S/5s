import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import DashboardPage from './components/DashboardPage';
import ToyNNPage from './components/ToyNN/ToyNNPage';
import AgentPage from './components/Agent/AgentPage';
import SelfEvolutionPage from './components/SelfEvolution/SelfEvolutionPage';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('5s_api_key') || '');
  const [stats, setStats] = useState({
    fileCount: 0,
    memoryCount: 0,
    sandboxRuns: 0,
    nnTrainedEpochs: 0
  });

  // Save API key to local storage
  useEffect(() => {
    localStorage.setItem('5s_api_key', apiKey);
  }, [apiKey]);

  // Load system stats from local storage/backend on mount and periodically
  const fetchStats = async () => {
    try {
      const filesRes = await fetch('/api/files');
      const filesData = await filesRes.json();
      const memRes = await fetch('/api/memory');
      const memData = await memRes.json();
      
      const savedRuns = parseInt(localStorage.getItem('5s_sandbox_runs') || '0', 10);
      const savedEpochs = parseInt(localStorage.getItem('5s_nn_epochs') || '0', 10);

      setStats({
        fileCount: filesData.success ? filesData.files.length : 0,
        memoryCount: memData.success ? memData.memories.length : 0,
        sandboxRuns: savedRuns,
        nnTrainedEpochs: savedEpochs
      });
    } catch (e) {
      console.error('Failed to fetch dashboard stats', e);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        apiKey={apiKey} 
        setApiKey={setApiKey} 
      />
      
      <main style={{ 
        flex: 1, 
        overflowY: 'auto', 
        padding: '24px', 
        display: 'flex', 
        flexDirection: 'column',
        gap: '20px' 
      }}>
        {activeTab === 'dashboard' && (
          <DashboardPage stats={stats} setTab={setActiveTab} />
        )}
        {activeTab === 'toynn' && (
          <ToyNNPage onEpochsTrained={(epochs) => {
            const current = parseInt(localStorage.getItem('5s_nn_epochs') || '0', 10);
            localStorage.setItem('5s_nn_epochs', current + epochs);
            fetchStats();
          }} />
        )}
        {activeTab === 'agent' && (
          <AgentPage 
            apiKey={apiKey} 
            onSandboxRun={() => {
              const current = parseInt(localStorage.getItem('5s_sandbox_runs') || '0', 10);
              localStorage.setItem('5s_sandbox_runs', current + 1);
              fetchStats();
            }}
            onNavigate={setActiveTab}
          />
        )}
        {activeTab === 'evolution' && (
          <SelfEvolutionPage apiKey={apiKey} />
        )}
      </main>
    </div>
  );
}

export default App;
