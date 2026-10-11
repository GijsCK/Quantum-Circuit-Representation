import { GATES, zeroState, applyGate, probabilities, blochVector } from './quantum.js';
import { createBlochSphere } from './bloch-sphere.js';

const byId = (id) => document.getElementById(id);
const drawSphere = createBlochSphere(byId('bloch-sphere'));
// Store states for Undo.
const states = [zeroState()];
const gates = [];

function number(value) {
  return (Math.abs(value) < 0.0005 ? 0 : value).toFixed(3);
}

function amplitude({ re, im }) {
  if (Math.abs(im) < 0.0005) return number(re);
  if (Math.abs(re) < 0.0005) return `${number(im)}i`;
  return `${number(re)} ${im < 0 ? '−' : '+'} ${number(Math.abs(im))}i`;
}

function render() {
  const state = states[states.length - 1];
  const vector = blochVector(state);
  drawSphere(vector, states.length > 1 ? blochVector(states[states.length - 2]) : null);
  byId('alpha').textContent = amplitude(state[0]);
  byId('beta').textContent = amplitude(state[1]);
  const [p0, p1] = probabilities(state);
  for (const [name, probability] of [['zero', p0], ['one', p1]]) {
    const percent = `${(probability * 100).toFixed(1)}%`;
    byId(`probability-${name}`).value = probability;
    byId(`probability-${name}`).textContent = percent;
    byId(`percent-${name}`).textContent = percent;
  }
  byId('coordinates').textContent = `x ${number(vector.x)} · y ${number(vector.y)} · z ${number(vector.z)}`;
  byId('undo').disabled = gates.length === 0;
  byId('step-count').textContent = `${gates.length} ${gates.length === 1 ? 'step' : 'steps'}`;
  byId('gate-explanation').textContent = gates.length ? GATES[gates[gates.length - 1]].explanation : 'Choose a gate to see its effect.';
  byId('gate-history').replaceChildren(...gates.map((gate, index) => {
    const step = document.createElement('li');
    step.textContent = gate;
    step.setAttribute('aria-label', `Step ${index + 1}: ${gate}`);
    return step;
  }));
}

byId('gate-buttons').addEventListener('click', (event) => {
  const button = event.target.closest('button[data-gate]');
  if (!button) return;
  const gate = button.dataset.gate;
  states.push(applyGate(states[states.length - 1], GATES[gate].matrix));
  gates.push(gate);
  render();
});

byId('undo').addEventListener('click', () => {
  if (!gates.length) return;
  states.pop();
  gates.pop();
  render();
});

byId('reset').addEventListener('click', () => {
  states.splice(0, states.length, zeroState());
  gates.length = 0;
  render();
});

render();
