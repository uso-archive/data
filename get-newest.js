const fs = require("fs").promises;
const path = require("path");
const performance = require("perf_hooks").performance;
const uso = require("./lib/uso");
const utils = require("./lib/utils");
const logger = require("./lib/logger");

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
			if (downloadedPages.includes(`${page}.json`)) {
				logger.info(["Get Newest"], `Page ${page} already exists`);
				startedPages--;
				return;
			}
			// Logging
			logger.info(["Get Newest"], `Downloading page ${page}...`);

			const p1 = performance.now();
			let pageData = utils.retry(async () => await uso.getPage(page, "recently_updated", 12), 50);
			logger.info(["Get Newest"], `Page ${page} downloaded, took ${Math.round((performance.now() - p1) / 1000)}s`);

			// Check if page is not empty
			if (pageData.data.length === 0) {
				stop = true;
				if (!stop) logger.info(["Get Newest", `Stopping, page ${page} is empty`]);
				startedPages--;
				return;
			}
			// Save page
			await fs.writeFile(path.resolve(__dirname, "data", "uso-pages", `${page}.json`), JSON.stringify(pageData, null, 2), { encoding: "utf8" });
			startedPages--;
		})().catch(e => logger.error(["Get Newest"], e));
	}

	for (;;) {
		if (startedPages > 0) await utils.sleep(5000);
		else break;
	}
}

main().catch(e => logger.error(["Get Newest"], e));

