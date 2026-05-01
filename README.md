# StackShop 🛒

---

## What is this?

**StackShop** is a base project designed to serve as the foundation for any future e-commerce.

---

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

  ***

  **Change 1 — `createRootRouteWithContext`** in `src/routes/__root.tsx`

  Replaced `createRootRoute` with the typed context variant so every child route can access the `queryClient` with full type safety:

  ```ts
  // before
  export const Route = createRootRoute({ ... });

  // after
  export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({ ... });
  ```

  ***

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

  ***

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

  ***

  **Change 4 — `useQuery` with `initialData` in `/products`**

  The `loader` still runs on the server and returns the products. `useQuery` receives them via `initialData` — no duplicate network request on mount. After that, Query owns the cache:

  ```ts
  function RouteComponent() {
    const products = Route.useLoaderData(); // server data

    const { data } = useQuery({
      queryKey: ["products"],
      queryFn: () => fetchProducts(),
      initialData: products, // seed from loader, no extra fetch
    });
  }
  ```

  | Layer      | Runs on | Responsibility                              |
  | ---------- | ------- | ------------------------------------------- |
  | `loader`   | Server  | First fetch — data ready before first paint |
  | `useQuery` | Client  | Cache, background refetch, stale management |

  ***

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

  ***

  **Selective Server-Side Rendering (SSR)**

  TanStack Start lets you control how much of the rendering happens on the server, per route:

  | Mode          | HTML on server | Data on server | Use when                                      |
  | ------------- | -------------- | -------------- | --------------------------------------------- |
  | `ssr: true`   | ✅ Full HTML   | ✅ Yes         | SEO-critical pages, fast first paint needed   |
  | `"data-only"` | ❌ Empty shell | ✅ Yes         | Data ready but HTML rendered on client        |
  | `ssr: false`  | ❌ Nothing     | ❌ No          | Fully client-side, behind auth, no SEO needed |

  "Selective" means you don't pick one mode for the whole app — each route decides independently. A public `/products` page can run full SSR while a `/dashboard` behind a login runs `ssr: false`.

---

### Phase 3 — Database Setup with Drizzle + Supabase

- [x] **Step 1 — Install dependencies** 📦

  ```bash
  npm i drizzle-orm postgres pg
  npm i -D drizzle-kit
  npm i --save-dev @types/pg
  npm i drizzle-orm dotenv
  npm i -D drizzle-kit tsx
  ```

  | Package       | Role                                             |
  | ------------- | ------------------------------------------------ |
  | `drizzle-orm` | The ORM — type-safe query builder                |
  | `postgres`    | Native PostgreSQL driver (used by Drizzle)       |
  | `pg`          | Node.js PostgreSQL driver (for the Pool client)  |
  | `dotenv`      | Load `.env` vars before running scripts          |
  | `drizzle-kit` | CLI for migrations, codegen, and Drizzle Studio  |
  | `tsx`         | Run TypeScript files directly (used for seeding) |
  | `@types/pg`   | Type definitions for the `pg` driver             |
  | `cross-env`   | Set env variables cross-platform (Win/Mac/Linux) |

