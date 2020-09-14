const fs = require("fs").promises;
const path = require("path");
const utils = require("./lib/utils");

async function main() {
	const index = {};
	for (const stylePath of await fs.readdir(path.resolve(__dirname, "data", "styles"))) {
		const json = JSON.parse(await fs.readFile(path.resolve(__dirname, "data", "styles", stylePath)));
		index[json.id] = utils.toIndexEntry(json);
		await fs.writeFile(path.resolve(__dirname, "data", "usercss", `${json.id}.user.css`), utils.toUsercss(json), { encoding: "utf8" });
		await fs.writeFile(path.resolve(__dirname, "data", "markdown", `${json.id}.md`), utils.toMarkdown(json), { encoding: "utf8" });
		console.log(`[Style: ${json.id}] Done.`);
	}
	
	console.log("[Index] Generating search index...");

	let searchIndex = [];
	for (const i in index) {
		searchIndex.push(index[i]);
	}
	searchIndex.sort((a, b) => b.stats.installs.weekly - a.stats.installs.weekly);

	console.log("[Index] Generated search index");
	console.log("[Index] Generating markdown index...");

	let markdownIndex = `# UserStyles.org Archive
	`;
	for (const el of searchIndex) {
		markdownIndex += utils.toMarkdownIndexEntry(el);
	}

	console.log("[Index] Generated markdown index");

	// Save indexes
	await fs.writeFile(path.resolve(__dirname, "data", "index.md"), markdownIndex, { encoding: "utf8" });
	await fs.writeFile(path.resolve(__dirname, "data", "index.json"), JSON.stringify(index), { encoding: "utf8" });
	await fs.writeFile(path.resolve(__dirname, "data", "search-index.json"), JSON.stringify(searchIndex), { encoding: "utf8" });
}

main();

