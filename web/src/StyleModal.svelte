<script>
	import { Modal } from "sveltestrap";
	import sanitize from "sanitize-html";

	function close() {
		isOpen = false;
	}

	export let styleId = "";
	export let dataPrefix = "";
	export let isOpen = false;

	let promise;

	let url = "";
	$: url = `${dataPrefix}styles/${styleId}.json`;

	let retry = false;

	let prevStyleId = "";
	$: if (url && dataPrefix && (prevStyleId !== styleId || retry)) {
		retry = false;
		promise = fetch(url)
			.then((res) => res.json())
			.then((r) => {
				prevStyleId = r.id;
				return r;
			});
	}

	function processModalDescription(html) {
		return sanitize(html).replace(/\r?\n/g, "<br>");
	}

	function doRetry() {
		retry = true;
	}
</script>

<!-- Not using sveltestrap elements because svelte node duplication bug. -->
<Modal {isOpen} toggle={close} size="lg">
	{#await promise}
		<div class="modal-header">
			<h3>Downloading data...</h3>
		</div>
		<div class="modal-footer"><button class="btn btn-primary" color="secondary" on:click={close}>Close</button></div>
	{:then style}
		<div class="modal-header">
			<h3>{style.info.name} ({style.id})</h3>
		</div>
		<div class="modal-body">
			{#if style.screenshots.main}
				{#if style.screenshots.isMainArchived}<img class="img-fluid rounded mb-3" src={`${dataPrefix}screenshots/${style.screenshots.main}`} alt="Screenshot" />{:else}<img class="img-fluid rounded mb-3" src={`https://userstyles.org/style_screenshots/${style.screenshots.main}`} alt="Screenshot" />{/if}
			{/if}
			<h5>Information</h5>
			<ul>
				<li>Installs this week: {style.stats.installs.weekly}</li>
				<li>Total installs: {style.stats.installs.total}</li>
				<li>Applies to: {style.info.category}</li>
				<li>License: {style.info.license}</li>
				{#if style.info.author}
					<li>Author: {style.info.author.name} ({style.info.author.id})</li>
				{/if}
			</ul>
			{#if style.info.description}
				<h5>Description</h5>
				{@html processModalDescription(style.info.description)}
			{/if}
			{#if style.info.additionalInfo}
				<h5>Notes from the last update</h5>
				{@html processModalDescription(style.info.additionalInfo)}
			{/if}
		</div>
		<div class="modal-footer"><a class="btn btn-primary" target="_blank" href={`https://userstyles.org/styles/${style.id}`}>UserStyles.org</a> <a class="btn btn-primary" target="_blank" href={`${dataPrefix}usercss/${style.id}.user.css`}>Install</a> <button class="btn btn-secondary" on:click={close}>Close</button></div>
	{:catch e}
		<div class="modal-header">
			<h3>Error while downloading data...</h3>
		</div>
		<div class="modal-body">{e}</div>
		<div class="modal-footer"><button class="btn btn-primary" on:click={doRetry}>Retry</button> <button class="btn btn-secondary" on:click={close}>Close</button></div>
	{/await}
</Modal>
