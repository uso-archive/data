const fetch = require("node-fetch");
const fsSync = require("fs");
const fs = require("fs").promises;
const path = require("path");
const logger = require("./logger");

async function sleep(time) {
	return new Promise((resolve) => {
		setTimeout(resolve, time);
	});
}

async function downloadFile(url, path) {
	const res = await fetch(url);
	const fileStream = fsSync.createWriteStream(path);
	await new Promise((resolve, reject) => {
		res.body.pipe(fileStream);
		res.body.on("error", reject);
		fileStream.on("finish", resolve);
	});
}

async function retry(func, maxErrors, dontThrow, delay) {
	let errors = 0;
	for(;;) {
		try {
			return await func();
		}
		catch (e) {
			if (errors < maxErrors) {
				logger.error(["Utils"], e);
				errors++;
				if (delay) {
					await sleep(delay);
				}
			}
			else {
				if (!dontThrow)
					throw e;
				else return;
			}
		}
	}
}

async function waitUntilTrue(func, checkInterval) {
	while (!func()) {
		await sleep(checkInterval || 50);
	}
}

async function saveIndexes(index) {
	let arrayIndex = [];
	for (const i in index) {
		arrayIndex.push(index[i]);
	}
	arrayIndex.sort((a, b) => b.stats.installs.weekly - a.stats.installs.weekly);

	let searchIndex = [];
	for (const el of arrayIndex) {
		let data = {f: el.info.format, i: el.id, n: el.info.name, /*d: el.info.description, */c: el.info.category, u: Math.floor(+new Date(el.info.updatedAt) / 1000), t: el.stats.installs.total, w: el.stats.installs.weekly, r: el.stats.rating};
		if (el.info.author) {
			data.ai = el.info.author.id;
			data.an = el.info.author.name;
		}
		if (el.screenshots && el.screenshots.main) {
			data.sn = el.screenshots.main.name;
			data.sa = el.screenshots.main.archived;
		}
		searchIndex.push(data);
	}

	await fs.writeFile(path.resolve(__dirname, "..", "data", "index.json"), JSON.stringify(index), { encoding: "utf8" });
	await fs.writeFile(path.resolve(__dirname, "..", "data", "search-index.json"), JSON.stringify(searchIndex), { encoding: "utf8" });
}

function escapeRegExp(string) {
	return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

module.exports = {
	sleep,
	retry,
	waitUntilTrue,
	downloadFile,
	saveIndexes,
	escapeRegExp
};
