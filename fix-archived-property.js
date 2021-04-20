const fs = require("fs").promises;
const path = require("path");
const utils = require("./lib/utils");
const uso = require("./lib/uso");
const logger = require("./lib/logger");

async function main() {
	const index = {};
	const files = await fs.readdir(path.resolve(__dirname, "data", "uso-styles"));
	const downloadedScreenshots = await fs.readdir(path.resolve(__dirname, "data", "screenshots"));
	for (const stylePath of files) {
		const json = JSON.parse(await fs.readFile(path.resolve(__dirname, "data", "uso-styles", stylePath)));

		const h = uso.convertFromUso(json);
		index[json.id] = h.indexStyle;

		if (h.style.screenshots) {
			if (h.style.screenshots.main) {
				h.style.screenshots.main.archived = downloadedScreenshots.includes(h.style.screenshots.main.name);
			}
			if (h.style.screenshots.additional) {
				for (const screenshot of h.style.screenshots.additional) {
					screenshot.archived = downloadedScreenshots.includes(screenshot.name);
				}
			}
		}

		uso.saveStyle({ id: h.id, style: h.style });
		
		logger.info(["Regen"], `Regenerated ${json.id}`);
	}
	
	await utils.saveIndexes(index);
}

main().catch(e => logger.error(["Regen"], e));

