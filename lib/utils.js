const fetch = require("node-fetch");
const fsSync = require("fs");

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

function toMarkdown(style) {
	return `# ${style.info.name} (${style.id})${
		style.obsolete
			? `### Obsolete
- Obsoleting style id: ${style.obsolete.obsoletedBy.id}
- Obsoleting style name: ${style.obsolete.obsoletedBy.name}
- Obsoletion message: ${style.obsolete.message}
`
			: ""
	}${
		style.deleteReasonId
			? `### Deleted by admins
- Delete reason id: ${style.deleteReasonId}
`
			: ""
	}

### Information
- Author: ${style.info.author ? style.info.author.name || "unknown" : "unknown"} (${style.user ? style.info.author.id || "unknown" : "unknown"})
- Created at: ${style.info.createdAt ? new Date(style.info.createdAt).toLocaleString() : "unknown"}
- Updated at: ${style.info.updatedAt ? new Date(style.info.updatedAt).toLocaleString() : "unknown"}
- License: ${style.info.license || "unknown"}
- Category: ${style.info.category}
- Rating: ${style.stats.rating}
- Total installs: ${style.stats.installs.total}
- Weekly installs: ${style.stats.installs.weekly}


${
	style.info.description
		? `### Description
${style.info.description}
`
		: ""
}
${
	style.info.additionalInfo
		? `### Update notes
${style.info.additionalInfo}
`
		: ""
}
### Screenshots (links to userstyles.org)
${style.screenshots.main ? "![https://userstyles.org/style_screenshots/" + style.screenshots.main + "](https://userstyles.org/style_screenshots/" + style.screenshots.main + ")" : ""}
${style.screenshots.additional ? style.screenshots.additional.map((s) => "![https://userstyles.org/style_screenshots/" + s + "](https://userstyles.org/style_screenshots/" + s + ")").join("\r\n") : ""}

${
	style.screenshots.isMainArchived
		? `### Screenshots (archived)
${style.screenshots.main ? "![https://raw.githubusercontent.com/33kk/uso-archive/flomaster/data/screenshots/" + style.screenshots.main + "](https://raw.githubusercontent.com/33kk/uso-archive/flomaster/data/screenshots/" + style.screenshots.main + ")" : ""}
`
		: ""
}`;
}

function toMarkdownIndexEntry(style) {
	return `# ${style.info.name} (${style.id})
- Updated at: ${style.info.updatedAt ? new Date(style.info.updatedAt).toLocaleString() : "unknown"}
- Category: ${style.info.category}
- Weekly installs: ${style.stats.installs.weekly}

${
	style.info.description
		? `### Description
${style.info.description}
`
		: ""
}`;
}

function toUsercss(style) {
	return `/* ==UserStyle==
@name           ${style.info.name}
@namespace      ${style.user ? style.user.homepage || "USO Archive" : "USO Archive"}
@author         ${style.info.author ? style.info.author.name || "unknown" : "unknown"}
@description    \`${style.info.description ? style.info.description.replace(/[\r\n]/gm, "") : "none"}\`
@version        ${versionFromTimestamp(style.info.updatedAt)}
@license        ${style.info.license}
@preprocessor   uso
${convertSettings(style.style.settings)}
==/UserStyle== */

${style.style.css}`;
}

function versionFromTimestamp(timestamp) {
	const date = new Date(timestamp);
	return `${date.getFullYear()}${date.getMonth() + 1}${date.getDate()}.${date.getHours()}.${date.getMinutes()}`;
}

function convertDropdownOptions(options) {
	let result = "";
	for (const option of options) {
		if (option.default) result = `	${option.key} "${option.label}${option.default ? "*" : ""}" <<<EOT ${option.value} EOT;\r\n` + result;
		else result += `	${option.key} "${option.label}${option.default ? "*" : ""}" <<<EOT ${option.value} EOT;\r\n`;
	}
	return result;
}

function convertSetting(setting) {
	switch (setting.type) {
	case "dropdown":
		return `@advanced dropdown ${setting.key} "${setting.label}" {
	${convertDropdownOptions(setting.options)}
}`;
	case "color":
		return `@advanced color ${setting.key} "${setting.label}" ${setting.options[0].value}`;
	case "image":
		return `@advanced dropdown ${setting.key} "${setting.label}" {
${convertDropdownOptions(setting.options)}
	${setting.key}-custom-dropdown "Custom" <<<EOT /*[[${setting.key}-custom]]*/ EOT;
}
@advanced text ${setting.key}-custom "${setting.label} (Custom)" "https://example.com/image.png"`;
	case "text":
		return `@advanced text ${setting.key} "${setting.label}" "${setting.options[0].value}"`;
	}
}

function convertSettings(settings) {
	if (!settings) return "";
	let result = "";
	for (const setting of settings) {
		result += `${convertSetting(setting).replace(/\*\//g, "*\\/")}\r\n`;
	}
	return result;
}

function toIndexEntry(style) {
	return {
		id: style.id,
		info: {
			name: style.info.name,
			description: style.info.description,
			category: style.info.category,
			updatedAt: style.info.updatedAt,
			author: style.info.author
				? {
					id: style.info.author.id,
					name: style.info.author.name,
				}
				: undefined,
		},
		stats: style.stats,
		screenshots: {
			main: style.screenshots.main,
			isMainArchived: style.screenshots.isMainArchived,
		},
	};
}

module.exports = {
	sleep,
	downloadFile,
	toIndexEntry,
	toUsercss,
	toMarkdown,
	toMarkdownIndexEntry,
};
