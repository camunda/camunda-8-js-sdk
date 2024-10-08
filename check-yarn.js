// check-yarn.js
if (!process.env.npm_execpath.includes('yarn')) {
	console.error("You must use Yarn to install dependencies.");
	process.exit(1);
}
