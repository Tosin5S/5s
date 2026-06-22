import React, { useState, useEffect, useRef } from 'react';
import { NeuralNetwork } from './nnEngine';
import NNGraph from './NNGraph';
import DrawGrid from './DrawGrid';

// Custom canvas-based Loss Chart
function LossChart({ history }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.fillStyle = '#05080f';
    ctx.fillRect(0, 0, width, height);

    // Draw Grid Lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    if (history.length < 2) return;

    // Draw Line Chart
    ctx.strokeStyle = '#00f2fe';
    ctx.lineWidth = 2;
    ctx.beginPath();

    const maxPoints = 150;
    const data = history.length > maxPoints ? history.slice(-maxPoints) : history;
    const step = width / (data.length - 1);
    
    // Scale loss between 0 and 0.5 (XOR max loss)
    const maxVal = Math.max(...data, 0.1);
    
    data.forEach((loss, idx) => {
      const x = idx * step;
      const y = height - (loss / maxVal) * (height - 15) - 5;
      if (idx === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    // Draw area fill
    ctx.lineTo((data.length - 1) * step, height);
    ctx.lineTo(0, height);
    ctx.fillStyle = 'rgba(0, 242, 254, 0.05)';
    ctx.fill();
  }, [history]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
        <span>Training Loss Curve (MSE)</span>
        <span>Current: {history.length > 0 ? history[history.length - 1].toFixed(6) : '0.000000'}</span>
      </div>
      <canvas ref={canvasRef} width="300" height="120" style={{ borderRadius: '8px', border: '1px solid var(--card-border)', display: 'block', width: '100%' }} />
    </div>
  );
}

function ToyNNPage({ onEpochsTrained }) {
  const [task, setTask] = useState('xor'); // 'xor' or 'draw'
  const [hiddenLayers, setHiddenLayers] = useState('3'); // text input
  const [activation, setActivation] = useState('sigmoid');
  const [learningRate, setLearningRate] = useState(0.3);
  
  const [nn, setNN] = useState(null);
  const [lossHistory, setLossHistory] = useState([]);
  const [epoch, setEpoch] = useState(0);
  const [isTraining, setIsTraining] = useState(false);
  const [epochsPerSec, setEpochsPerSec] = useState(50);

  // XOR specifics
  const [xorInput, setXorInput] = useState([0, 0]);
  const [liveActivations, setLiveActivations] = useState(null);

  // Drawing classifier specifics
  const [labels, setLabels] = useState(['Vertical Line', 'Horizontal Line']);
  const [dataset, setDataset] = useState([]);
  const [currentDraw, setCurrentDraw] = useState(Array(64).fill(0));
  const [prediction, setPrediction] = useState(null);

  // Initialize network
  const initNetwork = () => {
    let layerSizes = [];
    const hidden = hiddenLayers.split(',').map(n => parseInt(n.trim(), 10)).filter(n => !isNaN(n) && n > 0);
    
    if (task === 'xor') {
      layerSizes = [2, ...hidden, 1];
    } else {
      layerSizes = [64, ...hidden, 2]; // 2 classes
    }

    const newNN = new NeuralNetwork(layerSizes, activation);
    setNN(newNN);
    setLossHistory([]);
    setEpoch(0);
    setIsTraining(false);
    
    // Trigger initial forward pass
    if (task === 'xor') {
      const res = newNN.forward(xorInput);
      setLiveActivations(res.activations);
    } else {
      const res = newNN.forward(currentDraw);
      setLiveActivations(res.activations);
      setPrediction(res.activations[res.activations.length - 1]);
    }
  };

  // Re-init network on task, hidden layer, or activation change
  useEffect(() => {
    initNetwork();
  }, [task, hiddenLayers, activation]);

  // Handle XOR Input changes
  useEffect(() => {
    if (task === 'xor' && nn) {
      const res = nn.forward(xorInput);
      setLiveActivations(res.activations);
    }
  }, [xorInput, nn, task]);

  // Handle Draw grid updates
  const handleDrawChange = (pixels) => {
    setCurrentDraw(pixels);
    if (task === 'draw' && nn) {
      const res = nn.forward(pixels);
      setLiveActivations(res.activations);
      setPrediction(res.activations[res.activations.length - 1]);
    }
  };

  // Add draw grid sample to training dataset
  const handleAddPattern = (pixels, labelName) => {
    const labelIdx = labels.indexOf(labelName);
    const target = Array(labels.length).fill(0);
    target[labelIdx] = 1;
    
    setDataset([...dataset, { input: pixels, target, labelName }]);
  };

  // Clear drawing dataset
  const clearDataset = () => {
    setDataset([]);
    setLossHistory([]);
    setEpoch(0);
  };

  // Active training loop in background
  useEffect(() => {
    if (!isTraining || !nn) return;

    let id;
    const trainLoop = () => {
      let inputs, targets;

      if (task === 'xor') {
        inputs = [[0, 0], [0, 1], [1, 0], [1, 1]];
        targets = [[0], [1], [1], [0]];
      } else {
        if (dataset.length === 0) {
          setIsTraining(false);
          alert('Add some pattern samples to the dataset first before training!');
          return;
        }
        inputs = dataset.map(d => d.input);
        targets = dataset.map(d => d.target);
      }

      // Train batch multiple times depending on velocity settings
      const batchRuns = Math.max(1, Math.floor(epochsPerSec / 10));
      let lastLoss = 0;
      for (let i = 0; i < batchRuns; i++) {
        lastLoss = nn.trainBatch(inputs, targets, learningRate);
      }
      
      setLossHistory(prev => [...prev, lastLoss]);
      setEpoch(prev => {
        const nextEpoch = prev + batchRuns;
        if (onEpochsTrained) onEpochsTrained(batchRuns);
        return nextEpoch;
      });

      // Update current live activations visual
      if (task === 'xor') {
        const res = nn.forward(xorInput);
        setLiveActivations(res.activations);
      } else {
        const res = nn.forward(currentDraw);
        setLiveActivations(res.activations);
        setPrediction(res.activations[res.activations.length - 1]);
      }

      id = setTimeout(trainLoop, 100);
    };

    id = setTimeout(trainLoop, 100);
    return () => clearTimeout(id);
  }, [isTraining, nn, task, dataset, epochsPerSec, xorInput, learningRate, currentDraw]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '800' }}>Toy Neural Network</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            A fully custom backpropagation engine running entirely in your browser window.
          </p>
        </div>

        {/* Task toggle */}
        <div style={{ display: 'flex', border: '1px solid var(--card-border)', borderRadius: '8px', overflow: 'hidden' }}>
          <button
            onClick={() => setTask('xor')}
            style={{
              padding: '8px 16px',
              backgroundColor: task === 'xor' ? 'rgba(0, 242, 254, 0.15)' : 'var(--bg-secondary)',
              color: task === 'xor' ? 'var(--color-primary)' : 'var(--text-muted)',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            XOR Solver
          </button>
          <button
            onClick={() => setTask('draw')}
            style={{
              padding: '8px 16px',
              backgroundColor: task === 'draw' ? 'rgba(0, 242, 254, 0.15)' : 'var(--bg-secondary)',
              color: task === 'draw' ? 'var(--color-primary)' : 'var(--text-muted)',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            Pattern Recognition
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '24px' }}>
        {/* Sidebar Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Controls Box */}
          <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '1.05rem', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '8px' }}>
              Network Parameters
            </h3>

            {/* Hidden Layers */}
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Hidden Layer Structure
              </label>
              <input
                type="text"
                value={hiddenLayers}
                onChange={(e) => setHiddenLayers(e.target.value)}
                placeholder="e.g. 4, 3"
                className="input-text"
              />
              <span style={{ fontSize: '0.7rem', color: 'var(--text-dark)', marginTop: '4px', display: 'block' }}>
                Comma separated layer node counts (e.g. '3' or '8, 4').
              </span>
            </div>

            {/* Activation Type */}
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Activation Function
              </label>
              <select
                value={activation}
                onChange={(e) => setActivation(e.target.value)}
                className="input-text"
                style={{ background: 'var(--bg-primary)' }}
              >
                <option value="sigmoid">Sigmoid</option>
                <option value="tanh">Tanh</option>
                <option value="relu">ReLU</option>
              </select>
            </div>

            {/* Learning Rate */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                <span>Learning Rate (η)</span>
                <span>{learningRate}</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="1.0"
                step="0.05"
                value={learningRate}
                onChange={(e) => setLearningRate(parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--color-primary)' }}
              />
            </div>

            {/* Re-initialize weights */}
            <button onClick={initNetwork} className="btn" style={{ justifyContent: 'center' }}>
              Re-initialize Weights
            </button>
          </div>

          {/* Training Execution Box */}
          <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '1.05rem', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '8px' }}>
              Training Control
            </h3>
            
            <div style={{ fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Epochs Trained:</span>
              <span style={{ fontFamily: 'var(--font-code)', fontWeight: 'bold' }}>{epoch}</span>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setIsTraining(!isTraining)}
                className={`btn btn-primary`}
                style={{ flex: 1, justifyContent: 'center' }}
              >
                {isTraining ? (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="6" y="4" width="4" height="16" />
                      <rect x="14" y="4" width="4" height="16" />
                    </svg>
                    Pause
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                    Train Loop
                  </>
                )}
              </button>
            </div>

            {/* Training speed */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                <span>Training Iteration Speed</span>
                <span>{epochsPerSec} ep/s</span>
              </div>
              <input
                type="range"
                min="10"
                max="500"
                step="10"
                value={epochsPerSec}
                onChange={(e) => setEpochsPerSec(parseInt(e.target.value, 10))}
                style={{ width: '100%', accentColor: 'var(--color-primary)' }}
              />
            </div>

            {/* Loss curve */}
            <LossChart history={lossHistory} />
          </div>
        </div>

        {/* Visualizer & Interactive test bench */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* SVG Net Visualizer */}
          {nn && liveActivations && (
            <NNGraph
              layerSizes={nn.layerSizes}
              weights={nn.weights}
              biases={nn.biases}
              activations={liveActivations}
              height={300}
            />
          )}

          {/* Test bench panel */}
          <div className="glass-card" style={{ padding: '24px' }}>
            {task === 'xor' ? (
              <div>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '16px' }}>Interactive XOR Test Gate</h3>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                  {/* Select Input A & B */}
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                      onClick={() => setXorInput(prev => [prev[0] === 1 ? 0 : 1, prev[1]])}
                      className="btn"
                      style={{
                        padding: '12px 24px',
                        fontSize: '1rem',
                        borderColor: xorInput[0] === 1 ? 'var(--color-primary)' : 'var(--card-border)',
                        color: xorInput[0] === 1 ? 'var(--color-primary)' : 'var(--text-muted)',
                        background: xorInput[0] === 1 ? 'rgba(0, 242, 254, 0.05)' : 'var(--bg-tertiary)'
                      }}
                    >
                      Input A: <b>{xorInput[0]}</b>
                    </button>
                    <button
                      onClick={() => setXorInput(prev => [prev[0], prev[1] === 1 ? 0 : 1])}
                      className="btn"
                      style={{
                        padding: '12px 24px',
                        fontSize: '1rem',
                        borderColor: xorInput[1] === 1 ? 'var(--color-primary)' : 'var(--card-border)',
                        color: xorInput[1] === 1 ? 'var(--color-primary)' : 'var(--text-muted)',
                        background: xorInput[1] === 1 ? 'rgba(0, 242, 254, 0.05)' : 'var(--bg-tertiary)'
                      }}
                    >
                      Input B: <b>{xorInput[1]}</b>
                    </button>
                  </div>

                  <div style={{
                    fontSize: '2.5rem',
                    color: 'var(--text-dark)',
                    margin: '0 12px'
                  }}>→</div>

                  {/* Render Outputs */}
                  <div style={{
                    background: 'rgba(5, 8, 15, 0.7)',
                    padding: '16px 24px',
                    borderRadius: '10px',
                    border: '1px solid var(--card-border)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Target Output: {xorInput[0] ^ xorInput[1]}</span>
                    <span style={{
                      fontSize: '1.8rem',
                      fontWeight: 'bold',
                      color: 'var(--color-success)',
                      fontFamily: 'var(--font-code)'
                    }}>
                      {(liveActivations && liveActivations[liveActivations.length - 1]?.[0] !== undefined)
                        ? liveActivations[liveActivations.length - 1][0].toFixed(5)
                        : '0.00000'}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dark)' }}>
                      Decision threshold (0.5): <b>{((liveActivations && liveActivations[liveActivations.length - 1]?.[0]) > 0.5) ? '1' : '0'}</b>
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '24px' }}>
                <DrawGrid
                  onDrawChange={handleDrawChange}
                  onAddPattern={handleAddPattern}
                  labelOptions={labels}
                />

                <div>
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '12px' }}>Training Samples ({dataset.length})</h3>
                  
                  {/* List of current samples */}
                  <div style={{
                    maxHeight: '140px',
                    overflowY: 'auto',
                    border: '1px solid var(--card-border)',
                    borderRadius: '8px',
                    background: '#05080f',
                    padding: '8px',
                    marginBottom: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}>
                    {dataset.length === 0 ? (
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-dark)', fontStyle: 'italic', display: 'block', textAlign: 'center', padding: '12px' }}>
                        No samples yet. Draw patterns on the left and label them.
                      </span>
                    ) : (
                      dataset.map((data, idx) => (
                        <div key={idx} style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          fontSize: '0.8rem',
                          background: 'rgba(255,255,255,0.02)',
                          padding: '6px 10px',
                          borderRadius: '4px'
                        }}>
                          <span>Sample #{idx + 1}: <b>{data.labelName}</b></span>
                          <button
                            onClick={() => {
                              const nd = [...dataset];
                              nd.splice(idx, 1);
                              setDataset(nd);
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--color-error)',
                              cursor: 'pointer'
                            }}
                          >
                            Remove
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  {dataset.length > 0 && (
                    <button onClick={clearDataset} className="btn btn-danger" style={{ marginBottom: '16px', padding: '6px 12px', fontSize: '0.8rem' }}>
                      Clear Dataset
                    </button>
                  )}

                  {/* Predictions */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <h4 style={{ fontSize: '0.95rem' }}>Live Classification Prediction</h4>
                    {prediction ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {labels.map((lbl, idx) => {
                          const prob = prediction[idx] || 0;
                          return (
                            <div key={lbl}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                                <span>{lbl}</span>
                                <span style={{ fontFamily: 'var(--font-code)' }}>{(prob * 100).toFixed(2)}%</span>
                              </div>
                              <div style={{ width: '100%', height: '8px', background: 'var(--bg-tertiary)', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{
                                  width: `${prob * 100}%`,
                                  height: '100%',
                                  background: idx === 0 ? 'var(--color-primary)' : 'var(--color-secondary)',
                                  boxShadow: 'var(--shadow-glow)'
                                }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-dark)', fontStyle: 'italic' }}>
                        Initialize network to check prediction.
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ToyNNPage;
