import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/products/create-product')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/products/create-product"!</div>
}
