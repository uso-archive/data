const fs = require("fs").promises;
const path = require("path");

async function main() {
	for (const page of await fs.readdir(path.resolve(__dirname, "data", "uso-pages"))) {
		const json = JSON.parse(await fs.readFile(path.resolve(__dirname, "data", "uso-pages", page)));

		for (const style of json.data) {
			const stylePath = path.resolve(__dirname, "data", "uso-styles", style.id + ".json");
			try {
				await fs.stat(stylePath);
				console.log(`${style.id} already exists.`);
			} catch {
				await fs.writeFile(stylePath, JSON.stringify(style), { encoding: "utf8" });
				console.log(`Wrote ${style.id}`);
			}
		}
	}
}

main();
