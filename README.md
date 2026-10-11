# Qubit notebook

A browser app for exploring one or two qubits, gates, and entanglement.

## Run

From this directory:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Open http://localhost:8000. There is nothing to install or build. Python only serves the files; all quantum calculations happen in JavaScript in your browser. Use a local server rather than opening `index.html` directly, because the app uses JavaScript modules.

## Review

- Read [the technology and development plan](docs/PLAN.md).
- Try **H → Z → H**: the arrow ends at `|1⟩`.
- Try **H → S**: probabilities stay at 50/50, but the arrow moves from +x to +y. Phase matters even when probabilities stay the same.
- Use Undo or Reset to revisit a step.
- Drag the sphere to rotate the view. Touch dragging and arrow keys also work.
- Choose **Add qubit q1 in |0⟩** to introduce a second qubit without losing q0's state or gate sequence.
- From a reset two-qubit state, apply **H on q0 → CNOT q0 → q1**. The joint outcomes are 50% `00` and 50% `11`; both individual spheres show center points.
- Use the **q0/q1 checkboxes** to view either sphere or both. Each sphere rotates independently; hiding one does not change the state or circuit.
- Select a circuit gate, or use **Previous step / Next step**, to inspect intermediate states. Applying a gate at an earlier step replaces later steps. Undo removes the last gate; Reset clears the circuit while keeping the current qubit count.
- **Start over with one qubit** clears the circuit and returns to `|0⟩`.
- Open http://localhost:8000/tests/ to run the math and basic interface checks. Results appear on the page.

## Files

```text
index.html                Page layout and controls
src/styles.css            Paper colors, square borders, small pixel motif
src/app.js                Button handling, history, and readouts
src/quantum.js            Complex amplitudes, matrices, and Bloch coordinates
src/bloch-sphere.js       SVG projection and state arrows
src/circuit.js            Circuit wires, gate targets, and step selection
docs/PLAN.md              Decisions, scope, and next steps
tests/index.html          Browser test runner
tests/checks.js           Quantum math and basic interaction checks
```

The app starts with one pure qubit at `|0⟩` and supports an optional second qubit, H, X, Y, Z, S, and T on either qubit, plus CNOT, CZ, and SWAP. Gates update immediately. The dashed arrow shows the state before the viewed step. Rotating the view does not change the quantum state.

Two-qubit basis labels use `|q0 q1⟩`: X on q0 makes `|10⟩`, and X on q1 makes `|01⟩`. The four joint amplitudes retain phase; the four outcome probabilities describe measurement along z. Individual probabilities are also shown. Each sphere represents the corresponding reduced state, so entanglement can shorten its vector. A Bell state has both vectors at the center, while its joint state remains pure. Joint amplitudes and probabilities are needed to see correlations that the spheres alone cannot show.

Actual measurement and collapse, repeated sampling, animation, and arbitrary starting states are later steps.
