---
trigger: model_decision
description: When you use it Anime.js, be guide by this document
---

# Anime.js Documentation

## Summary

Anime.js is a lightweight JavaScript animation engine for building rich, performant animations on the web. The documentation is organized into focused sections that cover basic usage, advanced control, utilities, and engine configuration.[^1]

***

## Environment Setup

Anime.js can animate DOM elements, SVG, and JavaScript objects in any modern browser.[^1]

- **Core requirements**
    - A modern browser with JavaScript enabled.[^1]
    - A bundler or plain `<script>` tag, depending on how you load the library.[^1]
- **Where to start in the docs**
    - “Getting started” → Installation, module imports, usage with vanilla JS and React.[^1]
    - Version selector at the top lets you switch between 4.2.2, 3.2.2, and 2.1.0 docs.[^1]

***

## Step-by-Step Usage Guide

Use this as a map of the documentation to implement features progressively.[^1]

### 1. Basic setup and first animation

1. Open **Getting started → Installation** to choose how to add Anime.js (CDN, npm, etc.).[^1]
2. Follow **Module imports** if using bundlers, or **Using with vanilla JS** for `<script>` setup.[^1]
3. For React projects, follow **Using with React** to integrate animations with components.[^1]

Once installed:

- Go to **Animation → Targets** to see how to select elements:
    - CSS selectors, direct DOM elements, JS objects, or arrays of targets.[^1]
- Go to **Animation → Animatable properties** to learn what can be animated:
    - CSS properties, transforms, variables, JS object properties, HTML/SVG attributes.[^1]


### 2. Controlling time and playback

Anime.js uses a **Timer** abstraction that underlies animations and timelines.[^1]

- **Timer → Playback settings**
    - Configure `delay`, `duration`, `loop`, `alternate`, `reversed`, `autoplay`, `frameRate`, `playbackRate`.[^1]
- **Timer → Callbacks**
    - Hook into `onBegin`, `onComplete`, `onUpdate`, `onLoop`, `onPause`, and `then()` to react to lifecycle events.[^1]
- **Timer → Methods**
    - Control playback with `play()`, `pause()`, `reverse()`, `restart()`, `alternate()`, `resume()`, `complete()`, `reset()`, `cancel()`, `revert()`, `seek()`, and `stretch()`.[^1]

These same concepts reappear in **Animation** and **Timeline** sections with extra animation‑specific options.[^1]

### 3. Building animations

Use the **Animation** section after the basics.[^1]

- **Tween value types**
    - Numerical, unit conversion, relative values, colors, CSS variables, and function-based values.[^1]
- **Tween parameters**
    - `to`, `from`, `delay`, `duration`, `ease`, `composition`, `modifier` per property or per animation.[^1]
- **Keyframes**
    - Duration‑based or percentage‑based keyframes with tween values and parameters.[^1]

Playback and callbacks here mirror Timer but add animation‑specific controls like `playbackEase` and WAAPI options such as `persist`.[^1]

Use **Animation → Methods** and **Animation → Properties** for runtime control and inspection of each animation instance.[^1]

### 4. Coordinating multiple animations with timelines

For complex sequences, use **Timeline**.[^1]

- **Building a timeline**
    - Add timers and animations with `add()` and `set()`.[^1]
    - Synchronize WAAPI animations and multiple timelines with `sync()` and `label()`.[^1]
    - Trigger functions at points in time with `call()` and `time-position` controls.[^1]
- **Timeline playback**
    - Configure defaults, `delay`, `loop`, `loopDelay`, `alternate`, `reversed`, `autoplay`, `frameRate`, `playbackRate`, `playbackEase`.[^1]
    - Use methods such as `play()`, `pause()`, `restart()`, `reverse()`, `seek()`, `stretch()`, `refresh()`, etc.[^1]


### 5. Animatable, Draggable, Scope, Events

These sections add structure and interactivity around your animations.[^1]

- **Animatable**
    - Wrap individual properties with settings (`unit`, `duration`, `ease`, `modifier`).[^1]
    - Use getters, setters, `revert()`, and access Animatable properties for dynamic control.[^1]
- **Draggable**
    - Configure axes (`x`, `y`, `snap`, `modifier`, `mapTo`).[^1]
    - Tune drag behavior with settings like `trigger`, `container`, friction, thresholds, scroll speed, and cursor.[^1]
    - React with callbacks (`onGrab`, `onDrag`, `onUpdate`, `onRelease`, `onSnap`, `onSettle`, `onResize`, `onAfterResize`).[^1]
    - Control instances via methods (`enable()`, `disable()`, `setX()`, `setY()`, `animateInView()`, `scrollInView()`, `stop()`, `reset()`, `revert()`, `refresh()`).[^1]
