import { NeuralNetwork } from '../src/components/ToyNN/nnEngine.js';

// Instantiate network: 2 inputs, 3 hidden neurons, 1 output
const nn = new NeuralNetwork([2, 3, 1], 'sigmoid');
const inputs = [
  [0, 0],
  [0, 1],
  [1, 0],
  [1, 1]
];
const targets = [
  [0],
  [1],
  [1],
  [0]
];

console.log('--- Training Toy Neural Network on XOR Gate from Scratch ---');
let lastLoss = 1;

for (let epoch = 1; epoch <= 5000; epoch++) {
  lastLoss = nn.trainBatch(inputs, targets, 0.3);
  if (epoch % 1000 === 0) {
    console.log(`Epoch ${epoch} | Average Batch MSE Loss: ${lastLoss.toFixed(6)}`);
  }
}

console.log('\n--- Training Complete ---');
console.log('Verifying Predictions:');

inputs.forEach(inp => {
  const res = nn.forward(inp);
  const prediction = res.activations[res.activations.length - 1][0];
  const target = inp[0] ^ inp[1];
  console.log(`Input: [${inp.join(', ')}] -> Target: ${target} | Predicted: ${prediction.toFixed(4)} (${prediction > 0.5 ? '1' : '0'})`);
});

if (lastLoss < 0.05) {
  console.log('\nSUCCESS: The Toy Neural Network successfully converged and solved the XOR gate!');
} else {
  console.log('\nFAILURE: Neural Network failed to converge.');
}
