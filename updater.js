const fs = require("fs").promises;
const path = require("path");
const performance = require("perf_hooks").performance;
const uso = require("./lib/uso");
const utils = require("./lib/utils");
const logger = require("./lib/logger");

async function main() {
	let changes = [];

	let index = {};
	try {
		index = JSON.parse(await fs.readFile(path.resolve(__dirname, "data", "index.json")));
	} catch { /**/ }
	logger.info(["Updater"], "Index Loaded");
	let previousUpdate = new Date(2005, 1, 1, 1, 1, 1, 1);
	try {
		previousUpdate = new Date(JSON.parse(await fs.readFile(path.resolve(__dirname, "data", "updater.json"))));
	} catch { /**/ }
	logger.info(["Updater", "Last Update"], previousUpdate.toLocaleString());
	let lastUpdate = previousUpdate;
	const maxPagesInParralel = 5;

	let stop = false;
	let stoppedAtPage = 999999;
	let startedPages = 0;

	for (let page = 1; !stop; page++) {
		await utils.waitUntilTrue(() => startedPages < maxPagesInParralel, 1000);
		
		if (stoppedAtPage < page) break;
		(async () => {
			startedPages++;
			if (stoppedAtPage < page) {
				logger.info(["Updater"], `Page ${page} cancelled`);
				startedPages--;
				return;
			}
			logger.info(["Updater"], `Page ${page} downloading...`);
			const pageData = await utils.retry(() => uso.getPage(page, "recently_updated", 12), 20);

			let promises = [];
			stoppedAtPage = 999999;

			if (page === 1) {
				lastUpdate = new Date(pageData.data[0].updated);
				logger.info(["Updater"], "Newest update: " + lastUpdate.toLocaleString());
			}

			for (const partialUsoStyle of pageData.data) {
				const updatedAt = new Date(partialUsoStyle.updated);
				if (updatedAt > previousUpdate) {
					promises.push((async () => {
						logger.info(["Updater", "Page " + page], `Style ${partialUsoStyle.name} (${partialUsoStyle.id}) downloading...`);
						const p = performance.now();
						const styleData = await utils.retry(async () => await uso.saveStyle(await uso.getStyle(partialUsoStyle.id, true, true)), 50);
						logger.info(["Updater", "Page " + page], `Style ${partialUsoStyle.name} (${partialUsoStyle.id}) downloaded, took ${Math.ceil((performance.now() - p) / 1000)}s`);
						changes.push({ type: index[partialUsoStyle.id] === undefined ? "new" : "updated", name: partialUsoStyle.name, updatedAt: partialUsoStyle.updated, id: partialUsoStyle.id });
						index[partialUsoStyle.id] = styleData.indexStyle;
					})().catch(e => logger.error(["Updater"], e)));
				}
				else {
					if (stoppedAtPage > page) {
						stoppedAtPage = page;
					}
					stop = true;
					logger.info(["Updater", "Page " + page], `Style ${partialUsoStyle.name} (${partialUsoStyle.id}) older than last update`);
					break;
				}
			}

			await Promise.all(promises);
			logger.info(["Updater"], `Page ${page} downloaded`);
			startedPages--;
		})().catch(e => logger.error(["Updater"], e));
	}

	await utils.waitUntilTrue(() => startedPages === 0, 5000);

	await fs.writeFile(path.resolve(__dirname, "data", "updater.json"), JSON.stringify(lastUpdate), { encoding: "utf8" });

	logger.info(["Updater"], "Saving indexes...");
	await utils.saveIndexes(index);

	console.log("::set-output name=changes::" + ["data: auto update", ...changes.map(e => `[${e.type === "new" ? "New" : "Update"}, ${e.updatedAt}] ${e.name} (${e.id})`)].join("%0A").replace(/"/g, "\\\""));
}

main().catch(e => logger.error(["Updater"], e));
