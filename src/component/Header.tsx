import { Link } from "@tanstack/react-router";

export default function Header() {
	return (
		<header className="p-4 flex items-center bg-gray-800 text-white shadow-2xl">
			<Link to="/">stackshop</Link>
		</header>
	);
}
