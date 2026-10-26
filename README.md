# DSH Weight Panel

**中文版 / Chinese:** [README_CN.md](./README_CN.md)

## Why I built this

> Skip this section if you only want installation and usage.

I built this for my own weight-loss plan.

My body-fat scale reports a pile of numbers — body-fat percentage, water, muscle mass, visceral fat
level — and they arrive scattered across the scale's app, in no shape to hand to an assistant. (An
app I tried before was good, but it would not talk to my scale, so the data never got in.) I want the
agent to see my actual body data *before* it recommends anything, so this plugin does the one thing
that was missing: a place to type those numbers in, with the trend math done for you.

Today it records and computes; it does not advise. The obvious gap is **calorie intake** —
estimating calories from a photo is hand-wavy, and nobody carries a kitchen scale to a school
canteen. That part is unsolved on purpose, not by oversight.

A sidebar panel plugin for [DSH (DeepSeek Harness)](https://github.com/deepseek-ai) that logs daily
weight, waist, steps and training minutes, and shows the trend against a weight goal.

Everything is computed and stored in the browser. The plugin makes no network requests and sends no
telemetry; there is no Host-side code beyond an empty `apply()`.

## What it does

- **Profile** (set once): height, target weight, target date, daily calorie and protein targets.
- **Daily entry**: date, weight, waist, steps, strength minutes, brisk-walk minutes.
- **Overview**: latest weight, BMI, distance to target, last-7-day average vs the previous 7 days,
  this week's strength minutes (of 60), walk minutes (of 100) and average steps (of 8000), plus a
  projected goal date from a least-squares slope over the last 20 days.
- **Records**: the last 14 days, individually deletable.
- **Copy for agent**: dumps the summary and records as plain text, so you can paste it into a chat
  with the agent (the panel data never leaves your browser otherwise).

## Install

From a workspace checkout, install it as a local bundle:

```js
plugin_manager({ action: 'install_bundle', target: '/absolute/path/to/weight-panel' })
```

or add it to the profile's `package.json` dependencies as a `file:`/`link:` path and list it under
`dsh.profile.bundles`. The bundle patch inserts one Host row (`weight-panel`) and the Client half
registers itself into two slots.

## How it mounts

| Slot | Key / id | Purpose |
|---|---|---|
| `sidebar.panellist` | `id: 'weight-panel'`, order 30 | the sidebar icon |
| `main` | `key: 'weight-panel'` | the panel the icon opens |

The two identifiers must match: the sidebar resolves a panel icon by id and the main column
dispatches that same id as the key ("Each list id addresses the matching main panel").

## Storage

`localStorage['dsh.weight-panel.v1']`:

```json
{
  "profile": { "height": 170, "targetWeight": 70, "targetDate": "2027-06-01",
               "dailyCalories": 1800, "dailyProtein": 120 },
  "days": { "2026-01-01": { "weight": 75, "waist": 88, "steps": 8000,
                            "strength": 20, "walk": 30 } }
}
```

Clearing site data or switching browsers loses it. Reset from the console with
`localStorage.removeItem('dsh.weight-panel.v1')`.

## Layout

```
lib/client.js       the whole UI (lazy CJS module for window.__ModuleLoader__)
lib/index.js        empty Host half
cordis.patch.yml    inserts the plugin row
locale/{en,zh}.json display metadata read by the plugin manager
icon.svg            plugin icon
check.mjs           renders the real component against a stub React and asserts the numbers
```

There is no build step: `lib/` holds the shipped JavaScript directly, so what you read is what runs.

## Development

```bash
node --check lib/client.js
node check.mjs        # or: npm run check
```

`check.mjs` needs no dependencies: it stubs `React` and `localStorage`, renders the component and
asserts the formatted output (BMI, averages, deltas, weekly totals, projected date, empty state).
