const fs = require("fs").promises;
const path = require("path");
const performance = require("perf_hooks").performance;
const uso = require("./lib/uso");
const utils = require("./lib/utils");

async function main() {
	// Get list of downloaded pages
	const downloadedPages = await fs.readdir(path.resolve(__dirname, "data", "uso-pages"));
	const archivedScreenshots = await fs.readdir(path.resolve(__dirname, "data", "screenshots"));

	const index = {};

	let startedPages = 0;

	const maxPagesInParralel = 50;
	const maxScreenshotPage = 750;

	for (const page in downloadedPages) {
		// Only run X downloads at same time
		for (;;) {
			if (startedPages >= maxPagesInParralel) await utils.sleep(5);
			else break;
		}
		// Start downloading page
		(async () => {
			// Increment started page counter
			startedPages++;
			const pageData = JSON.parse(await fs.readFile(path.resolve(__dirname, "data", "uso-pages", downloadedPages[page])));
			console.log(`[Page: ${page}] Downloading styles...`);
			// Download all styles in parralel
			const promises = pageData.data.map((s) =>
				(async () => {
					const id = s.id;
					// Logging
					const p1 = performance.now();
					let errors = 0;
					let usoStyle = s;
					// Download style if uses options, retry on error
					if (uso.hasSettings(s.css)) {
						console.log(`[Page: ${page}, Style: ${s.id}] Downloading...`);
						for (;;) {
							try {
								usoStyle = await uso.getStyleInfo(id);
								console.log(`[Page: ${page}, Style: ${s.id}] Downloaded, took ${Math.round((performance.now() - p1) / 1000)}s, updated at: ${new Date(s.updated).toLocaleString()}`);
								break;
							} catch (e) {
								console.error(`[Page: ${page}, Style: ${s.id}, Error]`, e);
								errors++;
								if (errors > 50) process.exit(50);
							}
						}
					} else console.log(`[Page: ${page}, Style: ${s.id}] Updated at: ${new Date(s.updated).toLocaleString()}`);
					// Download screenshot
					let isSsArchived = false;
					const screenshotName = uso.filenameFromScreenshotUrl(usoStyle.after_screenshot_name || usoStyle.screenshot_url || usoStyle.screenshot);
					if (page <= maxScreenshotPage) {
						if (screenshotName)
							for (;;) {
								try {
									await utils.downloadFile(`https://userstyles.org/style_screenshots/${screenshotName}`, path.resolve(__dirname, "data", "screenshots", screenshotName));
									isSsArchived = true;
									break;
								} catch (e) {
									console.error(`[Page: ${page}, Style: ${s.id}, Error]`, e);
									errors++;
									if (errors > 50) process.exit(50);
								}
							}
					}
					// Check if screenshot is archived
					isSsArchived = isSsArchived ? true : archivedScreenshots.includes(screenshotName);
					// Convert to different formats, save
					const style = uso.toBetterFormat(usoStyle, isSsArchived);
					index[style.id] = utils.toIndexEntry(style);
					await fs.writeFile(path.resolve(__dirname, "data", "uso-styles", `${style.id}.json`), JSON.stringify(usoStyle), { encoding: "utf8" });
					await fs.writeFile(path.resolve(__dirname, "data", "styles", `${style.id}.json`), JSON.stringify(style), { encoding: "utf8" });
					await fs.writeFile(path.resolve(__dirname, "data", "usercss", `${style.id}.user.css`), utils.toUsercss(style), { encoding: "utf8" });
					await fs.writeFile(path.resolve(__dirname, "data", "markdown", `${style.id}.md`), utils.toMarkdown(style), { encoding: "utf8" });
				})()
			);
			// Wait for styles to download
			await Promise.all(promises);
			console.log(`[Page: ${page}] Downloaded all styles`);
			startedPages--;
		})();
	}

	for (;;) {
		if (startedPages > 0) await utils.sleep(5000);
		else break;
	}

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
}

main();
