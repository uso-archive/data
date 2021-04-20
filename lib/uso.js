const fetch = require("node-fetch");
const utils = require("./utils");
const converters = require("./converters");
const fs = require("fs").promises;
const path = require("path");

async function getPage(page, category, perPage) {
	const response = await fetch(`https://userstyles.org/api/v1/styles/${category}?per_page=${perPage}&page=${page}`, {
		headers: {
			Referer: "https://userstyles.org/",
			"User-Agent": "Mozilla/5.0 (Windows NT 10.0; rv:78.0) Gecko/20100101 Firefox/78.0",
		},
	});

	if (response.status !== 200) throw `Non 200 status code (${response.status})`;

	let json = await response.json();
	json.data.forEach((style) => {if (style.user) style.user.email = "redacted"; });
	return json;
}

async function getStyleInfo(id) {
	const response = await fetch(`https://userstyles.org/api/v1/styles/${id}`, {
		headers: {
			Referer: "https://userstyles.org/",
			"User-Agent": "Mozilla/5.0 (Windows NT 10.0; rv:78.0) Gecko/20100101 Firefox/78.0",
		},
	});
	if (response.status !== 200) throw `Non 200 status code (${response.status})`;
	let json = await response.json();
	try {
		json.user.email = "redacted";
	}
	catch {
		console.log(id, json, json.user);
	}
	return json;
}

function filenameFromScreenshotUrl(url, thr) {
	if (!url) return undefined;
	const rgx = "style_screenshots\\/(?<filename>.*?)\\?";
	const match = new RegExp(rgx).exec(url);
	if (thr) {
		if (!match) throw "No matches. Input: " + url;
		if (!match.groups) throw "No groups. Input: " + url;
		if (!match.groups.filename) throw "No filename group. Input: " + url;
	} else {
		if (!match || !match.groups || !match.groups.filename) return undefined;
	}
	return match.groups.filename;
}

function licenseToSpdx(license) {
	switch (license) {
	case "publicdomain":
		return "CC0-1.0";
	case "ccby":
		return "CC-BY-4.0";
	case "ccbysa":
		return "CC-BY-SA-4.0";
	case "ccbynd":
		return "CC-BY-ND-4.0";
	case "ccbync":
		return "CC-BY-NC-4.0";
	case "ccbyncsa":
		return "CC-BY-NC-SA-4.0";
	case "ccbyncnd":
		return "CC-BY-NC-ND-4.0";
	}
	return "NO-REDISTRIBUTION";
}

function toBetterFormat(style, isScreenshotArchived, areAdditionalArchived) {
	let settings = style.style_settings
		? style.style_settings.map((s) => {
			return {
				key: s.install_key,
				label: s.label,
				type: s.setting_type,
				options: s.style_setting_options
					? s.style_setting_options.map((o) => {
						return {
							key: o.install_key,
							label: o.label,
							value: o.value,
							default: o.default,
						};
					})
					: undefined,
			};
		})
		: hasSettings(style.css)
			? null
			: undefined;
	if (Array.isArray(settings)) {
		if (settings.length === 0) {
			settings = undefined;
		}
	}

	const mainScreenshotName = filenameFromScreenshotUrl(style.after_screenshot_name || style.screenshot_url || style.screenshot || undefined);

	return {
		id: style.id,
		info: {
			name: style.name,
			description: style.description,
			additionalInfo: style.additional_info,
			format: style.category === "android" ? "uso-android" : "uso",
			category: style.category === "global" ? "global" : style.subcategory || style.raw_subcategory,
			createdAt: style.created,
			updatedAt: style.updated,
			license: licenseToSpdx(style.license),
			author: style.user
				? {
					id: style.user.id,
					name: style.user.name,
					paypalEmail: style.user.paypal_email || undefined,
					homepage: style.user.homepage || undefined,
				}
				: undefined,
		},
		stats: {
			installs: {
				total: style.total_install_count,
				weekly: style.weekly_install_count,
			},
			rating: style.rating || undefined,
		},
		screenshots: mainScreenshotName || style.screenshots ? {
			main: mainScreenshotName ? { name: mainScreenshotName, archived: !!isScreenshotArchived } : undefined,
			additional: style.screenshots ? style.screenshots.map((s) => { return { name: filenameFromScreenshotUrl(s), archived: !!areAdditionalArchived};}) : undefined,
		} : undefined,
		discussions: {
			stats: {
				discussionsCount: style.discussionsCount,
				commentsCount: style.commentsCount,
			},
			data: style.discussions
				? style.discussions.map((d) => {
					return {
						id: d.id,
						title: d.name,
						createdAt: d.created,
						author: {
							id: d.author_id,
							name: d.author_name,
						},
					};
				})
				: undefined,
		},
		obsolete: style.obsolete
			? {
				obsoletedBy: {
					id: style.obsoleting_style_id,
					name: style.obsoleting_style_name,
				},
				message: style.obsoletion_message
			}
			: undefined,
		deleteReason: style.admin_delete_reason_id ? { id: style.admin_delete_reason_id, message: "None" } : undefined,
		style: {
			css: style.css,
			settings,
		},
	};
}

