const chalk = require("chalk");

function print(type, topics, ...message) {
	console.log(`${chalk.gray("[")}${type} ${topics.join(chalk.gray(" | "))}${chalk.gray("]")} ${message.join(", ")}`);
}

function info(topics, ...message) {
	print(chalk.greenBright("INFO"), topics, ...message);
}

function warn(topics, ...message) {
	print(chalk.yellowBright("WARN"), topics, ...message);
}

function error(topics, ...message) {
	print(chalk.redBright("ERROR"), topics, ...message.map(e => formatError(e)));
}

function formatError(error) {
	if (error instanceof Error) {
		const stack = matchStack(error.stack).map(e => `    ${chalk.gray("at")} ${e.function ? `${e.function} (${chalk.cyan(e.location)})` : chalk.cyan(e.location)}`).join("\n");
		return `${error.name === "Error" ? "" : `${error.name}: `}${error.message}${error.stack ? `
${stack}` : ""}`;
	}
	else {
		return error;
	}
}

function matchStack(str) {
	const regex = /at (?:(?<function>.*?) \((?<location>.*?)\)|(?<location2>.*?))$/gm;
	let m;
	let result = [];

	while ((m = regex.exec(str)) !== null) {
		if (m.index === regex.lastIndex) {
			regex.lastIndex++;
		}
    
		result.push({ location: m.groups.location || m.groups.location2, function: m.groups.function });
	}

	return result;
}

module.exports = {
	print,
	info,
	warn,
	error
};
