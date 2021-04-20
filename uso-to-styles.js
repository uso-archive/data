const uso = require("./lib/uso");
const path = require("path");
const fs = require("fs").promises;
const logger = require("./lib/logger");

async function main() {
	const files = await fs.readdir(path.resolve(__dirname, "data", "uso-styles"));

	for (const file of files) {
		const json = JSON.parse(await fs.readFile(path.resolve(__dirname, "data", "uso-styles", file), { encoding: "utf8" }));
		let res = {};
		try {
			const screenshot = json.screenshot_url || json.after_screenshot_name || json.screenshot;
			if (screenshot) {
				const filename = uso.filenameFromScreenshotUrl(screenshot);
				await fs.stat(path.resolve(__dirname, "data", "screenshots", filename));
				res = uso.toBetterFormat(json, true);
				logger.info(["Uso To Styles"], `Converted ${json.id}, archived screenshot exists`);
			}
			else {
				res = uso.toBetterFormat(json, false);
				logger.info(["Uso To Styles"], `Converted ${json.id}`);
			}
		} catch (e) {
			res = uso.toBetterFormat(json, false);
			logger.info(["Uso To Styles"], `Converted ${json.id}`);
		}
		await fs.writeFile(path.resolve(__dirname, "data", "styles", file), JSON.stringify(res, null, 2), { encoding: "utf8" });
	}
}

main().catch(e => logger.error(["Uso To Styles"], e));

