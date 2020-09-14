import App from "./App.svelte";
import "../node_modules/bootstrap/dist/css/bootstrap.min.css";

const app = new App({
	target: document.body,
});

export default app;

// recreate the whole app if an HMR update touches this module
if (import.meta.hot) {
	import.meta.hot.dispose(() => {
		app.$destroy();
	});
	import.meta.hot.accept();
}
