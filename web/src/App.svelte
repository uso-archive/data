<script>
	import { Navbar, Row, Col, Container, Spinner, Input, Button } from "sveltestrap";
	import StyleCard from "./StyleCard.svelte";
	import Pagination from "./Pagionation.svelte";
	import StyleModal from "./StyleModal.svelte";

	const dataPrefix = "https://raw.githubusercontent.com/33kk/uso-archive/flomaster/data/";

	let styles = [];
	let filteredStyles = [];
	let paginatedStyles = [];

	let filters = {
		search: "",
		category: "",
		author: "",
	};
	let inputs = {
		search: "",
		category: "",
		author: "",
	};
	let pagination = {
		page: 1,
		totalPages: 1,
		perPage: 20,
	};

	let modalStyleId = "";
	let modalIsOpen = false;

	let query = new URLSearchParams(window.location.search);
	loadStateFromQuery();

	$: pagination.totalPages = Math.ceil(filteredStyles.length / pagination.perPage);

	$: paginatedStyles = paginateStyles(filteredStyles, pagination.page, pagination.perPage);

	$: filteredStyles = filterStyles(styles, filters);

	function paginateStyles(styles, page, perPage) {
		return styles.slice((page - 1) * perPage, page * perPage);
	}

	function filterStyles(styles, filters) {
		let filtered = [];
		const { search, category, author } = filters;
		if (search.trim().length > 0 || category.trim().length > 0 || author.trim().length > 0) {
			const rgx = search ? new RegExp(createFuzzySearchRegex(search), "i") : undefined;
			for (const style of styles) {
				if ((!rgx || rgx.test(style.info.name) || rgx.test(style.info.description) || style.id.toString() === search) && (!category || style.info.category === category) && (!author || (style.info.author && style.info.author.name === author))) {
					filtered.push(style);
				}
			}
		} else filtered = styles;
		return filtered;
	}

	function createFuzzySearchRegex(searchText) {
		searchText = searchText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
		let words = searchText.split(" ");
		let result = "";
		for (const word of words) {
			let wordResult = "";
			const chars = word.split("");
			for (const char of chars) {
				wordResult += char + ".?";
			}
			wordResult = wordResult.slice(0, wordResult.length - 2);
			result += wordResult + ".*?";
		}
		result = result.slice(0, result.length - 3);
		return result;
	}

	function update() {
		pagination.page = 1;
		filters = inputs;
	}

	function reset() {
		pagination.page = 1;
		inputs = {
			search: "",
			category: "",
			author: "",
		};
		filters = inputs;
	}

	function onKeyPress(e) {
		if (e.which === 13 || e.keyCode === 13 || event.key === "Enter") {
			update();
		}
	}

	function onView({ detail: { styleId } }) {
		modalStyleId = styleId.toString();
		modalIsOpen = true;
	}

	function onPopState(event) {
		query = new URLSearchParams(event.state);
		loadStateFromQuery();
	}

	function loadStateFromQuery() {
		inputs.search = query.get("search") || "";
		inputs.category = query.get("category") || "";
		inputs.author = query.get("author") || "";
		pagination.page = parseInt(query.get("page") || "1");
		const style = query.get("style") || "";
		if (modalStyleId !== style) modalStyleId = style;
		if (style && !modalIsOpen) modalIsOpen = true;
		else if (!style && modalIsOpen) modalIsOpen = false;
		filters = inputs;
	}

	$: updateQuery(filters, pagination, modalIsOpen, modalStyleId);

	function updateQuery(filters, pagination) {
		const { search, category, author } = filters;
		const { page } = pagination;
		let updated = false;
		if (query.get("search") || "" !== search) {
			updated = true;
			if (search) {
				query.set("search", search);
			} else {
				query.delete("search");
			}
		}
		if (query.get("category") || "" !== category) {
			updated = true;
			if (category) {
				query.set("category", category);
			} else {
				query.delete("category");
			}
		}
		if (query.get("author") || "" !== author) {
			updated = true;
			if (author) {
				query.set("author", author);
			} else {
				query.delete("author");
			}
		}
		if (query.get("page") || "1" !== page.toString()) {
			updated = true;
			if (page !== 1) {
				query.set("page", parseInt(page));
			} else {
				query.delete("page");
			}
		}
		if (query.get("style") || "" !== modalStyleId.toString()) {
			updated = true;
			if (modalIsOpen) {
				query.set("style", modalStyleId.toString());
			} else {
				query.delete("style");
			}
		}
		const qs = query.toString();
		if ("?" + qs !== window.location.search && updated);
		history.pushState(query.toString(), "", "?" + qs);
	}

	let promise = fetch(`${dataPrefix}search-index.json`)
		.then((r) => r.json())
		.then((json) => {
			styles = json;
			filteredStyles = filterStyles(styles, filters);
		});
</script>

<style>
	.kkrow {
		margin-left: -5px !important;
		margin-right: -5px !important;
	}
	.kkcol {
		padding-left: 5px !important;
		padding-right: 5px !important;
	}
</style>

<svelte:window on:popstate={onPopState} />
<Navbar color="primary" dark expand="md" class="mb-3"><a on:click|preventDefault={reset} href="/" class="navbar-brand">UserStyles.org Archive</a></Navbar>
<Container>
	{#await promise}
		<Row class="justify-content-center">
			<Spinner color="primary" class="mx-auto" />
		</Row>
	{:then}
		<div class="kkrow mb-3 row">
			<div class="kkcol col-12 mb-1">
				<Input on:keypress={onKeyPress} readonly={false} type="search" placeholder="Search for styles..." bind:value={inputs.search} />
			</div>
			<div class="kkcol col-12 col-sm-6 col-lg-5 mb-1">
				<Input on:keypress={onKeyPress} readonly={false} type="search" placeholder="Category..." bind:value={inputs.category} />
			</div>
			<div class="kkcol col-12 col-sm-6 col-lg-5 mb-1">
				<Input on:keypress={onKeyPress} readonly={false} type="search" placeholder="Author..." bind:value={inputs.author} />
			</div>
			<div class="kkcol mb-1 col-12 col-sm-6 col-lg-1">
				<Button color="secondary" class="w-100" on:click={reset}>Reset</Button>
			</div>
			<div class="kkcol col-12 col-sm-6 col-lg-1">
				<Button color="primary" class="w-100" on:click={update}>Search</Button>
			</div>
		</div>
		<Row>
			{#each paginatedStyles as style (style.id)}
				<Col xl="3" md="4" sm="6" xs="12" class="mb-4">
					<StyleCard on:view={onView} styleData={style} {dataPrefix} />
				</Col>
			{/each}
		</Row>
		<Row>
			<Col class="d-flex justify-content-center">
				<Pagination bind:currentPage={pagination.page} totalPages={pagination.totalPages} />
			</Col>
		</Row>
	{:catch e}
		Error while downloading data {e}
	{/await}

	<StyleModal {dataPrefix} styleId={modalStyleId} bind:isOpen={modalIsOpen} />
</Container>
