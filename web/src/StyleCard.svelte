<script>
	import { Card, CardImg, CardBody, Button } from "sveltestrap";
	import { createEventDispatcher } from "svelte";

	const dispatch = createEventDispatcher();

	export let styleData;
	export let dataPrefix;

	function capitalizeFirstLetter(string) {
		if (!string) return "";
		return string.charAt(0).toUpperCase() + string.slice(1);
	}

	function formatCategory(category) {
		if (category === "global_style") return "Global Style";
		return capitalizeFirstLetter(category);
	}

	function onView(styleId) {
		dispatch("view", { styleId });
	}

	function getScreenshotUrl(archived, name) {
		return (archived ? `${dataPrefix}screenshots/` : `https://userstyles.org/${name.includes("-") ? "auto_" : ""}style_screenshots/`) + name;
	}
</script>

<style>
	:global(.style-img) {
		max-height: 200px;
		object-fit: cover;
	}
</style>

<Card>
	{#if styleData.sn}
		<CardImg class="style-img" src={getScreenshotUrl(styleData.sa, styleData.sn)} />
	{/if}
	<CardBody>
		<h5 class="card-title">{styleData.n}</h5>
		{formatCategory(styleData.c)}
		<br />Updated:
		{new Date(styleData.u * 1000).toLocaleString()}
		<br />Weekly:
		{styleData.w}
		| Total:
		{styleData.t}
		<Button class="d-block w-100" on:click={onView(styleData.i)}>View</Button>
	</CardBody>
</Card>
