# Design: OmniFile Studio

The locked system. Every Hallmark run reads this first and pages share it. Change it on purpose; the file is the rule.

## System
- Genre: modern-minimal
- Shape of the first page: app screen (Mobile Tabs shell + Dashboard Inicio, Catálogo de Herramientas, Repositorio de Archivos, Ajustes)
- Theme: brand (OmniFile Studio · Deep Navy `#081026` chrome + Icy Slate OKLCH paper + 4-colour tool signals)
- Axes: light-icy-slate / grotesk-sans / cobalt-and-signal-badges · posture: app

## Tokens
`frontend/src/tokens.css` is the source of truth. The roles:
```css
:root {
  --color-paper: oklch(96.8% 0.008 250);
  --color-paper-2: oklch(99.5% 0.002 250);
  --color-paper-3: oklch(94.0% 0.012 250);
  --color-navy: oklch(17.5% 0.048 262);
  --color-navy-2: oklch(22.5% 0.048 262);
  --color-ink: oklch(18.0% 0.030 260);
  --color-ink-2: oklch(46.0% 0.025 255);
  --color-muted: oklch(62.0% 0.020 255);
  --color-rule: oklch(90.0% 0.012 250);
  --color-accent: oklch(53.5% 0.220 260);
  --color-accent-ink: oklch(99.0% 0.004 250);
  --color-focus: oklch(53.5% 0.220 260);
  --font-display: "Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --font-body: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --font-mono: "JetBrains Mono", monospace;
  --radius-card: 14px;
  --radius-pill: 9999px;
  --rule-hair: 1px;
  --shadow-card: 0 1px 3px oklch(17% 0.04 260 / 0.05), 0 1px 2px oklch(17% 0.04 260 / 0.03);
}
```
The spacing scale (`--space-3xs` through `--space-4xl`), fixed app type scale, easings (`--ease-out`, `--ease-in-out`), and durations (`--dur-micro`, `--dur-short`) live in `frontend/src/tokens.css`.

## Controls
- Primary: `var(--color-accent)` fill with `var(--color-accent-ink)` text · `var(--radius-pill)` or `12px` · `36px–44px` hit target
- Secondary: `var(--color-paper-2)` fill with `1px solid var(--color-rule)` · same radius and height

## Motion
- Character: brisk state feedback (`--dur-micro: 120ms`, `--dur-short: 200ms`); `transform` and `opacity` only; `prefers-reduced-motion: reduce` collapses all transitions and animations immediately.

## Exports
`frontend/src/tokens.css` and `frontend/src/base.css` in this project.
