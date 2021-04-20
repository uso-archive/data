<script>
	import { Modal } from "sveltestrap";
	import DOMPurify from "dompurify";
	import linkifyHtml from "linkifyjs/html";
	import { createEventDispatcher } from "svelte";

	const dispatch = createEventDispatcher();

	function close() {
		isOpen = false;
	}

	export let styleId = "";
	export let dataPrefix = "";
	export let isOpen = false;

	let promise;

	let url = "";
	$: url = `${dataPrefix}styles/${styleId}.json`;

	const base = window.location.origin + window.location.pathname + "?";

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

	function replaceUrls(base, str) {
		const regex = /https?:\/\/userstyles\.org\/[^\s"]+/;
		let m;

		while ((m = regex.exec(str)) !== null) {
			str = str.slice(0, m.index) + (convertUsoUrl(base, m[0]) || "*uso link*") + str.slice(m.index + m[0].length);
		}

		return str;
	}

	function convertUsoUrl(base, url) {
		const pUrl = new URL(url);
		const path = trim(pUrl.pathname, "/").split("/");
		const query = pUrl.search ? new URLSearchParams(trim(pUrl.search, "?")) : null;
		let page = undefined;
		let search = undefined;
		if (query) {
			page = query.get("page") || undefined;
		}
		if (query) {
			search = query.get("search_terms") || undefined;
		}
		if (path[0] === "styles" && path[1] === "browse") {
			const category = path[2] || "";
			return createUrl(base, category, search, null, null, page);
		} else if (path[0] === "styles") {
			const style = path[1];
			return createUrl(base, null, null, style, null, null);
		} else if (path[0] === "users") {
			const user = path[1];
			return createUrl(base, null, search, null, user, page);
		} else if (path[0] === "style_screenshots") {
			return dataPrefix + "screenshots/" + path[1];
		}
	}

	function createUrl(base, category, search, style, user, page) {
		let params = new URLSearchParams();
		if (category) {
			if (["most-popular", "newest", "recently-updated"].includes(category)) {
				params.set("sort", category);
			} else {
				params.set("category", category);
			}
		} else if (search) {
			params.set("search", search);
		} else if (style) {
			params.set("style", style);
		} else if (user) {
			params.set("author", user);
		}
		if (page) {
			params.set("page", page);
		}
		return base + params.toString();
	}

	function trim(str, char) {
		return str.slice(str[0] === char ? 1 : 0, str[str.length] === char ? str.length - 1 : str.length);
	}

	function htmlToTemplate(html) {
		let temp = document.createElement("template");
		html = html.trim(); // Never return a space text node as a result
		temp.innerHTML = html;
		return temp;
	}

	function processModalDescription(html) {
		const sanitized = DOMPurify.sanitize(linkifyHtml(replaceUrls(base, html).replace(/\r?\n/g, "<br>"), { target: "_blank", defaultProtocol: "https" }));
		const template = htmlToTemplate(sanitized);

		webIsAwful(template.content);

		function webIsAwful(node) {
			for (const child of node.children) {
				if (child.nodeName === "A") {
					child.target = "_blank";
				}
				if (child.children && child.children.length > 0) {
					webIsAwful(child);
				}
			}
		}

		return template.innerHTML;
	}

	function onDescriptionClick(e) {
		let target = e.target;
		for (let i = 0; i < 5; i++) {
			if (target.href) {
				break;
			} else {
				if (target.parentNode) {
					target = target.parentNode;
				}
			}
		}
		if (target && target.href && target.href.startsWith(window.location.origin + window.location.pathname + "?")) {
			e.preventDefault();
			const query = new URLSearchParams(target.href.split("?", 2)[1]);
			const qObj = {
				category: query.get("category") || undefined,
				search: query.get("search") || undefined,
				style: query.get("style") || undefined,
				author: query.get("author") || undefined,
				page: query.get("page") || undefined,
			};
			dispatch("onPushState", qObj);
		}
	}

	function getScreenshotUrl(screenshot) {
		return (screenshot.archived ? `${dataPrefix}screenshots/` : `https://userstyles.org/${screenshot.name.includes("-") ? "auto_" : ""}style_screenshots/`) + screenshot.name;
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
			{#if style.screenshots && style.screenshots.main}<a href={getScreenshotUrl(style.screenshots.main)} target="_blank"> <img class="img-fluid rounded" src={getScreenshotUrl(style.screenshots.main)} alt="Screenshot" /> </a>{/if}
			{#if style.screenshots && style.screenshots.additional}
				{#each style.screenshots.additional as screenshot}<a href={getScreenshotUrl(screenshot)} target="_blank"><img class="img-fluid rounded mt-1" src={getScreenshotUrl(screenshot)} alt="Screenshot" /> </a>{/each}
			{/if}
			<h5 class="mt-3">Information</h5>
			<ul>
				{#if style.stats.rating}
					<li>Rating: {style.stats.rating}</li>
				{/if}
				<li>Applies to: <a on:click={onDescriptionClick} href={window.location.origin + window.location.pathname + '?category=' + style.info.category}>{style.info.category}</a></li>
				{#if style.info.author}
					<li>Author: <a on:click={onDescriptionClick} href={window.location.origin + window.location.pathname + '?author=' + style.info.author.name}>{style.info.author.name} ({style.info.author.id})</a></li>
				{/if}
				<li>License: {style.info.license}</li>
				<li>Updated at: {new Date(style.info.updatedAt).toLocaleString()}</li>
				{#if style.info.createdAt}
					<li>Created at: {new Date(style.info.createdAt).toLocaleString()}</li>
				{/if}
				<li>Installs this week: {style.stats.installs.weekly}</li>
				<li>Total installs: {style.stats.installs.total}</li>
			</ul>
			{#if style.info.description}
				<h5 class="mt-3">Description</h5>
				<div on:click={onDescriptionClick}>
					{@html processModalDescription(style.info.description)}
				</div>
			{/if}
			{#if style.info.additionalInfo}
				<h5 class="mt-3">Notes from the last update</h5>
				<div on:click={onDescriptionClick}>
					{@html processModalDescription(style.info.additionalInfo)}
				</div>
			{/if}
			<h5 class="mt-3">Other</h5>
			<ul>
				{#if style.info.format === 'uso'}
					<li><a target="_blank" href={`${dataPrefix}usercss/${style.id}.user.css`}>UserCSS</a></li>
				{/if}
				<li><a target="_blank" href={`${dataPrefix}styles/${style.id}.json`}>JSON</a></li>
				<!--<li><a target="_blank" href={`${dataPrefix}markdown/${style.id}.md`}>Markdown</a></li>-->
			</ul>
		</div>
		<div class="modal-footer">
			<a class="btn btn-primary" target="_blank" href={`https://userstyles.org/styles/${style.id}`}>UserStyles.org</a>
			{#if style.info.format === 'uso'}<a class="btn btn-primary" target="_blank" href={`${dataPrefix}usercss/${style.id}.user.css`}>Install</a>{/if}
			<button class="btn btn-secondary" on:click={close}>Close</button>
		</div>
	{:catch e}
		<div class="modal-header">
			<h3>Error while downloading data...</h3>
		</div>
		<div class="modal-body">{e}</div>
		<div class="modal-footer"><button class="btn btn-primary" on:click={doRetry}>Retry</button> <button class="btn btn-secondary" on:click={close}>Close</button></div>
	{/await}
</Modal>
