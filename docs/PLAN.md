# Plan for the first version

## Aim

Make the relationship between a qubit, its amplitudes, and a gate visible. Begin with one qubit and a Bloch sphere. Keep the code small enough to read alongside a quantum computing lesson.

## Technologies

| Part | Choice | Reason |
| --- | --- | --- |
| Interface | HTML and CSS | A single page with a few controls does not need a framework. |
| Logic | JavaScript modules | Plain functions and explicit math; no build tool or package installation. |
| Sphere | SVG with a small orthographic projection | A readable wireframe and state arrow without a 3D engine. |
| State | Two complex amplitudes | Directly matches `α|0⟩ + β|1⟩`. |
| Gates | 2×2 complex matrices | One shared matrix multiplication function. |
| Local development | Python's static HTTP server | Already available; no Python application or backend. |
| Verification | A browser test page | Checks amplitudes, phase, normalization, and a few real controls without dependencies. |

No accounts, database, API, routing, state library, or hosting setup is needed for this step. Revisit TypeScript or a framework if the interface grows enough to benefit from them. Revisit a 3D library if camera controls become cumbersome in SVG.

## Google libraries

[Unitary](https://github.com/quantumlib/unitary) provides quantum behaviors for games. [Cirq](https://quantumai.google/cirq) is a Python library for constructing and simulating circuits. Both are useful in broader projects, but bringing Python simulation into this browser-only one-qubit demo would add an unnecessary integration layer. Keep the small matrix implementation here. Consider Cirq later for independent simulation comparisons or larger circuits.

## Math

A complex number is `{ re, im }`. A qubit is `[alpha, beta]`, with `|alpha|² + |beta|² = 1`. Applying a gate means multiplying its matrix by that column vector; gates do not mutate the input.

Convert to Bloch coordinates using:

```text
x = 2 Re(conjugate(alpha) * beta)
y = 2 Im(conjugate(alpha) * beta)
z = |alpha|² - |beta|²
```

The probability readouts use `|alpha|²` and `|beta|²`; these are Z-basis measurement probabilities, not measurements performed by the app. The sphere remains fixed and the state vector changes. Global phase changes the amplitudes but not the Bloch vector. See [IBM's Bloch sphere explanation](https://quantum.cloud.ibm.com/learning/en/courses/general-formulation-of-quantum-information/density-matrices/bloch-sphere).

## Visual direction

A modest notebook: warm paper background, dark ink, muted green, square borders, system monospace lettering, and a tiny CSS pixel motif. Put the sphere beside gate controls and amplitudes, with the gate sequence underneath. Keep it usable on a phone and with a keyboard.

## Review scaffold — implemented

- Initial `|0⟩` state and labeled x/y/z sphere.
- H, X, Y, Z, S, T gate buttons and explanations.
- Current state arrow and dashed previous-state arrow.
- Amplitudes, Bloch coordinates, and Z-basis probabilities.
- Ordered gate history, Undo, and Reset.
- Separate math, drawing, and interface modules.

## After review

1. Confirm the layout, visual style, and whether this level of math is helpful.
2. Add adjustable Rx/Ry/Rz gates, starting-state controls, and camera controls.
3. Animate each gate's actual rotation and allow stepping through history. Do not interpolate arrows along a straight line through the sphere: pure-state gate evolution stays on its surface.
4. Add Z-basis measurement with a clear explanation of collapse.
5. Introduce a small multi-qubit circuit view only when the one-qubit view is useful.

For multiple qubits, store the joint state vector (2^n complex amplitudes). Entangled qubits cannot be represented by independent pure-qubit arrows; their individual Bloch vectors may lie inside the sphere. This needs a deliberate extension of the model, not just additional copies of this component.
