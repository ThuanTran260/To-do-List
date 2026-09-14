# Adaptive Hardware Lite Mode and Zero-Cost Motion

We detect software rasterizers (LLVMpipe/SwiftShader/VMs) and low-concurrency devices via a single-probe WebGL lifecycle with immediate context loss cleanup, synchronize an active lite-mode CSS layer that eliminates backdrop filters and enforces opaque surfaces against bleed-through, and collapse spring physics calculations across all motion components using Framer Motion's top-level MotionConfig with tri-state user override.

## Status

accepted

## Context & Decision

Running rich modern web interfaces with extensive Gaussian blur (`backdrop-blur-md`), multi-layer shadows, and continuous Framer Motion physics simulations in virtualized Linux environments (e.g., Ubuntu/CentOS on VirtualBox, VMware, QEMU/KVM with Mesa LLVMpipe or SwiftShader) or low-end dual-core laptops causes severe CPU spikes, dropped frames (sub-15 FPS), and degraded user experience.

We decided to:
1. **Two-Tier Heuristic Hardware Detection**: Probe WebGL canvas attributes (`UNMASKED_RENDERER_WEBGL`, `UNMASKED_VENDOR_WEBGL`, with fallback to standard `gl.RENDERER`/`gl.VENDOR`) to identify software rasterizer signatures (`llvmpipe`, `softpipe`, `swiftshader`, `mesa off-screen`, `vmware`, `virtualbox`, `qemu`, `virgl`, `basic render`, `microsoft basic render driver`, `lavapipe`, `parallels`). Combine with `navigator.hardwareConcurrency <= 2` and `prefers-reduced-motion` accessibility settings.
2. **WebGL Context Leak Defense (Zero Context Exhaustion)**: Destroy the probe WebGL context immediately after inspection using `WEBGL_lose_context.loseContext()` to prevent exhausting the browser's 8–16 WebGL context limit. Memoize inspection results singleton-style across the application lifetime so the probe runs exactly once.
3. **Hydration-Safe & Anti-Flash PerformanceProvider**: Manage initial state safely without triggering React 19 hydration mismatches. Synchronize the `.lite-mode` class directly to `document.documentElement` during client-side mount effects with automated unmount cleanup to prevent test pollution and leaky styles.
4. **Opacity Bleed-Through Defense**: Stripping `backdrop-filter` from semi-transparent elements (`bg-surface-1/80`, `bg-surface-1/90`) causes scrolled background text to bleed through navigation headers, sidebars, modals, and popovers. The `.lite-mode` CSS layer explicitly forces solid, 100% opaque background colors (`var(--surface-1) !important`) on all surface containers (`header`, `aside`, `[role="dialog"]`, `[data-floating-panel]`, `.surface-panel`, and `[class*="backdrop-blur"][class*="bg-surface"]`), guaranteeing crisp contrast.
5. **Zero Component Pollution via `<MotionConfig>`**: Wrap the root application tree in Framer Motion's `<MotionConfig reducedMotion={isLiteActive ? "always" : "user"}>`. All motion components (`motion.div`, `AnimatePresence`) instantly switch to zero-duration layout transitions, eliminating tick-by-tick physics calculation overhead on the main thread without altering individual component implementations.
6. **Tri-State User Override Control**: Provide an accessible three-state toggle (`auto` -> `lite` -> `full`) persisted in `localStorage` (`flowstate-performance-mode`) via `<PerformanceToggle />` in the top header, allowing users to override automatic heuristics at any time with accurate tooltips distinguishing software rasterizers, reduced motion preferences, and low CPU cores.

## Considered Options

- **Runtime FPS benchmarking (rAF frame-drop sampling)**: Rejected. Frame profiling during initial page load is inherently noisy, adds layout thrashing, delays first contentful paint, and creates noticeable initial stutter.
- **Manual `reducedMotion` props on individual components**: Rejected. Prop drilling or manual context consumption across dozens of components increases boilerplate, invites regressions, and pollutes component code.
- **Relying solely on `prefers-reduced-motion` media query**: Rejected. Standard accessibility media queries cannot detect software rasterization or resource constraints in virtual machines where the user has not altered OS accessibility preferences.
- **Relying solely on `navigator.hardwareConcurrency`**: Rejected. Browsers with privacy protections (e.g. Firefox `privacy.resistFingerprinting`) artificially report 2 cores, which would produce false positives on high-end hardware without GPU software rasterizer verification.

## Consequences

- 100% elimination of CPU-bound Gaussian blur convolution passes on low-end and virtualized machines.
- Restores smooth, responsive 60 FPS navigation and task interaction on software rasterizers and low-tier hardware.
- Fully automated adaptation with zero mandatory manual configuration by the end user.
- Zero component code pollution across existing and future UI components.
- Tri-state toggle provides instant visibility into detected hardware state and gives complete manual agency to the user.
