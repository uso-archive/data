const uso = require("./lib/uso");
const path = require("path");
const fs = require("fs").promises;

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
				console.log(`[${json.id}] Converted, archived screenshot exists.`);
			}
			else {
				res = uso.toBetterFormat(json, false);
				console.log(`[${json.id}] Converted.`);
			}
		} catch (e) {
			res = uso.toBetterFormat(json, false);
			console.log(`[${json.id}] Converted.`);
		}
		await fs.writeFile(path.resolve(__dirname, "data", "styles", file), JSON.stringify(res), { encoding: "utf8" });
	}
}

main();

