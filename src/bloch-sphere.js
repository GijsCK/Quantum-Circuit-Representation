const SVG_NS = 'http://www.w3.org/2000/svg';
const CENTER = 200;
const RADIUS = 140;

// Orthographic camera: x points down-left, y down-right, z up.
function project({ x, y, z }) {
  return {
    x: CENTER + RADIUS * (y - x) / Math.sqrt(2),
    y: CENTER + RADIUS * ((x + y) / Math.sqrt(6) - z * Math.sqrt(2 / 3)),
  };
}

function element(tag, attributes, text) {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, value);
  if (text !== undefined) node.textContent = text;
  return node;
}

function line(from, to, attributes) {
  const a = project(from);
  const b = project(to);
  return element('line', { x1: a.x, y1: a.y, x2: b.x, y2: b.y, ...attributes });
}

export function createBlochSphere(svg) {
  const defs = element('defs', {});
  const marker = element('marker', { id: 'state-arrowhead', markerWidth: 7, markerHeight: 7, refX: 5, refY: 3, orient: 'auto' });
  marker.append(element('path', { d: 'M0,0 L6,3 L0,6 Z', fill: 'currentColor' }));
  defs.append(marker);
  svg.append(defs);
  svg.append(element('circle', { cx: CENTER, cy: CENTER, r: RADIUS, class: 'sphere-outline' }));

  for (const plane of ['xy', 'xz', 'yz']) {
    const points = [];
    for (let step = 0; step <= 96; step++) {
      const angle = step / 96 * 2 * Math.PI;
      const vector = { x: 0, y: 0, z: 0 };
      vector[plane[0]] = Math.cos(angle);
      vector[plane[1]] = Math.sin(angle);
      const point = project(vector);
      points.push(`${step === 0 ? 'M' : 'L'}${point.x},${point.y}`);
    }
    svg.append(element('path', { d: points.join(' '), class: 'sphere-guide' }));
  }

  for (const axis of ['x', 'y', 'z']) {
    const positive = { x: 0, y: 0, z: 0, [axis]: 1.15 };
    const negative = { x: 0, y: 0, z: 0, [axis]: -1.08 };
    svg.append(line(negative, positive, { class: 'sphere-axis' }));
    const point = project(positive);
    svg.append(element('text', { x: point.x, y: point.y - 8, class: 'axis-label', 'text-anchor': 'middle' }, axis === 'z' ? 'z · |0⟩' : `+${axis}`));
  }
  const south = project({ x: 0, y: 0, z: -1.15 });
  svg.append(element('text', { x: south.x, y: south.y + 18, class: 'axis-label', 'text-anchor': 'middle' }, '|1⟩'));
  svg.append(element('circle', { cx: CENTER, cy: CENTER, r: 3, class: 'origin' }));

  const previous = line({ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }, { class: 'previous-vector' });
  const current = line({ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }, { class: 'state-vector', 'marker-end': 'url(#state-arrowhead)' });
  const tip = element('circle', { r: 5, class: 'state-tip' });
  svg.append(previous, current, tip);

  return function update(vector, previousVector) {
    const point = project(vector);
    current.setAttribute('x2', point.x);
    current.setAttribute('y2', point.y);
    tip.setAttribute('cx', point.x);
    tip.setAttribute('cy', point.y);
    previous.style.display = previousVector ? '' : 'none';
    if (previousVector) {
      const oldPoint = project(previousVector);
      previous.setAttribute('x2', oldPoint.x);
      previous.setAttribute('y2', oldPoint.y);
    }
    svg.querySelector('desc').textContent = `Current Bloch coordinates: x ${vector.x.toFixed(3)}, y ${vector.y.toFixed(3)}, z ${vector.z.toFixed(3)}. The solid arrow shows the current state; the dashed arrow shows the previous state.`;
  };
}
