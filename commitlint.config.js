// eslint-disable-next-line no-undef
module.exports = {
	extends: ['@commitlint/config-conventional'],
	rules: {
		'body-max-line-length': [2, 'always', 500],
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
				'server', // create a new minor release to match a Camunda Platform minor bump
				'server-major', // create a new major release to match a Camunda Platform major bump
			],
		],
	},
}
