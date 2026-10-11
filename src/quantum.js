// A qubit is [alpha, beta]; each amplitude is { re, im }.
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
    explanation: 'Z rotates the arrow 180° around z. It negates β; the Z-basis probabilities stay the same.',
  },
  S: {
    matrix: [[complex(1), complex(0)], [complex(0), complex(0, 1)]],
    explanation: 'S rotates the arrow 90° around z. It multiplies β by i; probabilities stay the same.',
  },
  T: {
    matrix: [[complex(1), complex(0)], [complex(0), complex(h, h)]],
    explanation: 'T rotates the arrow 45° around z. It adds π/4 to the phase of β; probabilities stay the same.',
  },
};

export function zeroState() {
  return [complex(1), complex(0)];
}

export function applyGate(state, matrix) {
  return matrix.map((row) => add(multiply(row[0], state[0]), multiply(row[1], state[1])));
}

export function probabilities(state) {
  return state.map(magnitudeSquared);
}

export function blochVector([alpha, beta]) {
  // x and y are twice the real and imaginary parts of conjugate(alpha) * beta.
  return {
    x: 2 * (alpha.re * beta.re + alpha.im * beta.im),
    y: 2 * (alpha.re * beta.im - alpha.im * beta.re),
    z: magnitudeSquared(alpha) - magnitudeSquared(beta),
  };
}
