const fs = require("fs").promises;
const path = require("path");
const logger = require("./lib/logger");

async function main() {
	for (const page of await fs.readdir(path.resolve(__dirname, "data", "uso-pages"))) {
		const json = JSON.parse(await fs.readFile(path.resolve(__dirname, "data", "uso-pages", page)));

		for (const style of json.data) {
			const stylePath = path.resolve(__dirname, "data", "uso-styles", style.id + ".json");
			try {
				await fs.stat(stylePath);
				logger.info(["Pages To Uso"], `${style.id} already exists`);
			} catch {
				await fs.writeFile(stylePath, JSON.stringify(style, null, 2), { encoding: "utf8" });
				logger.info(["Pages To Uso"], `Wrote ${style.id}`);
			}
		}
	}
}

main().catch(e => logger.error(["Pages To Uso"], e));
