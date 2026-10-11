import { GATES, zeroState, applyGate, probabilities, blochVector } from '../src/quantum.js';

const results = [];
function assert(condition, message) {
  if (!condition) throw new Error(message);
}
function near(actual, expected) {
  assert(Math.abs(actual - expected) < 1e-10, `Expected ${expected}, got ${actual}`);
}
function vectorNear(state, expected) {
  const actual = blochVector(state);
  for (const axis of ['x', 'y', 'z']) near(actual[axis], expected[axis]);
}
const gate = (state, name) => applyGate(state, GATES[name].matrix);
function check(name, run) {
  try {
    run();
    results.push({ name, passed: true });
  } catch (error) {
    results.push({ name, passed: false, error: error.message });
  }
}

check('|0⟩ is the north pole, with probability 1 of measuring 0', () => {
  vectorNear(zeroState(), { x: 0, y: 0, z: 1 });
  near(probabilities(zeroState())[0], 1);
});
check('X maps |0⟩ to |1⟩', () => {
  const state = gate(zeroState(), 'X');
  near(state[1].re, 1);
  vectorNear(state, { x: 0, y: 0, z: -1 });
});
check('Y maps |0⟩ to i|1⟩, preserving the correct complex phase', () => {
  const state = gate(zeroState(), 'Y');
  near(state[1].re, 0);
  near(state[1].im, 1);
  vectorNear(state, { x: 0, y: 0, z: -1 });
});
check('H produces +x and equal probabilities', () => {
  const state = gate(zeroState(), 'H');
  vectorNear(state, { x: 1, y: 0, z: 0 });
  probabilities(state).forEach((p) => near(p, 0.5));
});
check('H then S points along +y without changing probabilities', () => {
  const state = gate(gate(zeroState(), 'H'), 'S');
  vectorNear(state, { x: 0, y: 1, z: 0 });
  probabilities(state).forEach((p) => near(p, 0.5));
});
check('H then T adds a 45° relative phase', () => {
  vectorNear(gate(gate(zeroState(), 'H'), 'T'), { x: Math.SQRT1_2, y: Math.SQRT1_2, z: 0 });
});
check('H → Z → H makes |1⟩: relative phase changes a later outcome', () => {
  vectorNear(gate(gate(gate(zeroState(), 'H'), 'Z'), 'H'), { x: 0, y: 0, z: -1 });
});
check('Global phase leaves the Bloch vector unchanged', () => {
  const state = gate(gate(zeroState(), 'H'), 'T');
  const shifted = state.map(({ re, im }) => ({ re: -im, im: re }));
  vectorNear(shifted, blochVector(state));
});
check('All gates preserve normalization over a long sequence', () => {
  let state = zeroState();
  for (let i = 0; i < 120; i++) {
    for (const name of Object.keys(GATES)) state = gate(state, name);
    const [p0, p1] = probabilities(state);
    near(p0 + p1, 1);
    const { x, y, z } = blochVector(state);
    near(x * x + y * y + z * z, 1);
  }
});
check('Applying a gate does not mutate the input state', () => {
  const state = zeroState();
  const before = JSON.stringify(state);
  gate(state, 'Y');
  assert(JSON.stringify(state) === before, 'Input state changed');
});

const iframe = document.getElementById('app');
// A load event includes execution of the app's module scripts.
if (!iframe.contentDocument.getElementById('alpha') || iframe.contentDocument.readyState !== 'complete') {
  await new Promise((resolve) => iframe.addEventListener('load', resolve, { once: true }));
}
check('Real controls update state, sequence, Undo, and Reset', () => {
  const app = iframe.contentDocument;
  const click = (name) => app.querySelector(`[data-gate="${name}"]`).click();
  assert(app.getElementById('alpha').textContent === '1.000', 'App did not initialize');
  assert(app.getElementById('undo').disabled, 'Undo should initially be disabled');
  click('H'); click('Z'); click('H');
  assert(app.getElementById('percent-one').textContent === '100.0%', 'HZH did not produce |1⟩');
  assert(app.querySelectorAll('#gate-history li').length === 3, 'Gate history is incorrect');
  const arrow = app.querySelector('.state-vector');
  assert(Number(arrow.getAttribute('y2')) > 200, 'Arrow did not move to the south pole');
  app.getElementById('undo').click();
  assert(app.getElementById('percent-one').textContent === '50.0%', 'Undo did not restore state');
  app.getElementById('reset').click();
  assert(app.getElementById('percent-zero').textContent === '100.0%', 'Reset did not restore |0⟩');
  assert(app.querySelectorAll('#gate-history li').length === 0, 'Reset did not clear history');
  assert(app.getElementById('undo').disabled, 'Undo remained enabled after reset');
});

for (const result of results) {
  const item = document.createElement('li');
  item.textContent = `${result.passed ? 'PASS' : 'FAIL'} — ${result.name}${result.error ? `: ${result.error}` : ''}`;
  document.getElementById('results').append(item);
}
const failures = results.filter((result) => !result.passed).length;
document.getElementById('summary').textContent = `${results.length - failures}/${results.length} passed.`;
window.testResults = { results, failures };
