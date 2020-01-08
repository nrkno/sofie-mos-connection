module.exports = {
	globals: {
		'ts-jest': {
			tsConfigFile: 'tsconfig.json'
		}
	},
	moduleFileExtensions: [
		'ts',
		'js'
	],
	transform: {
		'^.+\\.(ts|tsx)$': 'ts-jest'
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