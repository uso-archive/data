const fs = require("fs").promises;
const path = require("path");
const utils = require("./lib/utils");
const uso = require("./lib/uso");
const logger = require("./lib/logger");

async function main() {
	let started = 0;
	const maxInParralel = 100;

	const skipTo = parseInt(process.argv[2]);
	const files = (await fs.readdir(path.resolve(__dirname, "data", "styles"))).sort().slice(skipTo);

	let regular = skipTo || 0;
	let full = 0;
	const total = (skipTo || 0) + files.length;

	for (const stylePath of files) {
		await utils.waitUntilTrue(() => started < maxInParralel);
		
		(async () => {
			started++;
			const json = JSON.parse(await fs.readFile(path.resolve(__dirname, "data", "styles", stylePath)));
		
			if (uso.shouldBeFullyArchived(json)) {
				try {
					await uso.saveStyle(await uso.getStyle(json.id, true, true));
				}
				catch (e) {
					logger.error(["Get Style Info"], e);
				}
				full++;
				logger.info(["Get Style Info"], `Style ${json.id} is fully saved. Progress: ${regular+full}/${total} (full: ${full}, regular: ${regular})`);
			} else {
				// const styleData = uso.convertStyle(json);
				// await uso.saveStyle({ usercss: styleData.usercss, markdown: styleData.markdown });
				regular++;
				// logger.info(["Get Style Info"], `Style ${json.id} is saved. Progress: ${regular+full}/${total} (full: ${full}, regular: ${regular})`);
			}
			started--;
		})().catch(e => logger.error(["Get Style Info"], e));
	}

	await utils.waitUntilTrue(() => started === 0, 5000);
}

main().catch(e => logger.error(["Get Style Info"], e));

