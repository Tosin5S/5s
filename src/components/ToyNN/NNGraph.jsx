import React from 'react';

function NNGraph({ layerSizes, weights, biases, activations, width = 600, height = 300 }) {
  const paddingX = 60;
  const paddingY = 40;

  // Render variables helper
  const layersCount = layerSizes.length;
  
  // Compute positions of nodes
  // If layer is large (like 64 inputs), we'll cap visual nodes to 8 and show ellipsis
  const getMaxVisualNodes = (layerIdx) => {
    return 8;
  };

  const getLayerNodes = (layerSize, maxNodes = 8) => {
    if (layerSize <= maxNodes) {
      return Array.from({ length: layerSize }, (_, i) => ({ index: i, type: 'real' }));
    }
    const nodes = [];
    for (let i = 0; i < maxNodes - 2; i++) {
      nodes.push({ index: i, type: 'real' });
    }
    nodes.push({ index: -1, type: 'ellipsis' });
    nodes.push({ index: layerSize - 1, type: 'real' });
    return nodes;
  };

  // Build node coordinates
  const nodePositions = []; // Array of layer node positions
  
  for (let l = 0; l < layersCount; l++) {
    const x = paddingX + (l * (width - 2 * paddingX)) / (layersCount - 1 || 1);
    const size = layerSizes[l];
    const visualNodes = getLayerNodes(size);
    const nodesInLayer = visualNodes.length;
    
    const layerPositions = visualNodes.map((vn, vidx) => {
      let y;
      if (nodesInLayer === 1) {
        y = height / 2;
      } else {
        y = paddingY + (vidx * (height - 2 * paddingY)) / (nodesInLayer - 1);
      }
      return {
        x,
        y,
        actualIdx: vn.index,
        type: vn.type
      };
    });
    
    nodePositions.push(layerPositions);
  }

  // Draw connections (edges)
  const edges = [];
  
  for (let l = 0; l < layersCount - 1; l++) {
    const currentLayer = nodePositions[l];
    const nextLayer = nodePositions[l + 1];
    const W = weights[l]; // Weight matrix for connections between l and l+1
    
    if (!W) continue;

    currentLayer.forEach((currNode, currVIdx) => {
      if (currNode.type === 'ellipsis') return;

      nextLayer.forEach((nextNode, nextVIdx) => {
        if (nextNode.type === 'ellipsis') return;

        const wVal = W[nextNode.actualIdx]?.[currNode.actualIdx] || 0;
        
        // Push edge info
        edges.push({
          x1: currNode.x,
          y1: currNode.y,
          x2: nextNode.x,
          y2: nextNode.y,
          weight: wVal,
          id: `e-${l}-${currNode.actualIdx}-${nextNode.actualIdx}`
        });
      });
    });
  }

  return (
    <div className="glass-card" style={{ padding: '16px', background: 'rgba(5, 8, 15, 0.9)', width: '100%', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
        <span>Network Synapse Connections</span>
        <div style={{ display: 'flex', gap: '12px' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '8px', height: '8px', backgroundColor: 'var(--color-primary)', borderRadius: '50%' }}></span> Positive Weight
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '8px', height: '8px', backgroundColor: 'var(--color-secondary)', borderRadius: '50%' }}></span> Negative Weight
          </span>
        </div>
      </div>

      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: 'block' }}>
        {/* Draw Edges */}
        {edges.map((edge) => {
          const absW = Math.min(Math.abs(edge.weight) * 1.5, 6); // Cap visual thickness
          const color = edge.weight >= 0 
            ? `rgba(0, 242, 254, ${Math.min(0.1 + absW * 0.15, 0.85)})` 
            : `rgba(161, 85, 255, ${Math.min(0.1 + absW * 0.15, 0.85)})`;
          
          return (
            <g key={edge.id}>
              <line
                x1={edge.x1}
                y1={edge.y1}
                x2={edge.x2}
                y2={edge.y2}
                stroke={color}
                strokeWidth={absW || 0.5}
              />
              {/* Optional glowing signal dot along connections to show activity */}
              {Math.abs(edge.weight) > 0.5 && (
                <circle r="2" fill={edge.weight >= 0 ? 'var(--color-primary)' : 'var(--color-secondary)'}>
                  <animateMotion
                    dur={`${4 - Math.min(Math.abs(edge.weight), 3)}s`}
                    repeatCount="indefinite"
                    path={`M ${edge.x1} ${edge.y1} L ${edge.x2} ${edge.y2}`}
                  />
                </circle>
              )}
            </g>
          );
        })}

        {/* Draw Nodes */}
        {nodePositions.map((layer, lIdx) =>
          layer.map((node, nIdx) => {
            if (node.type === 'ellipsis') {
              return (
                <g key={`ellipsis-${lIdx}-${nIdx}`} transform={`translate(${node.x}, ${node.y})`}>
                  <circle cx="0" cy="-6" r="2" fill="var(--text-dark)" />
                  <circle cx="0" cy="0" r="2" fill="var(--text-dark)" />
                  <circle cx="0" cy="6" r="2" fill="var(--text-dark)" />
                </g>
              );
            }

            // Get activation and bias for this node
            const actVal = (activations && activations[lIdx] && activations[lIdx][node.actualIdx] !== undefined)
              ? activations[lIdx][node.actualIdx]
              : 0;
            const biasVal = (lIdx > 0 && biases && biases[lIdx - 1])
              ? biases[lIdx - 1][node.actualIdx]
              : null;

            // Compute glowing border
            const glowOpacity = Math.min(actVal, 1) * 0.8;
            
            return (
              <g key={`node-${lIdx}-${node.actualIdx}`} transform={`translate(${node.x}, ${node.y})`} style={{ cursor: 'pointer' }}>
                {/* Node Outer Glow */}
                <circle
                  r="16"
                  fill="none"
                  stroke="var(--color-primary)"
                  strokeWidth="2"
                  style={{
                    opacity: glowOpacity,
                    filter: 'drop-shadow(0px 0px 4px var(--color-primary))',
                    transition: 'all 0.1s ease'
                  }}
                />
                {/* Node Body */}
                <circle
                  r="12"
                  fill={lIdx === 0 ? 'var(--bg-tertiary)' : lIdx === layerSizes.length - 1 ? 'rgba(0, 255, 157, 0.2)' : 'var(--bg-secondary)'}
                  stroke={glowOpacity > 0.1 ? 'var(--color-primary)' : 'var(--card-border)'}
                  strokeWidth="2"
                />
                {/* Activation Fill */}
                <circle
                  r="10"
                  fill="var(--color-primary)"
                  style={{
                    opacity: Math.min(actVal, 1) * 0.9,
                    transition: 'all 0.1s ease'
                  }}
                />

                {/* Node Label */}
                <text
                  y="4"
                  textAnchor="middle"
                  fill={actVal > 0.5 ? '#000' : 'var(--text-main)'}
                  fontSize="9px"
                  fontFamily="var(--font-code)"
                  fontWeight="600"
                >
                  {lIdx === 0 ? `I${node.actualIdx}` : lIdx === layerSizes.length - 1 ? `O${node.actualIdx}` : `H${node.actualIdx}`}
                </text>

                {/* Node Tooltip on Hover */}
                <title>
                  {`Node: ${lIdx === 0 ? 'Input' : lIdx === layerSizes.length - 1 ? 'Output' : 'Hidden'} #${node.actualIdx}\n`}
                  {`Activation: ${actVal.toFixed(4)}\n`}
                  {biasVal !== null ? `Bias: ${biasVal.toFixed(4)}` : ''}
                </title>
              </g>
            );
          })
        )}
      </svg>
    </div>
  );
}

export default NNGraph;
