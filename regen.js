const fs = require("fs").promises;
const path = require("path");
const utils = require("./lib/utils");
const uso = require("./lib/uso");
const logger = require("./lib/logger");

async function main() {
	const index = {};
	for (const stylePath of await fs.readdir(path.resolve(__dirname, "data", "styles"))) {
		const json = JSON.parse(await fs.readFile(path.resolve(__dirname, "data", "styles", stylePath)));

		const h = uso.convertStyle(json);
		await uso.saveStyle({ style: h.style, usercss: h.usercss, markdown: h.markdown });
		index[json.id] = h.indexStyle;

		logger.info(["Regen"], `Regenerated ${json.id}`);
	}
	
	await utils.saveIndexes(index);
}

main().catch(e => logger.error(["Regen"], e));

