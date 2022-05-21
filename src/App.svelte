<script>
	import { Router, Route, Link } from "svelte-navigator";
	import Open from "./pages/Open.svelte";
	import Info from "./pages/Info.svelte";
</script>

<Router>
	<main>

		<Route path="open">
			<Open/>
		</Route>

		<Route path="info">
			<Info/>
		</Route>

		<Route path="/">
			<h3>PopupJS</h3>
	
			<p>
				PopupJS can be used to load scripts into sites from foreign domains via DevTools.
				Go <a href="/open">here</a> to learn how to use it.
			</p>
		</Route>

	</main>
</Router>

<style>
	main {
		width: auto;
		height: 100vh;

		display: flex;
		align-items: center;
		justify-content: center;
		flex-wrap: wrap;
		flex-direction: column;
	}
</style>