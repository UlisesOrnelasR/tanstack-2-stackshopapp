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

## Architecture Overview

### Component Map

```
src/
├── routes/
│   ├── __root.tsx          ← Global shell (layout, fonts, scripts)
│   ├── index.tsx           ← / Home — loader + featured grid
│   └── products/
│       ├── index.tsx       ← /products — createServerFn + full catalog
│       └── $id.tsx         ← /products/$id — dynamic detail
├── components/
│   ├── Header.tsx          ← Top nav bar
│   └── ui/
│       └── ProductCard.tsx ← Reusable product card
└── db/
    └── seed.ts             ← Fake product catalog (8 items)
```

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
  - Removed unused boilerplate code and placeholder files
  - Created a basic `Header` component
  - Added static route `/products`
  - Added dynamic route `/products/$id`

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
  - Outer `div` sets full-height background and base text colors (light + dark mode)
  - `<main>` centers content with `mx-auto`, caps width at `max-w-6xl`, and adds horizontal (`px-4`) and vertical (`py-6`) padding

---

### Phase 2 — Data Layer & Product Display

- [x] **Step 1 — Fake product data & server loader** 🗄️

  Wired up the home page with real data flow using TanStack Router's `loader` — the closest thing to a server function in this stack.

  Created a local seed file to act as the fake data source (same shape as a real product API like `fakestoreapi.com`):

  ```
  src/
  └── db/
      └── seed.ts    ← sampleProducts array — fake catalog data
  ```

  The `loader` in `src/routes/index.tsx` runs on the server, grabs the first 3 products, and passes them to the component via `Route.useLoaderData()`:

  ```ts
  export const Route = createFileRoute("/")({
    loader: async () => {
      return { products: sampleProducts.slice(0, 3) };
    },
    component: App,
  });
  ```

  Each product has this shape:

  | Field         | Type      | Description                                         |
  | ------------- | --------- | --------------------------------------------------- |
  | `name`        | `string`  | Product name                                        |
  | `description` | `string`  | Short description                                   |
  | `price`       | `string`  | Price as a string (e.g. `"99.99"`)                  |
  | `badge`       | `string?` | Optional label shown as a pill (e.g. `"New"`)       |
  | `rating`      | `string`  | Star rating (e.g. `"4.8"`)                          |
  | `reviews`     | `number`  | Total review count                                  |
  | `image`       | `string`  | Path to the product image                           |
  | `inventory`   | `string`  | Status: `"in-stock"` · `"backorder"` · `"preorder"` |

  What was done:
  - Created `src/db/seed.ts` with 8 sample products
  - Added a `loader` to the index route — runs server-side before render
  - Consumed loader data in the component via `Route.useLoaderData()`
  - Sliced the first 3 products for the featured section on the home page

- [x] **Step 2 — ProductCard component** 🃏

  Built the base `ProductCard` component used to display individual products in the grid.

  ```
  src/
  └── components/
      └── ui/
          └── ProductCard.tsx    ← base product card component
  ```

  The card is wrapped in a `<Link>` to navigate to `/products/$id` and composes shadcn/ui primitives (`Card`, `CardHeader`, `CardContent`, `CardFooter`).

  Key design decisions:
  - Optional `badge` pill rendered conditionally (e.g. "New")
  - Rating + review count in the content area
  - Inventory status badge with color-coded styles:
    - `in-stock` → emerald
    - `backorder` → amber
    - `preorder` → indigo
  - "Add to Cart" button uses `e.preventDefault()` + `e.stopPropagation()` to prevent navigation while inside the `<Link>` wrapper

- [x] **Step 3 — Products catalog page** 🗂️

  Built the full `/products` catalog page that fetches and displays all products using a **server function** — a step up from the plain `loader` used on the home page.

  ```
  src/
  └── routes/
      └── products/
          └── index.tsx    ← /products catalog route
  ```

  Key differences from the home page `loader`:

  | Feature        | Home (`/`)      | Catalog (`/products`)   |
  | -------------- | --------------- | ----------------------- |
  | Data source    | inline `loader` | `createServerFn`        |
  | Products shown | 3 (sliced)      | All 8                   |
  | Layout         | featured grid   | header card + full grid |

  The `createServerFn` pattern isolates the data-fetching logic and makes it independently callable — it's not tied to the route lifecycle like a `loader`:

  ```ts
  const fetchProducts = createServerFn({ method: "GET" }).handler(async () => {
    return sampleProducts;
  });

  export const Route = createFileRoute("/products/")({
    loader: async () => fetchProducts(),
    component: RouteComponent,
  });
  ```

