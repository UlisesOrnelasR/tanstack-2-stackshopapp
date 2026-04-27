# StackShop 🛒

> A solid, reusable full-stack e-commerce foundation built with the TanStack ecosystem — built once, deployed many times.

---

## What is this?

**StackShop** is a base project designed to serve as the foundation for any future e-commerce.

---

## Tech Stack

| Layer                | Tech            |
| -------------------- | --------------- |
| Framework            | TanStack Start  |
| UI                   | React           |
| Routing              | TanStack Router |
| Data fetching        | TanStack Query  |
| Compiler             | React Compiler  |
| Linting / Formatting | Biome           |
| Deployment           | Railway         |
| Language             | TypeScript      |

---

## Build Log — Step by Step

This is a living document. Each step gets checked off as it's done.

### Phase 1 — Project Foundation

- [x] **Step 1 — Scaffold the project** with the TanStack CLI

  ```bash
  npx @tanstack/cli@latest create
  ```

  Selected options:
  - Framework → **React**
  - Toolchain → **Biome**
  - Deployment adapter → **Railway**
  - Add-ons → **Compiler**

- [x] **Step 2 — Cleanup, Header & product routes** 🧹

  Stripped the boilerplate, built the first component, and added the product routes.

  ```
  src/
  ├── components/
  │   └── Header.tsx       ← basic header component
  └── routes/
      ├── products.tsx     ← static route /products
      └── products.$id.tsx ← dynamic route /products/$id
  ```

  What was done:
  - 🗑️ Removed unused boilerplate code and placeholder files
  - 🏗️ Created a basic `Header` component
  - 🛣️ Added static route `/products`
  - 🔍 Added dynamic route `/products/$id`

- [x] **Step 3 — Add shadcn/ui on top of Tailwind** 🎨

  TanStack Start ships with Tailwind by default — we keep it and layer shadcn/ui on top for a proper component library foundation.

  Go to https://ui.shadcn.com/create?preset=bcj03CWG&template=start&base=base and configure to your requirements:
  - Template → **TanStack Start**
  - Base UI → **Base**
  - Enable **pointer** on buttons

  Then run the generated init command:

  ```bash
  npx shadcn@latest init --preset bcj03CWG --base base --template start --pointer
  ```

  Add the `card` component:

  ```bash
  npx shadcn@latest add card
  ```

  Finally, remove the auto-generated import from `src/styles.css` — it's no longer needed:

  ```css
  /* remove this line */
  @import "shadcn/tailwind.css";
  ```

- [x] **Step 4 — Base Header design** 🏠

  Styled the `Header` component and added the global layout wrapper in `__root.tsx`.

  In `src/routes/__root.tsx`, the `RootDocument` shell wraps the entire app with a background and constrains the content:

  What was done:
  - 🎨 Outer `div` sets full-height background and base text colors (light + dark mode)
  - 📐 `<main>` centers content with `mx-auto`, caps width at `max-w-6xl`, and adds horizontal (`px-4`) and vertical (`py-6`) padding

---

## Status

> **Phase 1 — In Progress** 🚧
