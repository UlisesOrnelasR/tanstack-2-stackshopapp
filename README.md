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

---

## Status

> **Phase 1 — In Progress** 🚧
