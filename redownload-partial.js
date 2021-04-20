const uso = require("./lib/uso");
const utils = require("./lib/utils");
const fs = require("fs").promises;
const path = require("path");
const logger = require("./lib/logger");

async function main() {
	const styles = await fs.readdir(path.resolve(__dirname, "data", "styles"));

	let running = 0;
	let i = 0;
	for (const file of styles) {
		const oldData = JSON.parse(await fs.readFile(path.resolve(__dirname, "data", "styles", file), { encoding: "utf8" }));
		if (oldData.info.license === "NO-REDISTRIBUTION" && oldData.info.additionalInfo === undefined) {
			while (running > 1000) {
				await utils.sleep(50);
			}
			running++;
			(async () => {
				logger.info(["Redownload partial"], `Downloading style ${oldData.id}`);
				for (;;) {
					try {
						await uso.saveStyle(await uso.getStyle(oldData.id, true, true));
						i++;
						logger.info(["Redownload partial"], `Downloaded style ${oldData.id}, total downloaded: ${i}`);
						break;
					} catch { /**/ }
				}
				running--;
			})().catch(e => {logger.error(["Redownload partial", oldData.id], e); running--});
		}
	}
}

main().catch(e => logger.error(["Redownload partial"], e));
