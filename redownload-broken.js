const uso = require("./lib/uso");
const utils = require("./lib/utils");
const fs = require("fs").promises;
const path = require("path");
const logger = require("./lib/logger");

async function main() {
	const styles = await fs.readdir(path.resolve(__dirname, "data", "styles"));

	let running = 0;
	for (const file of styles) {
		(async () => {
			const oldData = JSON.parse(await fs.readFile(path.resolve(__dirname, "data", "styles", file), { encoding: "utf8" }));
			if (uso.hasSettings(oldData.style.css) && oldData.style.settings === null) {
				while (running > 10) {
					await utils.sleep(50);
				}
				running++;
				logger.info(["Redownload Broken"], `Downloading style ${oldData.id}`);
				console.log(`Downloading ${oldData.id}`);
				for (;;) {
					try {
						await uso.saveStyle(await uso.getStyle(oldData.id, true, true));
						logger.info(["Redownload Broken"], `Downloaded style ${oldData.id}`);
						break;
					} catch { /**/ }
				}
				running--;
			}
		})().catch(e => logger.error(["Redownload broken"], e));
	}
}

main().catch(e => logger.error(["Redownload broken"], e));
