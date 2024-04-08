// eslint-disable-next-line no-undef
module.exports = {
	extends: ['@commitlint/config-conventional'],
	rules: {
		'type-enum': [
			2,
			'always',
			[
				'build',
				'chore',
				'ci',
				'docs',
				'feat',
				'fix',
				'perf',
				'refactor',
				'revert',
				'style',
				'test',
				'release', // force a new patch release regardless of the commit message
				'minor', // create a new minor release to match the Camunda Platform version
			],
		],
	},
}
