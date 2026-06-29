# SimCH Business — Workspace Agent Rules

These rules apply to all AI agents (including Antigravity and subagents) when working on the `simch-business` project.

---

## 1. Coding Style & Conventions

Always check and adhere to the project's styling guide in [Coding-Conventions.md](file:///d:/ME/VSCODE/simch-business/docs/Coding-Conventions.md). Key points:
- **Naming**:
  - `PascalCase` for Classes, Interfaces, and Phaser Scenes.
  - `camelCase` for variables, properties, functions, and methods.
  - `kebab-case` for folders and files.
  - `SCREAMING_SNAKE_CASE` for constants and event keys.
- **TypeScript**: Strict type annotations must be used. Never use `any`. Always declare return types for public methods.
- **Phaser Scenes**: Inherit from `Phaser.Scene`. Order methods chronologically: `init()` -> `preload()` -> `create()` -> `update()`.
- **Assets**: Never use hardcoded string literals for asset keys. Always reference them from a central configuration object (e.g. `ASSETS.IMAGES.XYZ`).

---

## 2. Architectural Integrity

- **State Separation**: Do not store persistent game state (like current money, employee list, or branch stock) directly inside Phaser Scenes. Use the centralized `GameState` singleton.
- **Event-Driven**: Enable communication between systems (e.g., when a purchase is made or time ticks) using the central `EventBus` rather than direct scene/class references.
- **HTML Overlays**: Build analytical dashboards, menus, and forms using HTML/CSS overlays on top of the Phaser Canvas for maximum responsiveness and rich style, reserving the Phaser Canvas for 2D visual simulations (NPC paths, animations).
