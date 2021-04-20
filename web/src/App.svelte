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
		format: "",
	};
	let inputs = {
		search: "",
		category: "",
		author: "",
		format: "",
	};
	let pagination = {
		page: 1,
		totalPages: 1,
		perPage: 60,
	};

	const sortDropdownItems = [
		{ id: "weekly-installs", label: "Weekly Installs" },
		{ id: "total-installs", label: "Total Installs" },
		{ id: "rating", label: "Rating" },
		{ id: "updated", label: "Updated" },
		{ id: "newest", label: "Newest" },
	];

	const formatDropdownItems = [
		{ id: "", label: "Any" },
		{ id: "uso", label: "UserStyles.org" },
		{ id: "usercss", label: "UserCSS" },
	];

	let modalStyleId = "";
	let modalIsOpen = false;

	const defaultSorting = "weekly-installs";
	let sorting = defaultSorting;
	let sortDropdownOpen = false;
	function setSorting(val) {
		sorting = val;
	}

	let formatDropdownOpen = false;

	let query = new URLSearchParams(window.location.search);
	loadStateFromQuery(query);

	$: styles = sortStyles(styles, sorting);

	$: filteredStyles = filterStyles(styles, filters);

	$: paginatedStyles = paginateStyles(filteredStyles, pagination.page, pagination.perPage);

	$: pagination.totalPages = Math.ceil(filteredStyles.length / pagination.perPage);

	function paginateStyles(styles, page, perPage) {
		return styles.slice((page - 1) * perPage, page * perPage);
	}

	let scrollToTopEl = undefined;

	function scrollToTop() {
		console.log(scrollToTopEl);
		if (scrollToTopEl && scrollToTopEl.scrollIntoView) {
			scrollToTopEl.scrollIntoView(true);
		}
	}

	function sortStyles(styles, sorting) {
		switch (sorting) {
			case "weekly-installs":
				styles.sort((a, b) => b.w - a.w);
				break;
			case "total-installs":
				styles.sort((a, b) => b.t - a.t);
				break;
			case "rating":
				styles.sort((a, b) => (b.r || 1) - (a.r || 1));
				break;
			case "updated":
				styles.sort((a, b) => b.u - a.u);
				break;
			case "newest":
				styles.sort((a, b) => b.i - a.i);
				break;
		}
		return styles;
	}

	function filterStyles(styles, filters) {
		let filtered = [];
		const { search, category, author, format } = filters;
		if (search.trim().length > 0 || category.trim().length > 0 || author.trim().length > 0 || format !== "") {
			const rgx = search ? new RegExp(createFuzzySearchRegex(search), "i") : undefined;
			console.log(styles[0]);
			for (const style of styles) {
				if ((!rgx || rgx.test(style.n) || (style.d && rgx.test(style.d)) || style.i.toString() === search) && (!category || style.c === category) && (!author || style.an === author || (style.ai && style.ai.toString() === author)) && (!format || style.f === format)) {
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
		if (e.which === 13 || e.keyCode === 13 || e.key === "Enter") {
			update();
		}
	}

	function onView({ detail: { styleId } }) {
		modalStyleId = styleId.toString();
		modalIsOpen = true;
	}

	function onPopState(event) {
		query = new URLSearchParams(event.state);
		loadStateFromQuery(query);
	}

	function loadStateFromQuery(query) {
		sorting = query.get("sort") || defaultSorting;
		inputs.search = query.get("search") || "";
		inputs.category = query.get("category") || "";
		inputs.author = query.get("author") || "";
		inputs.format = query.get("format") || "";
		pagination.page = parseInt(query.get("page") || "1");
		const style = query.get("style") || "";
		if (modalStyleId !== style) modalStyleId = style;
		if (style && !modalIsOpen) modalIsOpen = true;
		else if (!style && modalIsOpen) modalIsOpen = false;
		filters = inputs;
	}

	function onModalPushState(e) {
		const { search, category, author, style, page, sort } = e.detail;
		if (e.detail) {
			if (search || category || author) {
				inputs.search = search || "";
				inputs.category = category || "";
				inputs.author = author || "";
				sorting = sort || defaultSorting;
				modalIsOpen = false;
				filters = inputs;
				pagination.page = parseInt(page || "1");
			} else {
				if (modalStyleId !== style) modalStyleId = style || "";
				if (style && !modalIsOpen) modalIsOpen = true;
				else if (!style && modalIsOpen) modalIsOpen = false;
			}
		}
		console.log(e);
	}

	$: updateQuery(filters, pagination, sorting, modalIsOpen, modalStyleId);

	function updateQuery(filters, pagination, sorting, modalIsOpen, modalStyleId) {
		const { search, category, author, format } = filters;
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
		if (query.get("format") || "" !== format) {
			updated = true;
			if (format) {
				query.set("format", format);
			} else {
				query.delete("format");
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
		if (query.get("sort") || defaultSorting !== sorting) {
			updated = true;
			if (sorting !== defaultSorting) {
				query.set("sort", sorting);
			} else {
				query.delete("sort");
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
		if ("?" + qs !== window.location.search && updated) history.pushState(query.toString(), "", "?" + qs);
	}

	let promise = fetch(`${dataPrefix}search-index.json`)
		.then((r) => r.json())
		.then((json) => {
			styles = json;
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
			<div class="kkcol col-12 col-sm-6 mb-1">
				<Input on:keypress={onKeyPress} readonly={false} type="search" placeholder="Category..." bind:value={inputs.category} />
			</div>
			<div class="kkcol col-12 col-sm-6 mb-1">
				<Input on:keypress={onKeyPress} readonly={false} type="search" placeholder="Author..." bind:value={inputs.author} />
			</div>
			<div class="kkcol col-12">
				<div class="kkrow row">
					<div class="kkcol col">
						<div class="dropdown w-100" class:show={sortDropdownOpen}>
							<button class="btn btn-secondary dropdown-toggle w-100" type="button" id="dropdownMenuButton" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false" on:click={() => (sortDropdownOpen = !sortDropdownOpen)}> Sort by </button>
							<div class="dropdown-menu" class:show={sortDropdownOpen} aria-labelledby="dropdownMenuButton" on:click={() => (sortDropdownOpen = false)}>
								{#each sortDropdownItems as item}<button class="dropdown-item" class:active={sorting === item.id} on:click={() => setSorting(item.id)}>{item.label}</button>{/each}
							</div>
						</div>
					</div>
					<div class="kkcol col">
						<div class="dropdown w-100" class:show={formatDropdownOpen}>
							<button class="btn btn-secondary dropdown-toggle w-100" type="button" id="dropdownMenuButton" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false" on:click={() => (formatDropdownOpen = !formatDropdownOpen)}> Type </button>
							<div class="dropdown-menu" class:show={formatDropdownOpen} aria-labelledby="dropdownMenuButton" on:click={() => (formatDropdownOpen = false)}>
								{#each formatDropdownItems as item}
									<button
										class="dropdown-item"
										class:active={filters.format === item.id}
										on:click={() => {
											filters.format = item.id;
											inputs.format = item.id;
										}}>{item.label}</button>
								{/each}
							</div>
						</div>
					</div>
					<div class="kkcol mb-1 col">
						<Button color="secondary" class="w-100" on:click={reset}>Reset</Button>
					</div>
					<div class="kkcol col">
						<Button color="primary" class="w-100" on:click={update}>Search</Button>
					</div>
				</div>
			</div>
		</div>
		<span bind:this={scrollToTopEl} />
		<Row>
			{#each paginatedStyles as style (style.i)}
				<Col xl="3" md="4" sm="6" xs="12" class="mb-4">
					<StyleCard on:view={onView} styleData={style} {dataPrefix} />
				</Col>
			{/each}
		</Row>
		<Row>
			<Col class="d-flex justify-content-center">
				<Pagination on:paginated={scrollToTop} bind:currentPage={pagination.page} totalPages={pagination.totalPages} />
			</Col>
		</Row>
	{:catch e}
		Error while downloading data {e}
	{/await}

	<StyleModal {dataPrefix} on:onPushState={onModalPushState} styleId={modalStyleId} bind:isOpen={modalIsOpen} />
</Container>
