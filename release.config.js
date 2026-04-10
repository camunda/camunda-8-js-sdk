// Branch model (mirrors orchestration-cluster-api-js):
//
// - main:                           alpha prereleases (npm dist-tag: alpha)
// - stable/<major>.<minor> (current): stable releases  (npm dist-tag: latest)
// - stable/<major>.<minor> (other):   maintenance       (npm dist-tag: <major>.<minor>-stable)
//
// The current stable minor is set via the GitHub repo variable
// CAMUNDA_SDK_CURRENT_STABLE_MINOR (e.g. "8.8").

function currentBranchName() {
	if (process.env.GITHUB_REF_NAME) return process.env.GITHUB_REF_NAME;
	try {
		// eslint-disable-next-line no-undef, @typescript-eslint/no-var-requires
		const { execSync } = require('node:child_process');
		return execSync('git rev-parse --abbrev-ref HEAD', {
			stdio: ['ignore', 'pipe', 'ignore'],
		})
			.toString()
			.trim();
	} catch {
		return '';
	}
}

function stableMinorFromBranch(branch) {
	const m = /^stable\/(\d+\.\d+)$/.exec(branch);
	return m ? m[1] : null;
}

function stableDistTagForMinor(minor) {
	return `${minor}-stable`;
}

function envCurrentStableMinor() {
	const v = (process.env.CAMUNDA_SDK_CURRENT_STABLE_MINOR || '').trim();
	return /^\d+\.\d+$/.test(v) ? v : null;
}

const branch = currentBranchName();
const stableMinor = stableMinorFromBranch(branch);
const currentStableMinor = envCurrentStableMinor();

function maintenanceBranchConfig(branchName, minor) {
	return {
		name: branchName,
		range: `${minor}.x`,
		channel: stableDistTagForMinor(minor),
	};
}

function dedupeBranches(branches) {
	const seen = new Set();
	const out = [];
	for (const b of branches) {
		const name = typeof b === 'string' ? b : b?.name;
		if (!name) continue;
		if (seen.has(name)) continue;
		seen.add(name);
		out.push(b);
	}
	return out;
}

// eslint-disable-next-line no-undef
module.exports = {
	repositoryUrl: 'https://github.com/camunda/camunda-8-js-sdk.git',
	branches: dedupeBranches([
		// Alpha prereleases from main.
		{
			name: 'main',
			prerelease: 'alpha',
			channel: 'alpha',
		},

		// The configured current stable line publishes to npm dist-tag `latest`.
		...(currentStableMinor
			? [
				{
					name: `stable/${currentStableMinor}`,
					channel: 'latest',
				},
			]
			: []),

		// Any other stable/* branch publishes as a maintenance line.
		...(stableMinor && stableMinor !== currentStableMinor
			? [maintenanceBranchConfig(branch, stableMinor)]
			: []),
	]),
	plugins: [
		[
			'@semantic-release/commit-analyzer',
			{
				// Mutated semver: patch for normal work, minor/major reserved
				// for Camunda server line bumps.
				releaseRules: [
					{ type: 'feat', release: 'patch' },
					{ type: 'fix', release: 'patch' },
					{ type: 'perf', release: 'patch' },
					{ type: 'revert', release: 'patch' },
					{ type: 'release', release: 'patch' },
					{ breaking: true, release: 'patch' },
					// server: => minor bump (e.g. 8.8 -> 8.9)
					{ type: 'server', release: 'minor' },
					// server-major: => major bump (e.g. 8.x -> 9.0)
					{ type: 'server-major', release: 'major' },
				],
			},
		],
		'@semantic-release/release-notes-generator',
		'@semantic-release/changelog',
		[
			'@semantic-release/npm',
			{
				npmPublish: true,
			},
		],
		[
			'@semantic-release/git',
			{
				assets: ['package.json', 'package-lock.json', 'CHANGELOG.md'],
				message:
					'chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}',
			},
		],
		[
			'@semantic-release/github',
			{
				successComment:
					'Released in `${nextRelease.gitTag}` (npm: `@camunda8/sdk@${nextRelease.version}`).',
			},
		],
	],
};