async function getStyle(id, willMainBeArchived, willAdditionalBeArchived) {
	const usoStyle = await utils.retry(async () => await getStyleInfo(id), 20);
	const style = toBetterFormat(usoStyle, willMainBeArchived, willAdditionalBeArchived);
	const styleData = { ...convertStyle(style, willMainBeArchived, willAdditionalBeArchived), usoStyle };
	return styleData;
}

function convertFromUso(usoStyle, willMainBeArchived, willAdditionalBeArchived) {
	const style = toBetterFormat(usoStyle, willMainBeArchived, willAdditionalBeArchived);
	return { ...convertStyle(style), usoStyle };
}

function convertStyle(style) {
	const indexStyle = converters.toIndexEntry(style);
	const usercss = style.info.format === "uso" ? converters.toUsercss(style) : undefined;
	// const markdown = converters.toMarkdown(style);
	let screenshots = undefined;

	if (style.screenshots) {
		screenshots = [];
		if (style.screenshots.main)
			if (style.screenshots.main.name.includes("-")) {
				screenshots.push({ url: `https://userstyles.org/auto_style_screenshots/${style.screenshots.main.name}`, name: style.screenshots.main.name });
			}
			else {
				screenshots.push({ url: `https://userstyles.org/style_screenshots/${style.screenshots.main.name}`, name: style.screenshots.main.name });
			}
		if (style.screenshots.additional) {
			style.screenshots.additional.map(e => screenshots.push({ url: `https://userstyles.org/style_screenshots/${e.name}`, name: e.name }));
		}
	}
	return { id: style.id, style, indexStyle, usercss, screenshots };
}

async function saveStyle(styleData) {
	const { id, style, usoStyle, usercss, screenshots } = styleData;
	if (id) {
		if (style)
			await fs.writeFile(path.resolve(__dirname, "..", "data", "styles", `${id}.json`), JSON.stringify(style, null, 2), { encoding: "utf8" });
		if (usoStyle)
			await fs.writeFile(path.resolve(__dirname, "..", "data", "uso-styles", `${id}.json`), JSON.stringify(usoStyle, null, 2), { encoding: "utf8" });
		if (usercss)
			await fs.writeFile(path.resolve(__dirname, "..", "data", "usercss", `${id}.user.css`), usercss, { encoding: "utf8" });
		// if (markdown)
		// 	await fs.writeFile(path.resolve(__dirname, "..", "data", "markdown", `${id}.md`), markdown, { encoding: "utf8" });
	}

	if (screenshots && screenshots.length > 0) {
		for (const screenshot of screenshots) {
			await utils.retry(async () => {
				await utils.downloadFile(screenshot.url, path.resolve(__dirname, "..", "data", "screenshots", screenshot.name));
			}, 15);
		}
	}
	return styleData;
}

const placeholderRegex = /\/\*\[\[.*?\]\]\*\//gm;

function hasSettings(css) {
	return placeholderRegex.test(css);
}

function shouldBeFullyArchived(style) {
	return (style.stats.installs.total > 1000 && new Date(style.info.updatedAt) > new Date(2015, 1, 1, 0, 0, 0, 0)) || new Date(style.info.updatedAt) > new Date(2019, 1, 1, 0, 0, 0, 0) || (style.style && style.style.settings) || (style.screenshots && style.screenshots.additional && style.screenshots.additional.length > 0);
}

module.exports = {
	hasSettings,
	shouldBeFullyArchived,
	getPage,
	getStyleInfo,
	getStyle,
	convertStyle,
	convertFromUso,
	saveStyle,
	filenameFromScreenshotUrl,
	licenseToSpdx,
	toBetterFormat
};
