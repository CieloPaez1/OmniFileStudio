# AI Prompt History & Guidelines

## Objective
The application is a modern, responsive task and project management dashboard. The design focuses on "premium" visual fidelity:
- Soft rounded corners (16px)
- Shadows for depth (`box-shadow: 0 4px 20px rgba(15, 23, 42, 0.03)`)
- Clean, indigo/blue color palettes for primary actions
- Full-width (`100%`) scalability without rigid `max-width` constraints.

## Workflow & Patterns
1. **Reactivity**: Use Angular Signals (`signal`, `computed`) for reactive data flow across components.
2. **Chart.js**: Initialize instances using a small `setTimeout` inside `ngAfterViewInit` to allow the Flexbox/Grid DOM layout to settle, preventing collapsed zero-size canvas issues.
3. **PDF Generation**: Apply `data-html2canvas-ignore="true"` to action buttons and dynamic UI elements (like selects) to exclude them from the final PDF export.
4. **Styling Consistency**: Rely on global or shared component CSS classes like `.btn-primary` and `.btn-primary.outline` across all module views to maintain the premium aesthetic.

> *Nota: Este documento de especificación y su respectivo código fueron generados íntegramente por **Antigravity** (Asistente de IA).*
