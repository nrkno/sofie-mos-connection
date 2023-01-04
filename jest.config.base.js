module.exports = {
	roots: ['<rootDir>/src'],
	projects: ['<rootDir>'],
	preset: 'ts-jest',
	// globals: {
	// 	'ts-jest': {
	// 		tsconfig: 'tsconfig.json',
	// 	},
	// },
	moduleFileExtensions: ['js', 'ts'],
	transform: {
		'^.+\\.(ts|tsx)$': ['ts-jest', {}],
	},
	testMatch: ['**/__tests__/**/*.spec.(ts|js)'],
	testEnvironment: 'node',
	coverageThreshold: {
		global: {
			branches: 0,
			functions: 0,
			lines: 0,
			statements: 0,
		},
	},
	coverageDirectory: '<rootDir>/coverage/',
	collectCoverage: false,
	// verbose: true,
}
