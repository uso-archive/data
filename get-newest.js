const fs = require("fs").promises;
const path = require("path");
const performance = require("perf_hooks").performance;
const uso = require("./lib/uso");
const utils = require("./lib/utils");

async function main() {
	// Get list of downloaded pages
	const downloadedPages = await fs.readdir(path.resolve(__dirname, "data", "uso-pages"));

	let stop = false;
	let startedPages = 0;

	const maxPagesInParralel = 50;

	for (let page = 1; !stop; page++) {
		// Only run X downloads at same time
		for (;;) {
			if (startedPages >= maxPagesInParralel) await utils.sleep(5);
			else break;
		}
		// Start downloading page
		(async () => {
			// Increment started page counter
			startedPages++;
			// Check if page isnt older than previous update
			if (downloadedPages.includes(`${page}.json`)) {
				console.log(`[Page: ${page}] Already downloaded`);
				startedPages--;
				return;
			}
			// Logging
			console.log(`[Page: ${page}] Downloading...`);
			const p1 = performance.now();
			// Download page data, retry on error
			let errors = 0;
			let pageData = undefined;
			for (;;) {
				try {
					pageData = await uso.getPage(page, "recently_updated", 12);
					break;
				} catch (e) {
					console.error(`[Page: ${page}, Error]`, e);
					errors++;
					if (errors > 50) process.exit(50);
				}
			}
			console.log(`[Page: ${page}] Downloaded, took ${Math.round((performance.now() - p1) / 1000)}s`);
			// Check if page is not empty
			if (pageData.data.length === 0) {
				stop = true;
				if (!stop) console.log(`[Page: ${page}] Stopping, page is empty`);
				startedPages--;
				return;
			}
			// Save page
			await fs.writeFile(path.resolve(__dirname, "data", "uso-pages", `${page}.json`), JSON.stringify(pageData), { encoding: "utf8" });
			startedPages--;
		})();
	}

	for (;;) {
		if (startedPages > 0) await utils.sleep(5000);
		else break;
	}
}

main();

