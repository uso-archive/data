const fetch = require("node-fetch");

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
	json.user.email = "redacted";
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
		return " CC-BY-NC-SA-4.0";
	case "ccbyncnd":
		return " CC-BY-NC-ND-4.0";
	}
	return "NO-REDISTRIBUTION";
}

function toBetterFormat(style, isScreenshotArchived) {
	return {
		id: style.id,
		info: {
			name: style.name,
			description: style.description,
			additionalInfo: style.additional_info,
			format: "uso",
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
		screenshots: {
			main: filenameFromScreenshotUrl(style.after_screenshot_name || style.screenshot_url || style.screenshot || undefined),
			isMainArchived: !!isScreenshotArchived,
			additional: style.screenshots ? style.screenshots.map((s) => filenameFromScreenshotUrl(s)) : undefined,
		},
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
			settings: style.style_settings
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
					: undefined,
		},
	};
}


const placeholderRegex = /\/\*\[\[.*?\]\]\*\//gm;

function hasSettings(css) {
	return placeholderRegex.test(css);
}

module.exports = {
	hasSettings,
	getPage,
	getStyleInfo,
	filenameFromScreenshotUrl,
	licenseToSpdx,
	toBetterFormat
};
