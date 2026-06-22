// Custom Feedforward Neural Network implemented from scratch in pure ES6 Javascript

export class NeuralNetwork {
  constructor(layerSizes, activationType = 'sigmoid') {
    this.layerSizes = layerSizes; // e.g., [2, 4, 1] for XOR
    this.activationType = activationType;
    this.weights = []; // Array of matrices (layers - 1)
    this.biases = []; // Array of vectors (layers - 1)
    
    this.initializeWeights();
  }

  // Weight initialization using Glorot/Xavier style
  initializeWeights() {
    this.weights = [];
    this.biases = [];
    
    for (let i = 0; i < this.layerSizes.length - 1; i++) {
      const inputs = this.layerSizes[i];
      const outputs = this.layerSizes[i + 1];
      
      // Weight matrix dimensions: outputs x inputs
      const layerWeights = [];
      const range = Math.sqrt(6 / (inputs + outputs)); // Glorot range
      
      for (let o = 0; o < outputs; o++) {
        const row = [];
        for (let inp = 0; inp < inputs; inp++) {
          // Random value between -range and +range
          row.push(Math.random() * 2 * range - range);
        }
        layerWeights.push(row);
      }
      this.weights.push(layerWeights);
      
      // Biases: 1 x outputs, initialized to zero or small positive values
      const layerBiases = [];
      for (let o = 0; o < outputs; o++) {
        layerBiases.push(0);
      }
      this.biases.push(layerBiases);
    }
  }

  // Activation functions
  activate(x) {
    switch (this.activationType) {
      case 'sigmoid':
        return 1 / (1 + Math.exp(-x));
      case 'tanh':
        return Math.tanh(x);
      case 'relu':
        return Math.max(0, x);
      default:
        return 1 / (1 + Math.exp(-x));
    }
  }

  // Derivative of activation functions (x is the output of the activation function)
  activationDerivative(a) {
    switch (this.activationType) {
      case 'sigmoid':
        return a * (1 - a);
      case 'tanh':
        return 1 - a * a;
      case 'relu':
        return a > 0 ? 1 : 0;
      default:
        return a * (1 - a);
    }
  }

  // Forward propagate inputs, returns all activation levels (for visualizer + backprop)
  forward(inputs) {
    const activations = [inputs];
    const zs = []; // Pre-activation values

    let currentActivation = inputs;
    for (let i = 0; i < this.weights.length; i++) {
      const W = this.weights[i];
      const B = this.biases[i];
      const nextActivation = [];
      const zValues = [];

      for (let o = 0; o < W.length; o++) {
        let sum = B[o];
        for (let inp = 0; inp < W[o].length; inp++) {
          sum += W[o][inp] * currentActivation[inp];
        }
        zValues.push(sum);
        nextActivation.push(this.activate(sum));
      }
      
      zs.push(zValues);
      currentActivation = nextActivation;
      activations.push(currentActivation);
    }
    
    return { activations, zs };
  }

  // Backpropagation to calculate gradients and update weights/biases
  trainStep(inputs, targets, learningRate = 0.1) {
    const { activations, zs } = this.forward(inputs);
    const outputIndex = this.weights.length;
    
    // Accumulate errors starting at the output layer
    let deltas = [];
    const outputActivations = activations[outputIndex];
    const outputDeltas = [];

    // Calculate MSE derivative for output layer
    // Error = output - target. Delta = Error * f'(z)
    for (let o = 0; o < outputActivations.length; o++) {
      const error = outputActivations[o] - targets[o];
      const delta = error * this.activationDerivative(outputActivations[o]);
      outputDeltas.push(delta);
    }
    deltas[outputIndex - 1] = outputDeltas;

    // Backpropagate error to hidden layers
    for (let i = this.weights.length - 2; i >= 0; i--) {
      const W_next = this.weights[i + 1];
      const deltas_next = deltas[i + 1];
      const layerActivations = activations[i + 1];
      const layerDeltas = [];

      for (let j = 0; j < this.layerSizes[i + 1]; j++) {
        let error = 0;
        for (let k = 0; k < W_next.length; k++) {
          error += W_next[k][j] * deltas_next[k];
        }
        const delta = error * this.activationDerivative(layerActivations[j]);
        layerDeltas.push(delta);
      }
      deltas[i] = layerDeltas;
    }

    // Update weights and biases using the computed deltas
    for (let i = 0; i < this.weights.length; i++) {
      const W = this.weights[i];
      const B = this.biases[i];
      const delta = deltas[i];
      const inputActivations = activations[i];

      for (let o = 0; o < W.length; o++) {
        // Update weights
        for (let inp = 0; inp < W[o].length; inp++) {
          W[o][inp] -= learningRate * delta[o] * inputActivations[inp];
        }
        // Update biases
        B[o] -= learningRate * delta[o];
      }
    }

    // Return individual MSE Loss: 0.5 * sum((output - target)^2)
    let loss = 0;
    for (let o = 0; o < outputActivations.length; o++) {
      loss += 0.5 * Math.pow(outputActivations[o] - targets[o], 2);
    }
    return loss;
  }

  // Train over a batch of inputs and targets, returns average MSE loss
  trainBatch(batchInputs, batchTargets, learningRate = 0.1) {
    let totalLoss = 0;
    for (let i = 0; i < batchInputs.length; i++) {
      totalLoss += this.trainStep(batchInputs[i], batchTargets[i], learningRate);
    }
    return totalLoss / batchInputs.length;
  }
}
