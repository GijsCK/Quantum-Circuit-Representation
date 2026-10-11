# Qubit notebook

A browser app for exploring single-qubit gates.

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
- Open http://localhost:8000/tests/ to run the math and basic interface checks. Results appear on the page.

## Files

```text
index.html                Page layout and controls
src/styles.css            Paper colors, square borders, small pixel motif
src/app.js                Button handling, history, and readouts
src/quantum.js            Complex amplitudes, matrices, and Bloch coordinates
src/bloch-sphere.js       SVG projection and state arrows
docs/PLAN.md              Decisions, scope, and next steps
tests/index.html          Browser test runner
tests/checks.js           Quantum math and basic interaction checks
```

The app supports one pure qubit, starting at `|0⟩`, and H, X, Y, Z, S, and T gates. Gates update immediately. The dashed arrow shows the previous state. Rotating the view does not change the qubit. Measurement, animation, arbitrary starting states, and multiple qubits are later steps.
