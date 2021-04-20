<script>
	import { PaginationItem } from "sveltestrap";
	import { createEventDispatcher } from "svelte";
	const dispatch = createEventDispatcher();

	let paginationArray = [];

	export let currentPage = 1;
	export let totalPages = 10;

	function paginate(page) {
		if (page > totalPages) page = totalPages;
		if (page <= 0) page = 1;
		currentPage = page;

		dispatch("paginated", {
			page,
		});
	}

	$: update(currentPage, totalPages);

	function update(page, totalPages) {
		if (page > totalPages) page = totalPages;
		if (page <= 0) page = 1;
		paginationArray = createPaginationArray(page, totalPages);
	}

	function createPaginationArray(page, totalPages) {
		let from = page - 2;
		if (from <= 0) from = 1;

		let to = page + 5 - (page - from);
		if (to > totalPages) to = totalPages;

		from = page - 5 - (page - to);

		if (from <= 0) from = 1;
		if (to > totalPages) to = totalPages;

		let array = [];
		for (let i = from; i <= to; i++) {
			array.push({
				active: page === i,
				page: i,
			});
		}
		return array;
	}
</script>

<nav aria-label="pagination">
	<ul class="pagination flex-wrap">
		<PaginationItem><button on:click={() => paginate(1)} class="page-link"> <span aria-hidden="true">«</span> <span class="sr-only">First</span> </button></PaginationItem>
		<PaginationItem><button on:click={() => paginate(currentPage - 1)} class="page-link"> <span aria-hidden="true">‹</span> <span class="sr-only">Previous</span> </button></PaginationItem>
		{#each paginationArray as paginationItem}
			<PaginationItem active={paginationItem.active}><button on:click={() => paginate(paginationItem.page)} class="page-link">{paginationItem.page}</button></PaginationItem>
		{/each}
		<PaginationItem><button on:click={() => paginate(currentPage + 1)} class="page-link"> <span aria-hidden="true">›</span> <span class="sr-only">Next</span> </button></PaginationItem>
		<PaginationItem><button on:click={() => paginate(totalPages)} class="page-link"> <span aria-hidden="true">»</span> <span class="sr-only">Last</span> </button></PaginationItem>
	</ul>
</nav>
