---
paths: src/app/**/*.ts, src/app/**/*.css, src/app/**/*.html, src/app/**/*.scss
---

# Frontend Architecture

## Layer Responsibilities

### Components (src/app/**/components/)

Components handle presentation only: render UI, capture input, delegate to facades, display loading/error states.

Components must NOT contain business logic, call repositories directly, or manage complex state.

**Smart components** inject facades, subscribe to signals, pass data to children, handle route params.

**Presentational components** use `@Input`/`@Output` only, no services, pure rendering.

Prefer presentational. If UI appears twice, extract to shared.

### Facades (src/app/**/services/*.facade.ts)

Facades orchestrate: coordinate store and repository calls, manage side effects (navigation, notifications), expose signals, handle errors.

One facade per feature domain. Single point of contact for smart components.

### Stores (src/app/**/store/*.store.ts)

Stores manage reactive state with `@ngrx/signals`: hold state as signals, provide computed signals for derived data, expose update methods.

Stores must NOT make HTTP calls or contain business logic. Cross-store data combination happens in facades.

### Repositories (src/app/**/services/*.repository.ts)

Repositories handle HTTP: build requests, transform responses to domain models, handle errors.

One repository per backend domain. Return Observables.

---

## Component Reuse

### Shared Components (src/app/shared/components/)

Reusable, presentational, feature-agnostic UI building blocks.

**Extract when:** pattern appears in 2+ features, no feature-specific logic, represents a design system element.

**Existing shared components** (check before creating new):

- `ActivityButtonComponent` - activity display with costs, requirements, effects
- `LocationMarkerComponent` - location display with district theming
- `EmotionDisplayComponent` - Plutchik emotion visualization

Prefer composition and variants over new components.

---

## Visual Design Language

### Philosophy

**Calm, functional, paper-like.** A digital notebook, not a flashy dashboard. Quiet, warm, readable, inviting for long sessions.

### Colors

Use flat, muted colors. Avoid saturated primaries and neon.

- **Base:** Warm white background (`#fafafa`), white surfaces, soft black text (`#333`), muted gray secondary (`#666`)
- **Semantic:** Muted green (positive), muted red (negative), muted amber (warning), muted blue (info)
- **Feature colors:** Districts and categories use distinct but muted hues at low opacity for backgrounds, full strength only for small accents

### Avoid

- Gradients (except very subtle single-hue fades)
- Glow effects and animated shimmers
- Heavy shadows (use at most `0 1px 3px rgba(0,0,0,0.08)`)
- Pill shapes (use `border-radius: 4-6px`, circular only for avatars)

### Typography

System font stack. Minimum 14px body, line-height 1.5. Hierarchy through size/weight, not color.

Scale: 24px titles, 18px headers, 14-16px body, 12-13px labels.

### Spacing

4px base unit: 4 (tight), 8 (default gap), 12 (component padding), 16 (section), 24 (major sections), 32 (page-level).

Be generous with whitespace—breathing room feels cozy.

### Transitions

Subtle and purposeful: `transition: background-color 150ms ease`. Reserve movement for meaningful state changes.

---

## Information Display

### Progressive Disclosure

Show information in layers:

1. **Always visible:** Essential state (stats, time, location)
2. **On demand:** Supporting details (breakdowns, axes)
3. **Deep dive:** Full transparency (calculations, formulas)

Use expansion panels for levels 2-3. Never bury important information.

### Full-Screen Over Overlays

Use modals only for confirmations and simple inputs. Complex views (results, detailed stats) get full-screen or full-panel displays.

### Development Transparency

During active development, expose system internals directly: dice rolls, effect breakdowns, hidden state. Use expansion panels to organize, but don't hide behind feature flags—visibility beats polish at this stage.

---

## Mobile-First Design

Design for phones first, enhance for larger screens.

### Breakpoints

- Mobile (default): up to 599px
- Tablet: `@media (min-width: 600px)`
- Desktop: `@media (min-width: 900px)`

### Touch & Scrolling

- Touch targets: minimum 44x44px
- Vertical scroll is natural; horizontal scroll is forbidden (except carousels/tables)
- Tooltips don't work on touch—provide tap-to-reveal alternatives or inline info

### Responsive Patterns

Single column on mobile, stack actions vertically, hide secondary info with "show more" options.

---

## Visual Content Placeholders

Prepare for future images (portraits, locations, items):

- Reserve space with aspect-ratio containers
- Layouts must work without images (placeholder is fallback)
- Use Material icons as stand-ins

**Sizing:** Portraits 2:3 portrait orientation, location scenes 16:9 or 4:3 full-width, item icons 32-48px.

---

## Routing and Navigation

Routes organized by feature: `/login`, `/game`, `/game/home`, `/game/neighbors`, `/game/neighbors/:id`.

`AuthGuard` on all `/game` routes. Lazy-load feature modules.

URL state for shareable/bookmarkable data (tabs, filters). Store state for transient UI (expanded panels).

---

## Data Loading

### Data Must Survive Navigation

Users may refresh on any route, deep link, or return after idle. **Every view must ensure its data is loaded**—don't assume previous navigation populated the store.

Check store and load if empty. Deduplicate requests across components. Refresh affected data immediately after mutations.

### Loading States

Skeleton screens over spinners. Never show blank screens. Indicate what's loading.

---

## Error Handling

Stores hold error state alongside data. Facades clear errors on retry.

User-facing errors: plain language, suggest actions, no stack traces. Provide retry buttons, preserve user input on failure, fall back gracefully for optional data.

---

## Accessibility

Keyboard navigation: all interactive elements focusable via Tab, activatable via Enter/Space, logical focus order.

Semantic HTML (`button`, `nav`, `main`). Labels for form inputs. WCAG AA color contrast (4.5:1 for text). Never convey information through color alone.