- **Scope**
    - Define a scoped environment with parameters: `root`, `defaults`, `mediaQueries`.[^1]
    - Register constructor and method functions; manage lifecycle with `add()`, `addOnce()`, `keepTime()`, `revert()`, `refresh()`.[^1]
- **Events → onScroll**
    - Observe scroll with settings (container, target, debug, axis, repeat) and thresholds (numeric, position shorthands, relative, min/max).[^1]
    - Synchronize scroll position with animations using method names, playback progress, smooth or eased scroll.[^1]
    - Use scroll callbacks (`onEnter*`, `onLeave*`, `onUpdate`, `onSyncComplete`) and control observers via `link()`, `refresh()`, `revert()`.[^1]


### 6. SVG, Text, Utilities, Easings, WAAPI, Engine

- **SVG**
    - Morph shapes with `morphTo()`, create drawable paths with `createDrawable()`, and motion paths with `createMotionPath()`.[^1]
- **Text**
    - Split text into lines, words, chars via `splitText()` and its settings (`lines`, `words`, `chars`, `debug`, `includeSpaces`, `accessible`).[^1]
    - Customize wrapping (class, wrap tag, clone), then manage effects with `addEffect()`, `revert()`, `refresh()`.[^1]
- **Utilities**
    - `stagger()` for time/value/timeline staggering with fine control over start, from, reversed, ease, grid, axis, modifier, use, total.[^1]
    - DOM helpers: `$()`, `get()`, `set()`, `cleanInlineStyles()`, `remove()`, `sync()`, `keepTime()`.[^1]
    - Math/helpers: `random()`, `createSeededRandom()`, `randomPick()`, `shuffle()`, `round()`, `clamp()`, `snap()`, `wrap()`, `mapRange()`, `lerp()`, `damp()`, `roundPad()`, `padStart()`, `padEnd()`, `degToRad()`, `radToDeg()`, including chain‑able variants.[^1]
- **Easings**
    - Built‑in eases, cubic Bézier, linear, steps, irregular, and spring easing functions.[^1]
- **WAAPI**
    - Guidance on when to use WAAPI, hardware‑acceleration, and Anime.js improvements (multi-targets, default units, function-based values, individual transforms, property params, spring/custom easings).[^1]
    - API differences from native WAAPI (`iterations`, `direction`, `easing`, `finished`) and `convertEase()` helper.[^1]
- **Engine**
    - Configure engine parameters: `timeUnit`, `speed`, `fps`, `precision`, `pauseOnDocumentHidden`.[^1]
    - Control engine with `update()`, `pause()`, `resume()` and inspect engine properties and defaults.[^1]

***

## Conceptual Explanation

Anime.js is structured around a **Timer** core, with **Animation** and **Timeline** as higher-level constructs that reuse the same playback and callback model. **Animatable**, **Draggable**, **Scope**, and **Events** are orchestration layers for managing state, interaction, and context around these timers.[^1]

The library separates concerns into modules like SVG, Text, Utilities, Easings, WAAPI, and Engine so you can adopt only what is needed for a given project. This modular documentation layout mirrors that design, allowing targeted learning of features such as scroll-driven motion, motion paths, or spring easings without reading everything at once.[^1]

***

## Best Practices

- Start with **Getting started** and basic **Animation** examples before using Timelines, Draggable, or scroll events.[^1]
- Use **Scope** and utility functions to keep animation logic organized and reusable, especially in large codebases.[^1]
- Prefer **WAAPI** integration for performance‑sensitive animations while still leveraging Anime.js improvements and utilities.[^1]

***

## Example Use Cases

- Hero section: use **Text → splitText()**, **Animation**, and **Easings** to animate headings word‑by‑word with staggered timings.[^1]
- Interactive carousel: combine **Draggable**, **Timeline**, and **Utilities → snap() / mapRange()** for smooth drag‑based transitions.[^1]
- Data‑driven visualization: animate SVG paths with **SVG → createMotionPath()** and control flow via **Timeline** and **onScroll** events for storytelling experiences.[^1]

<div align="center">⁂</div>

[^1]: https://animejs.com/documentation/