import { GATES, zeroState, addQubit, applyGate, applyOperation, probabilities, blochVector } from '../src/quantum.js';

const results = [];
function assert(condition, message) {
  if (!condition) throw new Error(message);
}
function near(actual, expected) {
  assert(Math.abs(actual - expected) < 1e-10, `Expected ${expected}, got ${actual}`);
}
function vectorNear(state, expected, target = 0) {
  const actual = blochVector(state, target);
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

const op = (state, gate, target = 0, control) => applyOperation(state, { gate, target, control });
const bell = () => op(op(zeroState(2), 'H'), 'CNOT', 1, 0);
check('Adding q1 preserves complex amplitudes and initializes q1 to |0⟩', () => {
  const initial = gate(gate(zeroState(), 'H'), 'S');
  const before = JSON.stringify(initial);
  const state = addQubit(initial);
  near(state[0].re, Math.SQRT1_2);
  near(state[2].im, Math.SQRT1_2);
  near(probabilities(state)[1], 0);
  near(probabilities(state)[3], 0);
  vectorNear(state, { x: 0, y: 1, z: 0 });
  vectorNear(state, { x: 0, y: 0, z: 1 }, 1);
  assert(JSON.stringify(initial) === before, 'Adding a qubit mutated the input');
});
check('Qubit ordering: X on q0 makes |10⟩; X on q1 makes |01⟩', () => {
  near(probabilities(op(zeroState(2), 'X', 0))[2], 1);
  near(probabilities(op(zeroState(2), 'X', 1))[1], 1);
});
check('All existing gates act correctly on either qubit without changing its partner', () => {
  for (const target of [0, 1]) for (const name of Object.keys(GATES)) {
    const state = op(op(zeroState(2), 'H', target), name, target);
    const expected = blochVector(gate(gate(zeroState(), 'H'), name));
    vectorNear(state, expected, target);
    vectorNear(state, { x: 0, y: 0, z: 1 }, 1 - target);
  }
});
check('CNOT truth table works in both control directions', () => {
  for (const control of [0, 1]) for (let basis = 0; basis < 4; basis++) {
    const state = zeroState(2).map((_, index) => ({ re: index === basis ? 1 : 0, im: 0 }));
    const expected = basis & (2 >> control) ? basis ^ (2 >> (1 - control)) : basis;
    near(probabilities(op(state, 'CNOT', 1 - control, control))[expected], 1);
  }
});
check('Bell state has correlated outcomes and maximally mixed individual qubits', () => {
  const state = bell();
  probabilities(state).forEach((p, index) => near(p, index === 0 || index === 3 ? 0.5 : 0));
  vectorNear(state, { x: 0, y: 0, z: 0 });
  vectorNear(state, { x: 0, y: 0, z: 0 }, 1);
  near(state[0].re, Math.SQRT1_2);
  near(state[3].re, Math.SQRT1_2);
});
check('Partially entangled states have individual vectors inside the sphere', () => {
  const state = [{ re: Math.sqrt(0.75), im: 0 }, { re: 0, im: 0 }, { re: 0, im: 0 }, { re: 0, im: 0.5 }];
  vectorNear(state, { x: 0, y: 0, z: 0.5 });
  vectorNear(state, { x: 0, y: 0, z: 0.5 }, 1);
});
check('A local gate can change entangled correlations while both spheres remain centered', () => {
  const state = op(bell(), 'X', 1);
  probabilities(state).forEach((p, index) => near(p, index === 1 || index === 2 ? 0.5 : 0));
  vectorNear(state, { x: 0, y: 0, z: 0 });
  vectorNear(state, { x: 0, y: 0, z: 0 }, 1);
});
check('CNOT twice disentangles the Bell state back to |+0⟩', () => {
  const state = op(bell(), 'CNOT', 1, 0);
  vectorNear(state, { x: 1, y: 0, z: 0 });
  vectorNear(state, { x: 0, y: 0, z: 1 }, 1);
});
check('CZ changes only the |11⟩ phase and entangles |++⟩', () => {
  for (const control of [0, 1]) {
    const initial = op(op(zeroState(2), 'H', 0), 'H', 1);
    const state = op(initial, 'CZ', 1 - control, control);
    state.forEach((a, index) => near(a.re, index === 3 ? -0.5 : 0.5));
    vectorNear(state, { x: 0, y: 0, z: 0 });
    vectorNear(state, { x: 0, y: 0, z: 0 }, 1);
  }
});
check('SWAP exchanges individual states, including complex phases', () => {
  const initial = op(op(zeroState(2), 'H', 0), 'S', 0);
  const state = op(initial, 'SWAP', 1, 0);
  vectorNear(state, { x: 0, y: 0, z: 1 });
  vectorNear(state, { x: 0, y: 1, z: 0 }, 1);
  assert(JSON.stringify(op(state, 'SWAP', 0, 1)) === JSON.stringify(initial), 'Double SWAP did not restore the state');
});
check('Mixed two-qubit gate sequences preserve normalization and input states', () => {
  let state = zeroState(2);
  for (let index = 0; index < 120; index++) {
    for (const name of Object.keys(GATES)) state = op(state, name, index % 2);
    const before = JSON.stringify(state);
    const next = op(state, 'CNOT', 1 - index % 2, index % 2);
    assert(JSON.stringify(state) === before, 'Controlled gate mutated its input');
    state = op(op(next, 'CZ', 1, 0), 'SWAP', 1, 0);
    near(probabilities(state).reduce((sum, p) => sum + p, 0), 1);
    for (const target of [0, 1]) {
      const v = blochVector(state, target);
      assert(Math.hypot(v.x, v.y, v.z) <= 1 + 1e-10, 'Reduced vector is outside the sphere');
    }
  }
});
check('Invalid targets, duplicate control/target, and extra qubits are rejected', () => {
  for (const run of [() => op(zeroState(), 'X', 1), () => op(zeroState(2), 'CNOT', 0, 0), () => addQubit(zeroState(2))]) {
    let rejected = false;
    try { run(); } catch (error) { rejected = error instanceof RangeError; }
    assert(rejected, 'Invalid operation was accepted');
  }
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

const app = iframe.contentDocument;
const clickGate = (gate) => app.querySelector(`[data-gate="${gate}"]`).click();
const clickTwoGate = (gate) => app.querySelector(`[data-two-gate="${gate}"]`).click();
const percent = (bits) => app.getElementById(`percent-${bits}`).textContent;
const toggle = (id) => app.getElementById(id).click();
check('Adding q1 preserves existing phase, sequence, and previous-state arrows', () => {
  clickGate('H'); clickGate('S');
  app.getElementById('add-qubit').click();
  assert(app.getElementById('amplitude-00').textContent === '0.707', 'q0 amplitude lost');
  assert(app.getElementById('amplitude-10').textContent === '0.707i', 'q0 phase lost');
  assert(app.querySelectorAll('#gate-history li').length === 2, 'Sequence was lost');
  assert(app.querySelectorAll('.wire-label').length === 2, 'Second circuit wire missing');
  assert(app.querySelectorAll('#gate-history li .wire-cell').length === 4, 'Earlier gates did not gain idle q1 cells');
  assert(app.querySelector('#bloch-sphere .previous-vector').style.display !== 'none', 'Previous state lost');
});
check('Sphere checkboxes switch views without changing amplitudes or history', () => {
  const before = app.getElementById('joint-state').textContent;
  toggle('show-q0');
  assert(app.getElementById('sphere-view-q0').hidden && !app.getElementById('sphere-view-q1').hidden, 'q1-only view failed');
  toggle('show-q1');
  assert(!app.getElementById('no-spheres').hidden, 'Empty view help missing');
  toggle('show-q0');
  assert(!app.getElementById('sphere-view-q0').hidden && app.getElementById('sphere-view-q1').hidden, 'q0-only view failed');
  toggle('show-q1');
  assert(app.getElementById('sphere-views').classList.contains('both-visible'), 'Both-sphere view failed');
  assert(app.getElementById('joint-state').textContent === before, 'View toggles changed the state');
  assert(app.querySelectorAll('#gate-history li').length === 2, 'View toggles changed history');
});
check('Each sphere has its own arrow marker and independent keyboard rotation', () => {
  const first = app.getElementById('bloch-sphere');
  const second = app.getElementById('bloch-sphere-q1');
  assert(first.querySelector('marker').id !== second.querySelector('marker').id, 'Duplicate marker IDs');
  const firstPath = first.querySelector('.sphere-guide').getAttribute('d');
  const secondPath = second.querySelector('.sphere-guide').getAttribute('d');
  second.dispatchEvent(new iframe.contentWindow.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
  assert(second.querySelector('.sphere-guide').getAttribute('d') !== secondPath, 'q1 rotation failed');
  assert(first.querySelector('.sphere-guide').getAttribute('d') === firstPath, 'q1 rotation changed q0 view');
});
check('Bell circuit displays correlations, connected gates, and centered sphere points', () => {
  app.getElementById('reset').click();
  app.getElementById('gate-target').value = '0';
  clickGate('H'); clickTwoGate('CNOT');
  assert(percent('00') === '50.0%' && percent('11') === '50.0%', 'Bell probabilities incorrect');
  assert(percent('01') === '0.0%' && percent('10') === '0.0%', 'Bell correlations incorrect');
  assert(app.querySelectorAll('#gate-history .connected').length === 1, 'CNOT connector missing');
  assert(app.querySelector('#gate-history .control-node').textContent === '●', 'Control missing');
  assert(app.querySelectorAll('#gate-history li')[1].querySelector('.gate-node').textContent === '⊕', 'CNOT target missing');
  for (const id of ['bloch-sphere', 'bloch-sphere-q1']) {
    const sphere = app.getElementById(id);
    assert(sphere.querySelector('.state-vector').style.display === 'none', 'Zero-length arrow was not hidden');
    near(Number(sphere.querySelector('.state-tip').getAttribute('cx')), 200);
    near(Number(sphere.querySelector('.state-tip').getAttribute('cy')), 200);
  }
});
check('Previous, Next, and circuit selection inspect states without deleting steps', () => {
  app.getElementById('previous-step').click();
  assert(app.getElementById('coordinates-q0').textContent.startsWith('x 1.000'), 'Earlier q0 state incorrect');
  assert(app.getElementById('coordinates-q1').textContent.endsWith('z 1.000'), 'Earlier q1 state incorrect');
  assert(app.querySelectorAll('#gate-history li').length === 2, 'Stepping deleted history');
  app.getElementById('next-step').click();
  assert(percent('11') === '50.0%', 'Next failed to restore Bell state');
  app.querySelector('#gate-history button').click();
  assert(app.getElementById('viewed-step').textContent === 'Viewing step 1 of 2', 'Circuit selection failed');
  app.getElementById('next-step').click();
});
check('Two-qubit Undo and Reset restore joint states and retain the optional qubit', () => {
  app.getElementById('undo').click();
  assert(percent('00') === '50.0%' && percent('10') === '50.0%', 'Undo did not restore |+0⟩');
  assert(app.querySelector('#bloch-sphere .state-vector').style.display !== 'none', 'Pure arrow did not reappear');
  app.getElementById('reset').click();
  assert(percent('00') === '100.0%', 'Reset did not restore |00⟩');
  assert(app.getElementById('qubit-count').textContent === '2 qubits', 'Reset removed q1');
  assert(app.querySelectorAll('#gate-history li').length === 0, 'Reset did not clear history');
});
check('Real target selection and reversed CNOT direction operate on the correct wires', () => {
  app.getElementById('gate-target').value = '1';
  clickGate('X');
  assert(percent('01') === '100.0%', 'Gate targeted wrong qubit');
  const cells = app.querySelectorAll('#gate-history li')[0].querySelectorAll('.wire-cell');
  assert(cells[0].textContent === '' && cells[1].textContent === 'X', 'Single gate drawn on wrong wire');
  app.getElementById('gate-control').value = '1';
  clickTwoGate('CNOT');
  assert(percent('11') === '100.0%', 'Reverse CNOT used wrong control');
  const controlledCells = app.querySelectorAll('#gate-history li')[1].querySelectorAll('.wire-cell');
  assert(controlledCells[0].textContent === '⊕' && controlledCells[1].textContent === '●', 'Reverse CNOT drawn incorrectly');
});
check('Applying a gate from an earlier step branches from the viewed state', () => {
  app.getElementById('previous-step').click();
  clickGate('X');
  assert(percent('00') === '100.0%', 'Gate did not branch from |01⟩');
  assert(app.querySelectorAll('#gate-history li').length === 2, 'Branch did not replace later gate');
  assert(app.querySelectorAll('#gate-history .connected').length === 0, 'Old CNOT remained');
});
check('Returning to one qubit restores the original controls and state', () => {
  app.getElementById('one-qubit').click();
  assert(app.getElementById('qubit-count').textContent === '1 qubit', 'One-qubit mode not restored');
  assert(app.getElementById('alpha').textContent === '1.000', 'Initial amplitude not restored');
  assert(app.getElementById('two-qubit-controls').hidden, 'Two-qubit gates still visible');
  assert(app.getElementById('sphere-view-q1').hidden, 'q1 sphere still visible');
  assert(app.getElementById('show-q0').checked, 'q0 view not restored');
  clickGate('H'); clickGate('Z'); clickGate('H');
  assert(percent('one') === '100.0%', 'Original HZH functionality regressed');
  app.getElementById('reset').click();
});

for (const result of results) {
  const item = document.createElement('li');
  item.textContent = `${result.passed ? 'PASS' : 'FAIL'} — ${result.name}${result.error ? `: ${result.error}` : ''}`;
  document.getElementById('results').append(item);
}
const failures = results.filter((result) => !result.passed).length;
document.getElementById('summary').textContent = `${results.length - failures}/${results.length} passed.`;
window.testResults = { results, failures };
