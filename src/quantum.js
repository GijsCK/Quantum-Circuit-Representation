// Basis order is |q0 q1 ...⟩; q0 is the leftmost bit.
// A state has 2^n amplitudes, each { re, im }.
const complex = (re, im = 0) => ({ re, im });
const add = (a, b) => complex(a.re + b.re, a.im + b.im);
const multiply = (a, b) => complex(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re);
const magnitudeSquared = (a) => a.re * a.re + a.im * a.im;
const h = Math.SQRT1_2;

export const GATES = {
  H: {
    matrix: [[complex(h), complex(h)], [complex(h), complex(-h)]],
    explanation: 'H (Hadamard) exchanges x and z, and reverses y. From |0⟩ it makes an equal superposition pointing along +x.',
  },
  X: {
    matrix: [[complex(0), complex(1)], [complex(1), complex(0)]],
    explanation: 'X rotates the arrow 180° around x. It exchanges the |0⟩ and |1⟩ amplitudes.',
  },
  Y: {
    matrix: [[complex(0), complex(0, -1)], [complex(0, 1), complex(0)]],
    explanation: 'Y rotates the arrow 180° around y. It exchanges the amplitudes and changes their phases.',
  },
  Z: {
    matrix: [[complex(1), complex(0)], [complex(0), complex(-1)]],
    explanation: 'Z rotates the arrow 180° around z. It negates amplitudes where the selected qubit is 1; the Z-basis probabilities stay the same.',
  },
  S: {
    matrix: [[complex(1), complex(0)], [complex(0), complex(0, 1)]],
    explanation: 'S rotates the arrow 90° around z. It multiplies amplitudes where the selected qubit is 1 by i; probabilities stay the same.',
  },
  T: {
    matrix: [[complex(1), complex(0)], [complex(0), complex(h, h)]],
    explanation: 'T rotates the arrow 45° around z. It adds π/4 to the phase of amplitudes where the selected qubit is 1; probabilities stay the same.',
  },
};

function qubitCount(state) {
  const count = Math.log2(state.length);
  if (!Number.isInteger(count) || count < 1) throw new RangeError('Invalid state size');
  return count;
}

function qubitMask(state, target) {
  const count = qubitCount(state);
  if (!Number.isInteger(target) || target < 0 || target >= count) throw new RangeError('Invalid qubit');
  return 2 ** (count - target - 1);
}

export function zeroState(count = 1) {
  if (![1, 2].includes(count)) throw new RangeError('Choose one or two qubits');
  return Array.from({ length: 2 ** count }, (_, index) => complex(index === 0 ? 1 : 0));
}

export function addQubit(state) {
  if (qubitCount(state) !== 1) throw new RangeError('Only one optional qubit is supported');
  // Tensor the existing state with |0⟩: [alpha, 0, beta, 0].
  return state.flatMap(({ re, im }) => [complex(re, im), complex(0)]);
}

export function applyGate(state, matrix, target = 0, control = null) {
  const mask = qubitMask(state, target);
  const controlMask = control === null ? null : qubitMask(state, control);
  if (control === target) throw new RangeError('Control and target must differ');
  const result = state.map(({ re, im }) => complex(re, im));
  for (let index = 0; index < state.length; index++) {
    if ((index & mask) || (controlMask !== null && !(index & controlMask))) continue;
    const other = index | mask;
    result[index] = add(multiply(matrix[0][0], state[index]), multiply(matrix[0][1], state[other]));
    result[other] = add(multiply(matrix[1][0], state[index]), multiply(matrix[1][1], state[other]));
  }
  return result;
}

export function applyOperation(state, { gate, target = 0, control }) {
  if (gate === 'CNOT') return applyGate(state, GATES.X.matrix, target, control);
  if (gate === 'CZ') return applyGate(state, GATES.Z.matrix, target, control);
  if (gate === 'SWAP') {
    const first = qubitMask(state, control);
    const second = qubitMask(state, target);
    if (first === second) throw new RangeError('Choose different qubits');
    return state.map((_, index) => {
      const source = Boolean(index & first) === Boolean(index & second) ? index : index ^ first ^ second;
      return complex(state[source].re, state[source].im);
    });
  }
  if (!GATES[gate]) throw new RangeError('Unknown gate');
  return applyGate(state, GATES[gate].matrix, target);
}

export function probabilities(state) {
  return state.map(magnitudeSquared);
}

export function blochVector(state, target = 0) {
  // Sum over the other qubits to obtain the selected qubit's reduced state.
  const mask = qubitMask(state, target);
  const vector = { x: 0, y: 0, z: 0 };
  for (let index = 0; index < state.length; index++) {
    if (index & mask) continue;
    const alpha = state[index];
    const beta = state[index | mask];
    vector.x += 2 * (alpha.re * beta.re + alpha.im * beta.im);
    vector.y += 2 * (alpha.re * beta.im - alpha.im * beta.re);
    vector.z += magnitudeSquared(alpha) - magnitudeSquared(beta);
  }
  return vector;
}