- [x] **Step 2 — Create a Supabase project** ☁️
  1. Go to [supabase.com](https://supabase.com) and create a new project
  2. Once created, navigate to **Project Settings → Database**
  3. Under **Connection string**, select **Session pooler** mode and copy the URI:

  ```
  postgresql://postgres.<project-ref>:[YOUR-PASSWORD]@aws-1-us-west-2.pooler.supabase.com:5432/postgres
  ```

  Session pooler works over port `5432` — no firewall issues and compatible with Drizzle's `pg` driver.

- [x] **Step 3 — Configure `.env`** 🔐

  Create a `.env` file at the project root and paste the connection string, replacing `[YOUR-PASSWORD]`:

  ```env
  DATABASE_URL="postgresql://postgres.fceondpyuqyitudbtnuw:<yourpassword>@aws-1-us-west-2.pooler.supabase.com:5432/postgres"
  ```

- [x] **Step 4 — Database client** `src/db/index.ts`

  The client creates a connection pool and exports a typed `db` instance wired to the schema:

  ```ts
  import { drizzle } from "drizzle-orm/node-postgres";
  import { Pool } from "pg";
  import * as schema from "./schema";

  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes("supabase")
      ? { rejectUnauthorized: false }
      : false,
  });

  export const db = drizzle(pool, { schema });
  ```

  The `ssl` block is conditional — it enables SSL only when connecting to Supabase, so local development without SSL still works.

- [x] **Step 5 — Define the schema** `src/db/schema.ts`

  Two tables: `products` (the catalog) and `cart_items` (shopping cart). Both use UUID primary keys and Drizzle enums for constrained string fields.

  ```ts
  import {
    integer,
    numeric,
    pgEnum,
    pgTable,
    text,
    timestamp,
    uuid,
    varchar,
  } from "drizzle-orm/pg-core";

  export const badgeEnum = pgEnum("badge", [
    "New",
    "Sale",
    "Featured",
    "Limited",
  ]);
  export const inventoryEnum = pgEnum("inventory", [
    "in-stock",
    "backorder",
    "preorder",
  ]);

  export const products = pgTable("products", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 256 }).notNull(),
    description: text("description").notNull(),
    price: numeric("price", { precision: 10, scale: 2 }).notNull(),
    badge: badgeEnum("badge"),
    rating: numeric("rating", { precision: 3, scale: 2 })
      .notNull()
      .default("0"),
    reviews: integer("reviews").notNull().default(0),
    image: varchar("image", { length: 512 }).notNull(),
    inventory: inventoryEnum("inventory").notNull().default("in-stock"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  });

  export const cartItems = pgTable("cart_items", {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    quantity: integer("quantity").notNull().default(1),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  });

  // Inferred types — use these everywhere instead of manual interfaces
  export type ProductSelect = typeof products.$inferSelect;
  export type ProductInsert = typeof products.$inferInsert;
  export type CartItemSelect = typeof cartItems.$inferSelect &
    typeof products.$inferSelect;
  export type CartItemInsert = typeof cartItems.$inferInsert;
  ```

  `$inferSelect` and `$inferInsert` let Drizzle derive the TypeScript types directly from the schema — no duplication.

- [x] **Step 6 — Drizzle config** `drizzle.config.ts`

  ```ts
  import "dotenv/config";
  import { defineConfig } from "drizzle-kit";

  export default defineConfig({
    out: "./drizzle",
    schema: "./src/db/schema.ts",
    dialect: "postgresql",
    dbCredentials: {
      url: process.env.DATABASE_URL!,
    },
  });
  ```

  | Field     | Purpose                                           |
  | --------- | ------------------------------------------------- |
  | `out`     | Where Drizzle writes migration SQL files          |
  | `schema`  | Source of truth — your schema definition          |
  | `dialect` | Database engine (`postgresql`, `mysql`, `sqlite`) |

- [x] **Step 7 — Add scripts to `package.json`** ⚙️

  ```json
  "scripts": {
    "db:generate": "drizzle-kit generate",
    "db:migrate":  "drizzle-kit migrate",
    "db:push":     "drizzle-kit push",
    "db:studio":   "drizzle-kit studio",
    "db:seed":     "cross-env NODE_ENV=production NITRO_PRESET=node-server tsx src/db/seedDb.ts"
  }
  ```

  | Script        | What it does                                              |
  | ------------- | --------------------------------------------------------- |
  | `db:generate` | Reads the schema and generates SQL migration files        |
  | `db:migrate`  | Applies pending migration files to the database           |
  | `db:push`     | Pushes the schema directly — no migration files generated |
  | `db:studio`   | Opens Drizzle Studio (visual DB browser)                  |
  | `db:seed`     | Populates the database with sample products               |

  > In production use `generate` + `migrate` for a proper migration history. `push` is fast for prototyping — it diffs and applies directly.

- [x] **Step 8 — Generate and push the schema** 🚀

  Generate the SQL migration files from your schema:

  ```bash
  npm run db:generate
  ```

  This writes files to `./drizzle/`. Then push the schema to Supabase:

  ```bash
  npm run db:push
  ```

  Once done, open your Supabase project → **Table Editor** — the `products` and `cart_items` tables are there.

- [x] **Step 9 — Seed the database** 🌱

  `src/db/seedDb.ts` inserts 8 sample products. It checks for existing rows before inserting — pass `--reset` to wipe and reseed.

  **Why not just run `tsx src/db/seedDb.ts` directly?**

  TanStack Start uses **Nitro** as its internal server engine. When you import the DB client (`src/db/index.ts`) inside a standalone script, Nitro detects the environment and tries to boot its full server runtime — which fails outside of the framework's normal startup process.

  The fix is to set two environment variables before the script runs:

  | Variable              | Value           | Effect                                                     |
  | --------------------- | --------------- | ---------------------------------------------------------- |
  | `NODE_ENV`            | `production`    | Disables dev-mode behavior (HMR, Vite watchers, etc.)      |
  | `NITRO_PRESET`        | `node-server`   | Tells Nitro to use the plain Node.js adapter — no full boot |

  These are set at the very top of `seedDb.ts` as well, as a safety net:

  ```ts
  // Prevent Nitro/vite from initializing when running as a standalone script
  process.env.NITRO_PRESET = "node-server";
  process.env.NODE_ENV = process.env.NODE_ENV || "production";
  ```

  **`cross-env`** is also needed because the `VAR=value command` syntax for setting env vars only works on Mac/Linux. On Windows it fails silently. `cross-env` makes it work everywhere with the same syntax.

  Run the seed:

  ```bash
  npm run db:seed
  ```

  Output:

  ```
  🌱 Starting database seed...
  📦 Inserting sample products...
  ✅ Products inserted successfully!
  ```

  Run with reset flag to clear and repopulate:

  ```bash
  npm run db:seed -- --reset
  ```

---

### Phase 4 — Real Data Layer

- [x] **Step 1 — Install Zod** 📦

  ```bash
  npm install zod
  ```

  Zod is a TypeScript-first schema validation library. It validates data at **runtime** — something TypeScript alone can't do (types disappear after compile). We use it here to validate the `id` received by `getProductById` before it reaches the database.

- [x] **Step 2 — Create `src/data/products.ts`** 🗄️

  Instead of writing `createServerFn` directly inside each route file, all server functions live in a dedicated data layer:

  ```
  src/
  └── data/
      └── products.ts    ← all server functions for the products domain
  ```

  This file exports three functions:

  ```ts
  import { createServerFn } from "@tanstack/react-start";
  import { eq } from "drizzle-orm";
  import { z } from "zod";
  import { db } from "@/db";
  import { products } from "@/db/schema";

  // Fetches every product — used in /products
  export const getAllProducts = createServerFn({ method: "GET" }).handler(
    async () => {
      const allProducts = await db.select().from(products);
      return allProducts;
    },
  );

  // Fetches the first 3 — used on the home page
  export const getRecommendedProducts = createServerFn({ method: "GET" }).handler(
    async () => {
      const recommendedProducts = await db.select().from(products).limit(3);
      return recommendedProducts;
    },
  );

  // Fetches a single product by id — used in /products/$id
  const idSchema = z.string();

  export const getProductById = createServerFn({ method: "GET" })
    .inputValidator((id: string) => id)
    .handler(async ({ data }) => {
      const id = idSchema.parse(data); // runtime validation with Zod
      const product = await db
        .select()
        .from(products)
        .where(eq(products.id, id))
        .limit(1);
      return product[0] ?? null;
    });
  ```

  **Why server functions live in `data/` and not inside the route files**

  `createServerFn` creates an HTTP endpoint that runs exclusively on the server. The function can be called from anywhere — a loader, a form action, another server function. If you write it inline in a route file, it's trapped there. Moving it to `data/products.ts` means:

  - `getRecommendedProducts` can be called from the home loader
  - `getAllProducts` can be called from the products loader AND from a `useQuery` on the client
  - `getProductById` can be called from the detail page loader

  Routes handle routing and rendering. The data layer handles data access. That separation is what makes the code reusable and easy to test.

  | Function                | Called from                         | Returns         |
  | ----------------------- | ----------------------------------- | --------------- |
  | `getAllProducts`         | `/products` loader + `useQuery`     | All products    |
  | `getRecommendedProducts`| `/` loader                          | First 3 products|
  | `getProductById`        | `/products/$id` loader              | Single product or `null` |

- [x] **Step 3 — Wire routes to the data layer** 🔌

  Each route now just imports and calls the right function. No data logic in the route:

  **`src/routes/index.tsx`** — home page:
  ```ts
  import { getRecommendedProducts } from "@/data/products";

  export const Route = createFileRoute("/")({
    loader: async () => getRecommendedProducts(),
    component: App,
  });
  ```

  **`src/routes/products/index.tsx`** — catalog:
  ```ts
  import { getAllProducts } from "#/data/products";

  export const Route = createFileRoute("/products/")({
    loader: async () => getAllProducts(),
    component: RouteComponent,
  });

  function RouteComponent() {
    const products = Route.useLoaderData();
    const { data } = useQuery({
      queryKey: ["products"],
      queryFn: () => getAllProducts(), // client-side cache
      initialData: products,
    });
  }
  ```

  **`src/routes/products/$id.tsx`** — product detail:
  ```ts
  import { getProductById } from "#/data/products";

  export const Route = createFileRoute("/products/$id")({
    loader: async ({ params }) => getProductById({ data: params.id }),
    component: RouteComponent,
  });
  ```

  The `params.id` from the URL is passed as `data` — which is the input that `.inputValidator()` receives, and Zod validates before the handler runs.

---

## Status

> **Phase 4 — complete ✅**
