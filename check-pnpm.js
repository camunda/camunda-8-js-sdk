// check-yarn.js
if (!process.env.npm_execpath.includes('pnpm')) {
	console.error("You must use pnpm to install dependencies.");
	process.exit(1);
}
