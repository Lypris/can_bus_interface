# CAN Bus Touch Dashboard (Raspberry Pi 3)

Modern touch-first dashboard for Node-RED `uibuilder`, designed for a fixed 7-inch class landscape display (1280x720).

## UI/UX Structure

Layout zones:
1. Top status bar: connection state, fault state, last message age.
2. Main split area:
   - Left: high-priority telemetry cards (voltage, current, RPM, thermal).
   - Right: active page content (control panel, diagnostics, setup).
3. Bottom glide indicator: swipe progress and active page markers.

Navigation model:
1. Horizontal finger swipe switches full-width pages (`Overview`, `Controls`, `Lights`, `Setup`).
2. Gesture starts on interactive controls are ignored to preserve taps, switches, sliders, and buttons.
3. Swipe is accepted only after intentional horizontal movement threshold to avoid accidental page changes.
4. Emergency action (`Stop All`) always visible in control view.

## Component Hierarchy

- `App`
- `TopStatusBar`
- `StatusGrid`
- `ControlPanel`
- `useSwipePages`
- `ui/*` shadcn-style primitives (`Button`, `Card`, `Badge`, `Slider`, `Switch`, `Progress`)

## WebSocket Integration Pattern (Node-RED uibuilder)

Hook: `src/hooks/useUibuilder.ts`
- Connects to namespace `/${VITE_UIBUILDER_URL}`.
- Uses uibuilder path `/uibuilder/vendor/socket.io`.
- Listens to both `uiBuilder` and `uiBuilderMsg` events.
- Exposes `send(payload, topic)` for command/control messages.

Control message example:
```ts
send(
  {
    type: 'control-update',
    controls: nextState,
    reason: 'fan-speed',
  },
  'controls',
)
```

## Styling and Touch Strategy

- Minimum touch target: `44px`.
- Font sizing tuned for readability at arm's length (`text-lg` to `text-4xl`).
- Fixed canvas layout with controlled scaling using `useFixedScale`.
- Low-motion transitions only (no expensive animation loops).

## Fixed Small-Screen Scaling Strategy

This project does not use generic mobile responsiveness.

Instead:
1. Design against a fixed base canvas: `1280x720`.
2. Compute scale factor from viewport to base canvas.
3. Apply a single transform scale to the entire dashboard frame.
4. Clamp scale range to avoid tiny or giant controls.
5. Show orientation guard screen when portrait is detected.

Benefits:
- Stable spacing and alignment.
- Predictable touch geometry.
- Less CSS complexity and fewer layout recalculations.

## Raspberry Pi 3 Performance Guidelines

1. Keep component tree shallow and memoize display components (`memo`).
2. Avoid heavy box-shadows, blurs, and perpetual animations.
3. Use coarse update intervals for non-critical UI timers.
4. Batch control state updates before emitting over socket.
5. Keep bundle lean with selective shadcn primitives only.

## Run

```bash
npm install
npm run dev
```

## Build and Deploy

```bash
npm run build
npm run deploy
```

Optional SCP deploy:

```bash
npm run deploy -- --scp
```
