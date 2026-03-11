# AgentFlow — Visual AI Workflow Editor

A production-grade, drag-and-drop editor for building AI agent workflows. Built with Next.js, TypeScript, ReactFlow, and Zustand.

## Quick Start

```bash
cd workflow-editor
npm install
npm run dev
# Open http://localhost:3000
```

---

## Architecture

### Stack

| Layer | Technology | Why |
|---|---|---|
| Framework | Next.js 14 (App Router) | Production-ready, RSC-ready |
| Language | TypeScript | Full type safety across domain |
| Styling | Tailwind CSS | Fast, consistent design tokens |
| Canvas | ReactFlow (@xyflow/react) | Best-in-class node editor; abstracted behind domain components |
| State | Zustand + Immer | Simple, scalable, testable stores |
| Undo/Redo | Zundo | Temporal middleware for Zustand |
| Persistence | LocalStorage | Drop-in replaceable with API layer |

### Folder Structure

```
src/
├── app/                    # Next.js App Router pages and layout
├── components/
│   ├── ui/                 # Base primitives: Button, Input, Select, Badge, etc.
│   └── editor/
│       ├── canvas/         # ReactFlow wrapper, custom edges, empty state
│       ├── nodes/          # Node renderers (NodeWrapper, GroupNode)
│       ├── panels/         # NodePalette, PropertiesPanel, ValidationPanel
│       └── toolbar/        # Toolbar, Save/Load/Templates dialogs
├── data/
│   ├── seeds/              # Example workflows for onboarding
│   └── templates/          # Reusable workflow templates
├── hooks/                  # useKeyboardShortcuts, useTemporalStore
├── lib/
│   ├── persistence/        # LocalStorage save/load/export/import
│   ├── validation/         # Flow validation rules
│   └── utils/              # cn() utility
├── store/
│   ├── workflowStore.ts    # Workflow state: nodes, edges, CRUD ops, undo/redo
│   └── editorStore.ts      # UI state: selection, panels, zoom, grid
└── types/
    ├── index.ts            # Core domain types
    └── node-registry.ts    # Node type definitions + metadata
```

### Domain Model

```typescript
Workflow { id, name, description, tags, version, createdAt, updatedAt, nodes, edges, viewport }
WorkflowNode { id, type, position, data: { label, nodeType, config, notes, validation } }
WorkflowEdge { id, source, target, sourceHandle?, targetHandle?, animated?, label? }
```

### State Architecture

- **workflowStore** — Workflow data (nodes, edges, save/load). Wrapped with `temporal` (zundo) for undo/redo and `immer` for clean mutations.
- **editorStore** — Transient UI state: selection, panels, zoom, grid. Not persisted.

---

## Node Types

| Type | Category | Description |
|---|---|---|
| Input | IO | Workflow entry point |
| Output | IO | Final output or response |
| Agent | AI | AI model with system prompt, tools, memory |
| Prompt | AI | Jinja2/Mustache template formatter |
| Condition | Logic | True/False branching |
| Router | Logic | Multi-path routing |
| Loop | Control | For-each, while, fixed-count loops |
| Approval | Control | Human-in-the-loop gate |
| Tool | Integration | Execute a named function or MCP tool |
| API Call | Integration | HTTP request with auth and templating |
| Memory | Memory | Read/write/search agent memory stores |
| Group | Control | Visual container for organizing nodes |

---

## Features

- Drag and drop blocks from the left palette
- Visual connections between node handles
- Per-node properties panel with full config forms
- Validation with error/warning visualization
- Undo/Redo (50 states)
- Save/Load with localStorage + JSON export/import
- 4 built-in templates + 2 onboarding examples
- Group/ungroup nodes
- Duplicate, delete, multi-select
- Minimap + grid snapping + zoom controls
- Full keyboard shortcuts

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| Cmd+S | Save workflow |
| Cmd+Z | Undo |
| Cmd+Shift+Z | Redo |
| Cmd+D | Duplicate selected |
| Del / Backspace | Delete selected |
| Esc | Deselect all |
| Cmd+E | Export as JSON |
| Shift+drag | Multi-select |

---

## Extending the System

### Adding a New Node Type

1. Register in `src/types/node-registry.ts` with label, icon, color, handles, defaultConfig
2. Add config type to `src/types/index.ts`
3. Add config form in `NodePropertiesForm.tsx` (switch case)
4. Add validation rules in `src/lib/validation/index.ts`

The `NodeWrapper` component handles rendering from the registry automatically — no custom render needed for standard nodes.

### Replacing LocalStorage with an API

Swap the functions in `src/lib/persistence/index.ts`:
- `saveWorkflow(workflow)` → POST to your API
- `loadWorkflow(id)` → GET from your API
- `listWorkflows()` → GET index from your API

No store changes required.

---

## Phase 2 Improvements

- **Execution engine** — Run workflows, visualize the active step, stream outputs
- **Real-time collaboration** — Multiplayer editing via Liveblocks or PartyKit
- **Version history** — Named snapshots with diff view and restore
- **User auth + teams** — Clerk/Auth.js + workspace sharing
- **Database persistence** — Replace localStorage with PostgreSQL + Prisma
- **MCP server import** — Auto-generate Tool nodes from MCP manifests
- **OpenAPI import** — Generate API Call nodes from OpenAPI specs
- **Git sync** — Store workflows as version-controlled JSON files
- **Cmd+K palette** — Search and jump to any node
- **Dark mode** — Full theme support
- **Custom node plugin SDK** — External node type packages
