# Adaptive Hardware Lite Mode and Two-Axis Zero-Cost Motion (Plan B v2.1)

We detect software rasterizers (LLVMpipe/SwiftShader/VMs) and low-concurrency devices via a single-probe WebGL lifecycle with immediate context loss cleanup and versioned singleton cache (`INSPECTION_SCHEMA_VERSION = 2`), decouple the Motion Axis from the Graphical Fidelity Axis into two independent flags (`isMotionReduced` and `isFidelityLite`), synchronize an active lite-mode CSS layer with dynamic overdue task variables (`--overdue-*`), and collapse spring physics calculations across all motion components using Framer Motion's top-level `MotionConfig` while giving complete manual agency to the user.

## Status

accepted

## Context & Decision

Running rich modern web interfaces with extensive Gaussian blur (`backdrop-blur-md`), multi-layer shadows, and continuous Framer Motion physics simulations in virtualized Linux environments (e.g., Ubuntu/CentOS on VirtualBox, VMware, QEMU/KVM with Mesa LLVMpipe or SwiftShader) or low-end dual-core laptops causes severe CPU spikes, dropped frames (sub-15 FPS), and degraded user experience.

Conversely, forcing low-end/flat styling statically onto high-end desktop hardware (e.g. Intel Core i5-12600KF + NVIDIA RTX 4070) degrades visual polish, stripping ambient glow and subtle danger backgrounds from overdue task cards. Furthermore, conflating `prefers-reduced-motion` with graphical capability stripped colors and visual fidelity from desktop users who enabled reduced motion purely for vestibular accessibility.

We decided to:
1. **Two-Axis Architecture (Fidelity vs Motion)**:
   - **Fidelity Axis (`isFidelityLite`)**: Controls the `.lite-mode` class on `<html>` and CSS Custom Properties (`--overdue-bg`, `--overdue-border`, `--overdue-border-l-width`, `--overdue-glow-hover`, `--overdue-backdrop`). Driven strictly by hardware capability (`isLowEnd = isSoftwareRasterizer || cores <= 2`) in `auto` mode.
   - **Motion Axis (`isMotionReduced`)**: Controls Framer Motion via `<MotionConfig reducedMotion={isMotionReduced ? 'always' : 'user'}>`. Driven strictly by `(prefers-reduced-motion: reduce)` in `auto` mode.
   - Backward-compatible alias `isLiteActive = isFidelityLite || isMotionReduced` preserved for existing consumers.
2. **Two-Tier Heuristic Hardware Detection with Schema Versioning**:
   - Probe WebGL canvas attributes (`UNMASKED_RENDERER_WEBGL`, `UNMASKED_VENDOR_WEBGL`, with fallback to standard `gl.RENDERER`/`gl.VENDOR`) to identify software rasterizer signatures (`llvmpipe`, `softpipe`, `swiftshader`, `mesa off-screen`, `vmware`, `virtualbox`, `qemu`, `virgl`, `basic render`, `microsoft basic render driver`, `lavapipe`, `parallels`).
   - Hard gate strictly limited to `isLowEnd = isSoftwareRasterizer || cores <= 2`. Firefox ResistFingerprinting (RFP) reporting 2 cores is treated as an intentional, conservative Lite fallback.
   - Auxiliary non-blocking metadata signals (`memoryGb`, `maxTextureSize`, `isDesktop`, `isDedicatedGpu`) captured safely with fallback to `undefined`.
   - Singleton cache stamped with `INSPECTION_SCHEMA_VERSION = 2` to automatically discard stale cache structures across updates.
3. **WebGL Context Leak Defense (Zero Context Exhaustion)**:
   - Destroy the probe WebGL context immediately after inspection using `WEBGL_lose_context.loseContext()` to prevent exhausting the browser's 8–16 WebGL context limit.
4. **Hydration-Safe & Anti-Flash PerformanceProvider**:
   - Manage initial state safely without triggering React 19 hydration mismatches. Synchronize the `.lite-mode` class directly to `document.documentElement` during client-side mount effects based strictly on `isFidelityLite`.
   - OS `matchMedia('(prefers-reduced-motion: reduce)')` listener dynamically updates `isMotionReduced` without mutating `isFidelityLite`.
5. **Adaptive Overdue Task Indicators (Supersedes Decision #6)**:
   - *Supersedes decision #6 (Clean Overdue Task Indicators)*: Re-enables full-card subtle background tinting (`--overdue-bg: var(--danger-subtle)`), border tinting (`--overdue-border: var(--danger-border)`), and ambient red glow on hover/focus (`--overdue-glow-hover`) for Full/Desktop mode, while automatically preserving the high-contrast left accent strip (`--overdue-border-l-width: 4px`, `--overdue-border-l-color: var(--danger)`) on flat surface (`var(--surface-1)`) for Lite/VM mode.
   - Ambient glow is applied strictly on `:hover`, `:focus-within`, and `:focus-visible` rather than resting state, eliminating heavy repaint costs across 100+ tasks.
   - CSS containment `contain: paint` is explicitly prohibited because it clips box-shadow glow extending outside the border-box per W3C CSS Containment Level 2.
6. **Zero-Cost Transitions in Lite Mode**:
   - `.lite-mode` enforces `transition-duration: 0s !important; animation-duration: 0s !important;` globally. This completely eliminates CPU rasterization churn during hover interactions and layout shifts on software rasterizers.
7. **Two-Layer Tooltip & Tri-State User Override Control**:
   - Provide an accessible three-state toggle (`auto` -> `lite` -> `full`) persisted in `localStorage` (`flowstate-performance-mode`) via `<PerformanceToggle />`.
   - **Layer 1 (Visible Label)**: Shows concise status tracking `isFidelityLite` (`Auto` vs `Lite (Auto)`, `Lite`, `Full`).
   - **Layer 2 (Tooltip / ARIA)**: Explains exact reasoning without mischaracterizing high-end hardware with reduced motion as "máy yếu".
8. **A11y Manual Override Tradeoff & User Agency**:
   - When a user explicitly chooses `mode = 'full'`, animations and motion are re-enabled even if the OS reports `prefers-reduced-motion: reduce`. This represents explicit user agency, fully compliant with WCAG principles when the user intentionally overrides OS defaults.
   - **Migration Path**: Users who previously relied on enabling OS `prefers-reduced-motion` to force Lite mode should now click the toggle to set manual `Lite` mode.

## Consequences

- High-end desktops (e.g. RTX 4070) automatically receive 100% full graphical fidelity and ambient glow in `auto` mode.
- Users with `prefers-reduced-motion` enabled on desktop keep rich colors and visual depth without nausea-inducing spring motions.
- Weak hardware and Linux VMs automatically drop to minimal flat styling and 0s transitions for 60 FPS stability.
- Zero component code pollution: no ad-hoc hardware checks or prop-drilling inside individual UI components.
- Zero specificity conflicts between card hover rules and overdue indicators.
