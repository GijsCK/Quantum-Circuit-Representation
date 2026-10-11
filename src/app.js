import { GATES, zeroState, addQubit, applyOperation, probabilities, blochVector } from './quantum.js';
import { createBlochSphere } from './bloch-sphere.js';
import { operationLabel, renderCircuit } from './circuit.js';

const byId = (id) => document.getElementById(id);
const spheres = [createBlochSphere(byId('bloch-sphere')), createBlochSphere(byId('bloch-sphere-q1'))];
const states = [zeroState()];
const operations = [];
let count = 1;
let viewedStep = 0;

function number(value) {
  return (Math.abs(value) < 0.0005 ? 0 : value).toFixed(3);
}

function amplitude({ re, im }) {
  if (Math.abs(im) < 0.0005) return number(re);
  if (Math.abs(re) < 0.0005) return `${number(im)}i`;
  return `${number(re)} ${im < 0 ? '−' : '+'} ${number(Math.abs(im))}i`;
}

function coordinates(vector) {
  return `x ${number(vector.x)} · y ${number(vector.y)} · z ${number(vector.z)}`;
}

function selectStep(step) {
  viewedStep = step;
  render();
}

function render() {
  const state = states[viewedStep];
  const previous = viewedStep > 0 ? states[viewedStep - 1] : null;
  document.body.classList.toggle('two-qubits', count === 2);
  for (let qubit = 0; qubit < count; qubit++) {
    const vector = blochVector(state, qubit);
    spheres[qubit](vector, previous ? blochVector(previous, qubit) : null);
    byId(`sphere-view-q${qubit}`).hidden = !byId(`show-q${qubit}`).checked;
    byId(`coordinates-q${qubit}`).textContent = coordinates(vector);
    const length = Math.min(1, Math.hypot(vector.x, vector.y, vector.z));
    byId(`sphere-status-q${qubit}`).textContent = count === 1 || length > 1 - 1e-10
      ? 'Pure individual state · arrow on the surface.'
      : length < 1e-10
        ? 'Maximally mixed individual state · point at the center. The joint state is entangled.'
        : `Mixed individual state · arrow length ${number(length)}. The joint state is entangled.`;
  }
  byId('sphere-view-q1').hidden = count === 1 || !byId('show-q1').checked;
  byId('sphere-views').classList.toggle('both-visible', count === 2 && byId('show-q0').checked && byId('show-q1').checked);
  byId('no-spheres').hidden = byId('show-q0').checked || (count === 2 && byId('show-q1').checked);
  byId('show-q0').disabled = count === 1;
  byId('q1-visibility').hidden = count === 1;
  byId('two-qubit-controls').hidden = count === 1;
  byId('target-q1').disabled = count === 1;
  byId('add-qubit').hidden = count === 2;
  byId('one-qubit').hidden = count === 1;
  byId('qubit-count').textContent = `${count} ${count === 1 ? 'qubit' : 'qubits'}`;
  byId('sphere-heading').textContent = count === 1 ? 'The Bloch sphere' : 'Individual Bloch spheres';
  byId('preparation-help').textContent = count === 1
    ? 'Start at |0⟩. Try H, then Z, then H again.'
    : 'Start at |00⟩. Choose a qubit for each single-qubit gate.';
  byId('single-state').hidden = count === 2;
  byId('joint-state').hidden = count === 1;
  if (count === 1) {
    byId('alpha').textContent = amplitude(state[0]);
    byId('beta').textContent = amplitude(state[1]);
    const [p0, p1] = probabilities(state);
    for (const [name, probability] of [['zero', p0], ['one', p1]]) {
      const percent = `${(probability * 100).toFixed(1)}%`;
      byId(`probability-${name}`).value = probability;
      byId(`probability-${name}`).textContent = percent;
      byId(`percent-${name}`).textContent = percent;
    }
    byId('coordinates').textContent = coordinates(blochVector(state));
  } else {
    probabilities(state).forEach((probability, index) => {
      const bits = index.toString(2).padStart(2, '0');
      byId(`amplitude-${bits}`).textContent = amplitude(state[index]);
      const percent = `${(probability * 100).toFixed(1)}%`;
      byId(`probability-${bits}`).value = probability;
      byId(`probability-${bits}`).textContent = percent;
      byId(`percent-${bits}`).textContent = percent;
    });
    for (let qubit = 0; qubit < 2; qubit++) {
      const z = blochVector(state, qubit).z;
      byId(`marginal-q${qubit}`).textContent = `q${qubit} alone: 0 ${((1 + z) * 50).toFixed(1)}% · 1 ${((1 - z) * 50).toFixed(1)}%`;
    }
  }
  byId('reset').textContent = count === 1 ? 'Reset to |0⟩' : 'Reset to |00⟩';
  byId('undo').disabled = operations.length === 0;
  byId('previous-step').disabled = viewedStep === 0;
  byId('next-step').disabled = viewedStep === operations.length;
  byId('step-count').textContent = `${operations.length} ${operations.length === 1 ? 'step' : 'steps'}`;
  byId('viewed-step').textContent = `Viewing step ${viewedStep} of ${operations.length}`;
  const operation = operations[viewedStep - 1];
  const explanations = {
    CNOT: 'CNOT flips the target when the control is |1⟩. With a superposed control it can create entanglement.',
    CZ: 'CZ changes the sign of the |11⟩ amplitude. It can entangle superposed qubits.',
    SWAP: 'SWAP exchanges the states of q0 and q1.',
  };
  byId('gate-explanation').textContent = operation
    ? `${operationLabel(operation)}. ${explanations[operation.gate] || GATES[operation.gate].explanation}`
    : 'Choose a gate to see its effect.';
  renderCircuit(byId('gate-history'), byId('initial-state'), operations, count, viewedStep, selectStep);
}

function appendOperation(operation) {
  const next = applyOperation(states[viewedStep], operation);
  operations.splice(viewedStep);
  states.splice(viewedStep + 1);
  operations.push(operation);
  states.push(next);
  viewedStep++;
  render();
}

byId('gate-buttons').addEventListener('click', (event) => {
  const button = event.target.closest('button[data-gate]');
  if (button) appendOperation({ gate: button.dataset.gate, target: Number(byId('gate-target').value) });
});

byId('two-qubit-controls').addEventListener('click', (event) => {
  const button = event.target.closest('button[data-two-gate]');
  if (!button || count !== 2) return;
  const control = Number(byId('gate-control').value);
  appendOperation({ gate: button.dataset.twoGate, control, target: 1 - control });
});

byId('add-qubit').addEventListener('click', () => {
  if (count !== 1) return;
  states.splice(0, states.length, ...states.map(addQubit));
  count = 2;
  byId('show-q1').checked = true;
  render();
});

for (const qubit of [0, 1]) byId(`show-q${qubit}`).addEventListener('change', render);
byId('previous-step').addEventListener('click', () => selectStep(Math.max(0, viewedStep - 1)));
byId('next-step').addEventListener('click', () => selectStep(Math.min(operations.length, viewedStep + 1)));

byId('undo').addEventListener('click', () => {
  if (!operations.length) return;
  states.pop();
  operations.pop();
  viewedStep = Math.min(viewedStep, operations.length);
  render();
});

function reset() {
  states.splice(0, states.length, zeroState(count));
  operations.length = 0;
  viewedStep = 0;
  render();
}
byId('reset').addEventListener('click', reset);
byId('one-qubit').addEventListener('click', () => {
  count = 1;
  byId('gate-target').value = '0';
  byId('show-q0').checked = true;
  reset();
});

render();
