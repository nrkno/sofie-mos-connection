module.exports = {
	globals: {
		'ts-jest': {
			tsConfigFile: 'tsconfig.jest.json'
		}
	},
	moduleFileExtensions: [
		'ts',
		'js'
	],
	transform: {
		'^.+\\.(ts|tsx)$': './node_modules/ts-jest/preprocessor.js'
	},
	testMatch: [
		'**/integrationTests/**/*.(spec|test).(ts|js)'
	],
	testEnvironment: 'node',
	coverageThreshold: {
		"global": {
		  "branches": 0,
		  "functions": 0,
		  "lines": 0,
		  "statements": 0
		}
	  }
};