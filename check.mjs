// Smoke check: renders the real client module with a stub React/localStorage and
// asserts the numbers it prints. Run with `node check.mjs` (no dependencies).
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('./lib/client.js', import.meta.url), 'utf8');

const pad = (n) => String(n).padStart(2, '0');
const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return iso(d);
};

const React = {
  createElement: (type, props, ...children) => ({ type, props, children: children.flat(Infinity) }),
  useState: (init) => [typeof init === 'function' ? init() : init, () => {}],
  useEffect: () => {},
  useReducer: (reducer, init) => [init, () => {}],
};

let plugin;
let stored = null;
const windowStub = {
  __ModuleLoader__: { load: ({ factory }) => { plugin = factory((name) => (name === 'react' ? React : null)); } },
  localStorage: { getItem: () => (stored === null ? null : JSON.stringify(stored)), setItem: () => {} },
};

new Function('window', source)(windowStub);

const registered = [];
plugin.apply({
  locale: { register: () => {}, bind: () => (key) => key, subscribe: () => () => {} },
  slots: {
    inject: (slot, callback) => callback(),
    register: (options, Component) => { registered.push({ options, Component }); return () => {}; },
  },
});

const panelEntry = registered.find((entry) => entry.options.name === 'main');
const iconEntry = registered.find((entry) => entry.options.name === 'sidebar.panellist');
if (!panelEntry || !iconEntry) throw new Error('panel or sidebar icon not registered');
if (iconEntry.options.id !== 'weight-panel' || panelEntry.options.key !== 'weight-panel') {
  throw new Error('sidebar id must address the main panel key');
}

const flatten = (node, out = []) => {
  if (node === null || node === undefined || node === false) return out;
  if (Array.isArray(node)) { node.forEach((child) => flatten(child, out)); return out; }
  if (typeof node === 'object') {
    if (typeof node.type === 'function') return flatten(node.type(node.props || {}), out);
    if (node.children) flatten(node.children, out);
    return out;
  }
  out.push(String(node));
  return out;
};

const render = () => flatten(panelEntry.Component()).join(' | ');
const expect = (text, needle, why) => {
  const found = needle instanceof RegExp ? needle.test(text) : text.includes(needle);
  if (!found) throw new Error(`missing "${needle}" (${why})\n--- rendered ---\n${text}`);
};

// --- scenario A: a filled-in store ---
stored = {
  profile: { height: 170, targetWeight: 70, targetDate: '2027-06-01', dailyCalories: 1800, dailyProtein: 120 },
  days: {
    [daysAgo(1)]: { weight: 75, waist: 88, steps: 8000, strength: 20, walk: 30 },
    [daysAgo(2)]: { weight: 75.4 },
    [daysAgo(9)]: { weight: 76 },
    [daysAgo(10)]: { weight: 76.2 },
  },
};
const filled = render();
expect(filled, '75.0 kg', 'latest weight');
expect(filled, '26.0', 'BMI 75 / 1.7^2');
expect(filled, '5.0 kg', 'distance to target');
expect(filled, '75.2 kg', 'average of the two last-7-day weights');
expect(filled, '-0.9', 'delta against the previous window');
expect(filled, '20 / 60 min', 'weekly strength minutes');
expect(filled, '30 / 100 min', 'weekly walk minutes');
expect(filled, '8000 / 8000', 'average weekly steps');
expect(filled, /\| eta \| \d{4}-\d{2}-\d{2} \|/, 'projected goal date next to the eta label');

// --- scenario B: first run, nothing stored ---
stored = null;
expect(render(), 'nodata', 'empty state instead of fabricated numbers');

// --- scenario C: records but no profile ---
stored = { days: { [daysAgo(1)]: { weight: 75 } } };
const bare = render();
expect(bare, '75.0 kg', 'weight still renders without a profile');
expect(bare, '— kg', 'target/BMI degrade to a dash instead of NaN');

console.log('weight-panel check: ok');
