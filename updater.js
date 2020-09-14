const fs = require("fs").promises;
const path = require("path");
const performance = require("perf_hooks").performance;
const uso = require("./lib/uso");
const utils = require("./lib/utils");

async function main() {
	let changes = [];

	let index = {};
	try {
		index = JSON.parse(await fs.readFile(path.resolve(__dirname, "data", "index.json")));
	} catch { /**/ }
	console.log("[Index] Loaded");
	let previousUpdate = new Date(2005, 1, 1, 1, 1, 1, 1);
	try {
		previousUpdate = new Date(JSON.parse(await fs.readFile(path.resolve(__dirname, "data", "updater.json"))));
	} catch { /**/ }
	console.log(`[Last Update] ${previousUpdate.toLocaleString()}`);
	let lastUpdate = previousUpdate;

	let stop = false;
	let stoppedAtPage = 999999;
	let startedPages = 0;

	// Every page runs 12 requests in parralel
	const maxPagesInParralel = 10;

	for (let page = 1; !stop; page++) {
		// Only run X downloads at same time
		for (;;) {
			if (startedPages >= maxPagesInParralel) await utils.sleep(1000);
			else break;
		}
		// Start downloading page
		(async () => {
			// Increment started page counter
			startedPages++;
			// Cancel if page is already downloaded
			if (stoppedAtPage <= page) {
				console.log(`[Page: ${page}] Older than last update, canceling`);
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
				stoppedAtPage = page;
				if (!stop) console.log(`[Page: ${page}] Stopping, page is empty`);
				startedPages--;
				return;
			}
			// Check if page isnt older than previous update
			if (pageData.data[pageData.data.length - 1].updated <= previousUpdate || stoppedAtPage <= page) {
				console.log(`[Page: ${page}] Older than last update, canceling`);
				stop = true;
				if (stoppedAtPage === 999999) {
					console.log(`[Page: ${page}] Set stoppedAtPage to current page`);
					stoppedAtPage = page;
				}
				// Set stoppedAtPage if it is bigger than current page
				else if (stoppedAtPage > page) {
					console.log(`[Page: ${page}] Reduced stoppedAtPage to current page`);
					stoppedAtPage = page;
				}
				startedPages--;
				return;
			}
			console.log(`[Page: ${page}] Downloading styles...`);
			// Download all styles in parralel
			const promises = pageData.data.map((s) =>
				(async () => {
					const id = s.id;
					const updated = new Date(s.updated);
					if (updated > lastUpdate) {
						lastUpdate = updated;
						console.log(`[Page: ${page}, Style: ${s.id}] Newest update: ${lastUpdate}`);
					}
					// Check if style isnt older than previous update
					if (updated <= previousUpdate) {
						console.log(`[Page: ${page}, Style: ${s.id}] Older than last update, canceling`);
						stop = true;
						if (stoppedAtPage === 999999) {
							console.log(`[Page: ${page}, Style: ${s.id}] Set stoppedAtPage to current page`);
							stoppedAtPage = page;
						}
						// Set stoppedAtPage if it is bigger than current page
						else if (stoppedAtPage > page) {
							console.log(`[Page: ${page}, Style: ${s.id}] Reduced stoppedAtPage to current page`);
							stoppedAtPage = page;
						}
						return;
					}
					// Logging
					console.log(`[Page: ${page}, Style: ${s.id}] Downloading...`);
					const p1 = performance.now();
					// Download style, retry on error
					let errors = 0;
					let usoStyle = undefined;
					for (;;) {
						try {
							usoStyle = await uso.getStyleInfo(id);
							break;
						} catch (e) {
							console.error(`[Page: ${page}, Style: ${s.id}, Error]`, e);
							errors++;
							if (errors > 50) process.exit(50);
						}
					}
					console.log(`[Page: ${page}, Style: ${s.id}] Downloaded, took ${Math.round((performance.now() - p1) / 1000)}s, updated at: ${new Date(s.updated).toLocaleString()}`);
					// Convert to different formats, save
					const style = uso.toBetterFormat(usoStyle, true);
					const isNew = index[style.id] === undefined;
					changes.push({ type: isNew ? "new" : "updated", name: style.info.name, updatedAt: style.info.updatedAt, id: style.id });
					index[style.id] = utils.toIndexEntry(style);
					await fs.writeFile(path.resolve(__dirname, "data", "uso-styles", `${style.id}.json`), JSON.stringify(s), { encoding: "utf8" });
					await fs.writeFile(path.resolve(__dirname, "data", "styles", `${style.id}.json`), JSON.stringify(style), { encoding: "utf8" });
					await fs.writeFile(path.resolve(__dirname, "data", "usercss", `${style.id}.user.css`), utils.toUsercss(style), { encoding: "utf8" });
					await fs.writeFile(path.resolve(__dirname, "data", "markdown", `${style.id}.md`), utils.toMarkdown(style), { encoding: "utf8" });
					// Download screenshot
					const screenshotName = style.screenshots.main;
					if (screenshotName)
						for (;;) {
							try {
								await utils.downloadFile(`https://userstyles.org/style_screenshots/${screenshotName}`, path.resolve(__dirname, "data", "screenshots", screenshotName));
								break;
							} catch (e) {
								console.error(`[Page: ${page}, Style: ${s.id}, Error]`, e);
								errors++;
								if (errors > 50) process.exit(50);
							}
						}
				})()
			);
			// Wait for styles to download
			await Promise.all(promises);
			startedPages--;
		})();
	}

	for (;;) {
		if (startedPages > 0) await utils.sleep(5000);
		else break;
	}

	// Save last update
	await fs.writeFile(path.resolve(__dirname, "data", "updater.json"), JSON.stringify(lastUpdate), { encoding: "utf8" });

	// Create index array
	let searchIndex = [];
	for (const i in index) {
		searchIndex.push(index[i]);
	}
	searchIndex.sort((a, b) => b.stats.installs.weekly - a.stats.installs.weekly);

	// Create markdown index
	let markdownIndex = `# UserStyles.org Archive
	`;
	for (const el of searchIndex) {
		markdownIndex += utils.toMarkdownIndexEntry(el);
	}

	// Save indexes
	await fs.writeFile(path.resolve(__dirname, "data", "index.md"), markdownIndex, { encoding: "utf8" });
	await fs.writeFile(path.resolve(__dirname, "data", "index.json"), JSON.stringify(index), { encoding: "utf8" });
	await fs.writeFile(path.resolve(__dirname, "data", "search-index.json"), JSON.stringify(searchIndex), { encoding: "utf8" });

	console.log("::set-output name=changes::" + ["¯\\_(ツ)_/¯", ...changes.map(e => `[${e.type === "new" ? "New" : "Update"}, ${e.updatedAt}] ${e.name} (${e.id})`)].join("%0A").replace(/"/g, "\\\""));
}

main();
