const uso = require("./lib/uso");
const utils = require("./lib/utils");
const fs = require("fs").promises;

async function main() {
	const styles = await fs.readdir("data/styles");

	let running = 0;
	for (const file of styles) {
		(async () => {
			const oldData = JSON.parse(await fs.readFile(`./data/styles/${file}`, { encoding: "utf8" }));
			if (uso.hasSettings(oldData.style.css) && oldData.style.settings === null) {
				while (running > 10) {
					await utils.sleep(50);
				}
				running++;
				console.log(`Downloading ${oldData.id}`);
				for (;;) {
					try {
						const data = uso.toBetterFormat(await uso.getStyleInfo(oldData.id), oldData.screenshots.isMainArchived);
						await fs.writeFile(`./data/styles/${file}`, JSON.stringify(data), { encoding: "utf8" });
						console.log(`Downloaded ${data.id}`);
						break;
					} catch { /**/ }
				}
				running--;
			}
		})();
	}
}

main();
