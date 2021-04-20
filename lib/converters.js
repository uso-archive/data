/* eslint-disable no-case-declarations */
const utils = require("./utils");

function toMarkdown(style) {
	return `# ${style.info.name} (${style.id})${style.obsolete ? `
### Obsolete
- Obsoleting style id: ${style.obsolete.obsoletedBy.id}
- Obsoleting style name: ${style.obsolete.obsoletedBy.name}
- Obsoletion message: ${style.obsolete.message}
` : ""}${style.deleteReasonId? `### Deleted
- Delete reason id: ${style.deleteReasonId}
` : ""}

### Information
- Rating: ${style.stats.rating || "unknown"}
- Applies to: ${style.info.category}
- Updated at: ${style.info.updatedAt ? style.info.updatedAt : "unknown"}
- Created at: ${style.info.createdAt ? style.info.createdAt : "unknown"}
- Weekly installs: ${style.stats.installs.weekly}
- Total installs: ${style.stats.installs.total}
- Author: ${style.info.author ? style.info.author.name || "unknown" : "unknown"} (${style.info.author ? style.info.author.id || "unknown" : "unknown"})
- License: ${style.info.license || "unknown"}

${style.info.description ? `### Description
${style.info.description}
` : ""}
${style.info.additionalInfo ? `### Update notes
${style.info.additionalInfo}
` : ""}
${style.info.additionalInfo ? `### Files
- [UserCSS](../usercss/${style.id}.user.css)
- [JSON](../styles/${style.id}.json)
` : ""}
${style.screenshots ? `### Screenshots
${style.screenshots.main ? screenshotToMarkdown(style.screenshots.main) : ""}${style.screenshots.additional && style.screenshots.additional.length > 0 ? `
${style.screenshots.additional.map(s => screenshotToMarkdown(s)).join("\n")}` : ""}` : ""}`;
}

function screenshotToMarkdown(screenshot) {
	if (screenshot.archived) {
		return markdownImg(`../screenshots/${screenshot.name}`);
	}
	else {
		return markdownImg(`https://userstyles.org/${screenshot.name.includes("-") ? "auto_" : ""}style_screenshots/${screenshot.name}`);
	}
}

function markdownImg(url) {
	return `![${url}](${url})`;
}

function toMarkdownIndexEntry(style) {
	return `# ${style.info.name} (${style.id})
- Updated at: ${style.info.updatedAt ? new Date(style.info.updatedAt).toLocaleString() : "unknown"}
- Category: ${style.info.category}
- Weekly installs: ${style.stats.installs.weekly}

${style.info.description ? `### Description
${style.info.description}
` : ""}`;
}

function toUsercss(style) {
	let replaces = [];
	const settings = toUsercssSettings(style.style.settings);

	function processKey(key) {
		if (/^[\w-_]+$/.test(key)) {
			return key;
		}
		else {
			const result = key.replace(/[^\w-_]/g, "-");
			const c = replaces.filter(v => v.r === result).length || null;
			replaces.push({ from: new RegExp(utils.escapeRegExp(`/*[[${key}]]*/`), "gi"), to: `/*[[${result}${c ? "-" + c : ""}]]*/`, r: result });
			return result;
		}
	}

	function toUsercssDropdownOptions(options) {
		let result = "";
		for (const option of options) {
			if (option.default) result = `${processKey(option.key)} "${option.label.replace(/"/g, "\\\"")}${option.default ? "*" : ""}" <<<EOT ${option.value} EOT;\r\n` + result;
			else result += `${processKey(option.key)} "${option.label.replace(/"/g, "\\\"")}${option.default ? "*" : ""}" <<<EOT ${option.value} EOT;\r\n`;
		}
		return result;
	}

	function toUsercssSetting(setting) {
		switch (setting.type) {
		case "dropdown":
			return `@advanced dropdown ${processKey(setting.key)} "${setting.label.replace(/"/g, "\\\"")}" {
	${toUsercssDropdownOptions(setting.options)}
}`;
		case "color":
			return `@advanced color ${processKey(setting.key)} "${setting.label.replace(/"/g, "\\\"")}" ${setting.options[0].value}`;
		case "image":
			const key = processKey(setting.key);
			return `@advanced dropdown ${key} "${setting.label.replace(/"/g, "\\\"")}" {
${toUsercssDropdownOptions(setting.options)}
	${processKey(key)}-custom-dropdown "Custom" <<<EOT /*[[${processKey(key)}-custom]]*/ EOT;
}
@advanced text ${processKey(key)}-custom "${setting.label.replace(/"/g, "\\\"")} (Custom)" "https://example.com/image.png"`;
		case "text":
			return `@advanced text ${processKey(setting.key)} "${setting.label.replace(/"/g, "\\\"")}" "${setting.options[0].value}"`;
		}
	}

	function toUsercssSettings(settings) {
		if (!settings) return "";
		let result = "";
		for (const setting of settings) {
			result += `${toUsercssSetting(setting).replace(/\*\//g, "*\\/")}\r\n`;
		}
		return result;
	}

	let result = `/* ==UserStyle==
@name           ${style.info.name}
@namespace      USO Archive
@author         ${style.info.author ? style.info.author.name || "unknown" : "unknown"}
@description    \`${style.info.description ? style.info.description.replace(/[\r\n]/gm, "") : "none"}\`
@version        ${versionFromTimestamp(style.info.updatedAt)}
@license        ${style.info.license}
@preprocessor   uso${settings ? "\n" + settings : ""}
==/UserStyle== */
${style.style.css}`;

	for (const replace of replaces) {
		result = result.replace(replace.from, replace.to);
	}

	return result;
}

function versionFromTimestamp(timestamp) {
	const date = new Date(timestamp);
	return `${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, 0)}${date.getDate().toString().padStart(2, 0)}.${date.getHours()}.${date.getMinutes()}`;
}

function toIndexEntry(style) {
	return {
		id: style.id,
		info: {
			name: style.info.name,
			description: style.info.description,
			format: style.info.format,
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
		screenshots: style.screenshots ? {
			main: style.screenshots.main || undefined,
		} : undefined,
	};
}

module.exports = {
	toIndexEntry,
	toUsercss,
	toMarkdownIndexEntry,
	toMarkdown
};
