import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "#/components/ui/button";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
	return (
		<div>
			main page
			<Link to="/products">
				<Button>Products</Button>
			</Link>
		</div>
	);
}
