const fs = require("fs").promises;
const path = require("path");
const utils = require("./lib/utils");
const converters = require("./lib/converters");
const logger = require("./lib/logger");

async function main() {
	const index = {};
	for (const stylePath of await fs.readdir(path.resolve(__dirname, "data", "styles"))) {
		const json = JSON.parse(await fs.readFile(path.resolve(__dirname, "data", "styles", stylePath)));
		index[json.id] = converters.toIndexEntry(json);
	}

	await utils.saveIndexes(index);
}

main().catch(e => logger.error(["Index Styles"], e));
