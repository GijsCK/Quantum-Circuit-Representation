export function operationLabel({ gate, target, control }) {
  if (gate === 'SWAP') return `SWAP q${control} ↔ q${target}`;
  return control === undefined ? `${gate} on q${target}` : `${gate} q${control} → q${target}`;
}

export function renderCircuit(list, initial, operations, count, viewedStep, selectStep) {
  initial.replaceChildren(...Array.from({ length: count }, (_, qubit) => {
    const label = document.createElement('span');
    label.className = 'wire-label';
    label.textContent = `q${qubit}: |0⟩`;
    return label;
  }));
  list.replaceChildren(...operations.map((operation, index) => {
    const step = document.createElement('li');
    step.className = `circuit-step${operation.control !== undefined ? ' connected' : ''}`;
    if (viewedStep === index + 1) step.classList.add('selected-step');
    if (viewedStep < index + 1) step.classList.add('future-step');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'step-button';
    button.setAttribute('aria-label', `View step ${index + 1}: ${operationLabel(operation)}`);
    button.setAttribute('aria-pressed', String(viewedStep === index + 1));
    button.addEventListener('click', () => selectStep(index + 1));
    for (let qubit = 0; qubit < count; qubit++) {
      const cell = document.createElement('span');
      cell.className = 'wire-cell';
      if (operation.gate === 'SWAP') {
        cell.textContent = '×';
        cell.classList.add('gate-node');
      } else if (qubit === operation.control) {
        cell.textContent = '●';
        cell.classList.add('control-node');
      } else if (qubit === operation.target) {
        cell.textContent = operation.gate === 'CNOT' ? '⊕' : operation.gate === 'CZ' ? 'Z' : operation.gate;
        cell.classList.add('gate-node');
      }
      button.append(cell);
    }
    step.append(button);
    return step;
  }));
}
