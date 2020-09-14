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
</script>

<Card>
	<CardImg src={styleData.screenshots.isMainArchived ? `${dataPrefix}screenshots/${styleData.screenshots.main}` : `https://userstyles.org/style_screenshots/${styleData.screenshots.main}`} />
	<CardBody>
		<h5 class="card-title">{styleData.info.name}</h5>
		{formatCategory(styleData.info.category)}
		<br /> Updated: {new Date(styleData.info.updatedAt).toLocaleString()}
		<br /> Weekly: {styleData.stats.installs.weekly}
		<br />
		<Button class="d-block w-100" on:click={onView(styleData.id)}>View</Button>
	</CardBody>
</Card>
