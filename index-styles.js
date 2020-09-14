const fs = require("fs").promises;
const path = require("path");
const utils = require("./lib/utils");

async function main() {
	console.log("[Index] Loading...");
	const index = {};
	for (const stylePath of await fs.readdir(path.resolve(__dirname, "data", "styles"))) {
		const json = JSON.parse(await fs.readFile(path.resolve(__dirname, "data", "styles", stylePath)));
		index[json.id] = utils.toIndexEntry(json);
	}
	console.log("[Index] Loaded");

	let searchIndex = [];
	for (const i in index) {
		searchIndex.push(index[i]);
	}
	searchIndex.sort((a, b) => b.stats.installs.weekly - a.stats.installs.weekly);

	let markdownIndex = `# UserStyles.org Archive
	`;
	for (const el of searchIndex) {
		markdownIndex += utils.toMarkdownIndexEntry(el);
	}

	// Save indexes
	await fs.writeFile(path.resolve(__dirname, "data", "index.md"), markdownIndex, { encoding: "utf8" });
	await fs.writeFile(path.resolve(__dirname, "data", "index.json"), JSON.stringify(index), { encoding: "utf8" });
	await fs.writeFile(path.resolve(__dirname, "data", "search-index.json"), JSON.stringify(searchIndex), { encoding: "utf8" });
}

main();