- [x] **Step 4 — Route Middleware** 🔍

  Added server-side middleware to the `/products` route using `createMiddleware` from `@tanstack/react-start`.

  **What is middleware here?**

  In TanStack Start, middleware runs on the server **before** the route handler executes. It intercepts the request, can inspect or modify it, and must call `next()` to pass control forward — same mental model as Express or Hono middleware.

  ```ts
  // src/routes/products/index.tsx

  const loggerMiddleware = createMiddleware().server(
    async ({ next, request }) => {
      console.log(
        "-----loggerMiddleware----",
        request.url, // full URL of the incoming request
        "from",
        request.headers.get("origin"), // where the request came from
      );
      return next(); // REQUIRED — without this the route never loads
    },
  );
  ```

  **How it's wired to the route:**

  The `server` config key on `createFileRoute` accepts a `middleware` array. Every entry runs in order before any loader or handler on that route:

  ```ts
  export const Route = createFileRoute("/products/")({
    loader: async () => fetchProducts(),
    component: RouteComponent,
    server: {
      middleware: [loggerMiddleware], // ← runs first, on every request to /products
      handlers: {
        POST: async ({ request }) => {
          // ← custom HTTP verb handlers
          const body = await request.json().catch(() => ({}));
          return Response.json({ message: "Hello from POST", body });
        },
      },
    },
  });
  ```

  | Key          | What it does                                                               |
  | ------------ | -------------------------------------------------------------------------- |
  | `middleware` | Array of middleware that intercept every request to this route             |
  | `handlers`   | Custom HTTP method handlers (`POST`, `PUT`, etc.) beyond the default `GET` |
  | `next()`     | Passes control to the next middleware or to the route itself — mandatory   |

- [x] **Step 5 — TanStack Query integration** ⚡

  Added `@tanstack/react-query` to enable client-side caching and background refetching on top of the existing server-fetched data.

  ```bash
  npm i @tanstack/react-query @tanstack/react-query-devtools
  ```

  **Why Query on top of loaders?**

  The `loader` already fetches on the server — but once the page is live, it does nothing. TanStack Query takes over on the client: it caches the data, can refetch in the background, and invalidates stale entries automatically. The `loader` becomes the "first paint" supplier; Query owns the lifecycle after that.

  ---

  **Change 1 — `createRootRouteWithContext`** in `src/routes/__root.tsx`

  Replaced `createRootRoute` with the typed context variant so every child route can access the `queryClient` with full type safety:

  ```ts
  // before
  export const Route = createRootRoute({ ... });

  // after
  export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({ ... });
  ```

  ---

  **Change 2 — `QueryClientProvider` wraps the app shell** in `src/routes/__root.tsx`

  Created a singleton `queryClient` and wrapped `RootDocument` so every component in the tree can call `useQuery`:

  ```ts
  const queryClient = new QueryClient();

  function RootDocument({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        ...
      </QueryClientProvider>
    );
  }
  ```

  ---

  **Change 3 — inject `queryClient` into the router context** in `src/router.tsx`

  Passed the client through the router's `context` option — this is what makes `context.queryClient` available inside any `loader`:

  ```ts
  const router = createTanStackRouter({
    routeTree,
    context: {
      queryClient: new QueryClient(),
    },
    ...
  });
  ```

  ---

  **Change 4 — `useQuery` with `initialData` in `/products`**

  The `loader` still runs on the server and returns the products. `useQuery` receives them via `initialData` — no duplicate network request on mount. After that, Query owns the cache:

  ```ts
  function RouteComponent() {
    const products = Route.useLoaderData();       // server data

    const { data } = useQuery({
      queryKey: ["products"],
      queryFn: () => fetchProducts(),
      initialData: products,                      // seed from loader, no extra fetch
    });
  }
  ```

  | Layer      | Runs on | Responsibility                              |
  | ---------- | ------- | ------------------------------------------- |
  | `loader`   | Server  | First fetch — data ready before first paint |
  | `useQuery` | Client  | Cache, background refetch, stale management |

  ---

  **Change 5 — React Query Devtools** in `src/routes/__root.tsx`

  Added the devtools panel so you can inspect the query cache, stale times, and refetch behavior directly in the browser:

  ```ts
  import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

  function RootDocument({ children }) {
    return (
      <QueryClientProvider client={queryClient}>
        ...
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    );
  }
  ```

  `initialIsOpen={false}` keeps it collapsed by default — click the React Query logo in the corner to open it.

  ---

  **Selective Server-Side Rendering (SSR)**

  TanStack Start lets you control how much of the rendering happens on the server, per route:

  | Mode          | HTML on server | Data on server | Use when                                      |
  | ------------- | -------------- | -------------- | --------------------------------------------- |
  | `ssr: true`   | ✅ Full HTML   | ✅ Yes         | SEO-critical pages, fast first paint needed   |
  | `"data-only"` | ❌ Empty shell | ✅ Yes         | Data ready but HTML rendered on client        |
  | `ssr: false`  | ❌ Nothing     | ❌ No          | Fully client-side, behind auth, no SEO needed |

  "Selective" means you don't pick one mode for the whole app — each route decides independently. A public `/products` page can run full SSR while a `/dashboard` behind a login runs `ssr: false`.

---

## Status

> **Phase 2 — working...**
