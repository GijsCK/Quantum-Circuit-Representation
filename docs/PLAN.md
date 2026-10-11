# Plan for the first version

## Aim

Make the relationship between qubits, amplitudes, gates, and entanglement visible. Start with one qubit and optionally introduce a second. Keep the code small enough to read alongside a quantum computing lesson.

## Technologies

| Part | Choice | Reason |
| --- | --- | --- |
| Interface | HTML and CSS | A single page with a few controls does not need a framework. |
| Logic | JavaScript modules | Plain functions and explicit math; no build tool or package installation. |
| Sphere | SVG with a small orthographic projection | A readable wireframe and state arrow without a 3D engine. |
| State | Two or four complex amplitudes | One joint pure-state vector supports entanglement. Basis order is `|q0 q1⟩`. |
| Gates | 2×2 complex matrices applied to amplitude pairs | Target and control masks apply the same gates to either qubit without constructing large matrices. |
| Local development | Python's static HTTP server | Already available; no Python application or backend. |
| Verification | A browser test page | Checks amplitudes, phase, normalization, and a few real controls without dependencies. |

## Google libraries

[Unitary](https://github.com/quantumlib/unitary) provides quantum behaviors for games. [Cirq](https://quantumai.google/cirq) is a Python library for constructing and simulating circuits. The app uses JavaScript matrices for single-qubit gates. Consider Cirq later for independent simulation comparisons or larger circuits.

## Math

A complex number is `{ re, im }`. One qubit is `[alpha, beta]`. Two qubits are `[a00, a01, a10, a11]`, with squared magnitudes summing to one. Adding q1 tensors every stored state with `|0⟩`, preserving q0's phase and gate history. Applying a gate means multiplying its matrix by each relevant amplitude pair; gates do not mutate the input.

Convert to Bloch coordinates using:

```text
x = 2 Re(conjugate(alpha) * beta)
y = 2 Im(conjugate(alpha) * beta)
z = |alpha|² - |beta|²
```

For two qubits, sum these Bloch-coordinate contributions over the other qubit's basis values to obtain the selected qubit's reduced state. Its vector may lie inside the sphere. The overall state remains pure; in this simulator, an individual vector shorter than one indicates entanglement. A zero vector is shown as a center point, with its arrow hidden.

The probability readouts use squared amplitude magnitudes; these are Z-basis measurement probabilities. Applying a gate changes the state vector; dragging the sphere or toggling its visibility changes only the view. Global phase changes the amplitudes but not the Bloch vectors. See [IBM's Bloch sphere explanation](https://quantum.cloud.ibm.com/learning/en/courses/general-formulation-of-quantum-information/density-matrices/bloch-sphere).

## Visual direction

Warm paper background, dark ink, muted green, square borders, system monospace lettering, and a small CSS pixel motif. The sphere sits beside gate controls and amplitudes, with the gate sequence underneath. The layout supports phones and keyboard controls.

## Review scaffold — implemented

- Initial `|0⟩` state and labeled x/y/z sphere.
- H, X, Y, Z, S, T gate buttons and explanations.
- Current state arrow and dashed previous-state arrow.
- Amplitudes, Bloch coordinates, and Z-basis probabilities.
- Ordered gate history, Undo, and Reset.
- Separate math, drawing, and interface modules.
- Mouse and touch dragging to rotate the view, with arrow keys for keyboard control.

## Optional second qubit — implemented

- Add q1 in `|0⟩` without clearing existing history; one qubit remains the default.
- Apply existing gates to a selected qubit; add CNOT in either direction, CZ, and SWAP.
- Independent q0 and q1 spheres with visibility checkboxes, reduced-state coordinates, and distinct SVG arrow markers.
- Four joint amplitudes and Z-basis outcome probabilities, plus individual probability summaries.
- One circuit wire per qubit, idle cells for unaffected qubits, and connected control/target symbols for two-qubit gates.
- Inspect stored states with Previous/Next or by selecting a gate. Applying a gate at an earlier step replaces subsequent operations.
- Undo removes the last operation. Reset clears operations at the current qubit count. Returning to one qubit explicitly starts a fresh circuit.
- Preserve single-qubit amplitudes, gates, probabilities, previous-state arrows, sphere rotation, Undo, and Reset.

## After review

1. Confirm the layout, visual style, and whether this level of math is helpful.
2. Add adjustable Rx/Ry/Rz gates and starting-state controls.
3. Animate each gate's actual rotation. Step inspection is implemented. Do not interpolate pure individual-state arrows along a straight line through the sphere: pure-state gate evolution stays on its surface. Entangling gates can change an individual vector's length.
4. Add Z-basis measurement with a clear explanation of collapse.
5. Extend circuit editing and introduce repeated measurement sampling from the prepared state.

For multiple qubits, store the joint state vector (2^n complex amplitudes). Entangled qubits cannot be represented by independent pure-qubit arrows; their individual Bloch vectors may lie inside the sphere.
