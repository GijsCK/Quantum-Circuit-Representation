const SVG_NS = 'http://www.w3.org/2000/svg';
const CENTER = 200;
const RADIUS = 140;

function element(tag, attributes, text) {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, value);
  if (text !== undefined) node.textContent = text;
  return node;
}

export function createBlochSphere(svg) {
  let yaw = 3 * Math.PI / 4;
  let pitch = Math.asin(1 / Math.sqrt(3));
  let state = { x: 0, y: 0, z: 1 };
  let previousState = null;
  let drag = null;

  function project({ x, y, z }) {
    const horizontal = Math.cos(yaw) * x + Math.sin(yaw) * y;
    const depth = -Math.sin(yaw) * x + Math.cos(yaw) * y;
    return {
      x: CENTER + RADIUS * horizontal,
      y: CENTER - RADIUS * (Math.sin(pitch) * depth + Math.cos(pitch) * z),
    };
  }

  function positionLine(node, from, to) {
    const a = project(from);
    const b = project(to);
    node.setAttribute('x1', a.x);
    node.setAttribute('y1', a.y);
    node.setAttribute('x2', b.x);
    node.setAttribute('y2', b.y);
  }

  const defs = element('defs', {});
  const markerId = `${svg.id}-state-arrowhead`;
  const marker = element('marker', { id: markerId, markerWidth: 7, markerHeight: 7, refX: 5, refY: 3, orient: 'auto' });
  marker.append(element('path', { d: 'M0,0 L6,3 L0,6 Z', fill: 'currentColor' }));
  defs.append(marker);
  svg.append(defs);
  svg.append(element('circle', { cx: CENTER, cy: CENTER, r: RADIUS, class: 'sphere-outline' }));

  const guides = ['xy', 'xz', 'yz'].map((plane) => {
    const vectors = [];
    for (let step = 0; step <= 96; step++) {
      const angle = step / 96 * 2 * Math.PI;
      const vector = { x: 0, y: 0, z: 0 };
      vector[plane[0]] = Math.cos(angle);
      vector[plane[1]] = Math.sin(angle);
      vectors.push(vector);
    }
    const node = element('path', { class: 'sphere-guide' });
    svg.append(node);
    return { node, vectors };
  });

  const axes = ['x', 'y', 'z'].map((axis) => {
    const positive = { x: 0, y: 0, z: 0, [axis]: 1.15 };
    const negative = { x: 0, y: 0, z: 0, [axis]: -1.08 };
    const line = element('line', { class: 'sphere-axis' });
    const label = element('text', { class: 'axis-label', 'text-anchor': 'middle' }, axis === 'z' ? 'z · |0⟩' : `+${axis}`);
    svg.append(line, label);
    return { line, label, positive, negative };
  });
  const southLabel = element('text', { class: 'axis-label', 'text-anchor': 'middle' }, '|1⟩');
  svg.append(southLabel);
  svg.append(element('circle', { cx: CENTER, cy: CENTER, r: 3, class: 'origin' }));

  const previous = element('line', { class: 'previous-vector' });
  const current = element('line', { class: 'state-vector', 'marker-end': `url(#${markerId})` });
  const tip = element('circle', { r: 5, class: 'state-tip' });
  svg.append(previous, current, tip);

  function draw() {
    for (const { node, vectors } of guides) {
      node.setAttribute('d', vectors.map((vector, index) => {
        const point = project(vector);
        return `${index === 0 ? 'M' : 'L'}${point.x},${point.y}`;
      }).join(' '));
    }
    for (const { line, label, positive, negative } of axes) {
      positionLine(line, negative, positive);
      const point = project(positive);
      label.setAttribute('x', point.x);
      label.setAttribute('y', point.y - 8);
    }
    const south = project({ x: 0, y: 0, z: -1.15 });
    southLabel.setAttribute('x', south.x);
    southLabel.setAttribute('y', south.y + 18);

    const origin = { x: 0, y: 0, z: 0 };
    positionLine(current, origin, state);
    current.style.display = Math.hypot(state.x, state.y, state.z) < 1e-10 ? 'none' : '';
    const point = project(state);
    tip.setAttribute('cx', point.x);
    tip.setAttribute('cy', point.y);
    previous.style.display = previousState ? '' : 'none';
    if (previousState) positionLine(previous, origin, previousState);
  }

  svg.addEventListener('pointerdown', (event) => {
    if (event.button !== 0 || drag) return;
    svg.setPointerCapture(event.pointerId);
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY };
    svg.classList.add('dragging');
  });
  svg.addEventListener('pointermove', (event) => {
    if (!drag || event.pointerId !== drag.id) return;
    const sensitivity = 2 * Math.PI / svg.clientWidth;
    yaw += (event.clientX - drag.x) * sensitivity;
    pitch += (event.clientY - drag.y) * sensitivity;
    drag.x = event.clientX;
    drag.y = event.clientY;
    draw();
  });
  function stopDragging() {
    drag = null;
    svg.classList.remove('dragging');
  }
  svg.addEventListener('lostpointercapture', stopDragging);
  svg.addEventListener('pointerup', (event) => {
    if (!drag || event.pointerId !== drag.id) return;
    svg.releasePointerCapture(event.pointerId);
    stopDragging();
  });
  svg.addEventListener('pointercancel', stopDragging);
  svg.addEventListener('keydown', (event) => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
    event.preventDefault();
    if (event.key === 'ArrowLeft') yaw -= 0.1;
    if (event.key === 'ArrowRight') yaw += 0.1;
    if (event.key === 'ArrowUp') pitch -= 0.1;
    if (event.key === 'ArrowDown') pitch += 0.1;
    draw();
  });

  return function update(vector, previousVector) {
    state = vector;
    previousState = previousVector;
    draw();
    svg.querySelector('desc').textContent = `Current Bloch coordinates: x ${vector.x.toFixed(3)}, y ${vector.y.toFixed(3)}, z ${vector.z.toFixed(3)}. ${Math.hypot(vector.x, vector.y, vector.z) < 1e-10 ? 'The current state is a point at the center, representing a maximally mixed individual qubit.' : 'The solid arrow shows the current state.'} The dashed arrow shows the previous state.`;
  };
}
