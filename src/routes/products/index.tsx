import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/products/")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<div>
			Hello "/products/"!
			<hr />
			<br />
			<Link to="/products/$id" params={{ id: "1" }}>
				products 1
			</Link>
			<Link to="/products/$id" params={{ id: "2" }}>
				products 2
			</Link>
			<Link to="/products/$id" params={{ id: "3" }}>
				products 3
			</Link>
		</div>
	);
}
