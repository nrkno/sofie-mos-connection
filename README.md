# MOS-Connection

Library for connecting to a Mos-device

Based on http://mosprotocol.com

*Note: This library is currently under heavy develpoment, expect breaking changes.*

## Getting started

```typescript
import {MosConnection} from 'mos-connection'

let mos = new MosConnection(new ConnectionConfig({
	mosID: 'my.mos.application',
	acceptsConnections: true,
	profiles: {
		'0': true,
        '1': true,
        '2': true,
        '4': true
	},
	openRelay: true
	debug: false
}))
mos.onConnection((device: MosDevice) => { // called whenever there is a new connection to a mos-device
	if (device.hasConnection) { // true if we can send messages to the mos-server
	    device.getMachineInfo().then((lm) => {
			console.log('Machineinfo', lm)
		})
	}
	// Setup callbacks to pipe data:
	device.onGetMachineInfo(() => {})
	device.onCreateRunningOrder((ro) => {})
	device.onDeleteRunningOrder((RunningOrderID: MosString128) => {})
	device.onReadyToAir(() => {})
	// ...
})
```

## Development status:
### Basic connections
Working in dev environment
### Profile 0
* Implemented
### Profile 1
* Implemented
### Profile 2
* Implemented
### Profile 3
* Not started
### Profile 4
* Implemented
### Profile 5
* Not started
### Profile 6
* Not started
### Profile 7
* Not started


## Contingency for "forced release"

One of the goals for this system is to not prevent any blockers in the case a version has to be "forced out". The system should not be in the way. The initial idea was to have a manual step which would simply release a version without doing checking etc. As we discovered, there are a few issues with this.

1. The library needs to be built from TS, so we already have some basic requirement already; that the code compiles.
2. If a forced system should be made, that code would be a bit hacky, and perhaps cause version-problems when releasing to NPM
3. Code that bypasses the testing and the general system in place is extra work to maintain, and is another source of potential errors.

Because of these, and perhaps other reasons, my (Stephan's) suggested solution to the forced release problem is as follow.

I believe that it is a better solution to have clean code in the codebase, so no hacks to make a manual release process, and rather have the
code that should be released more "hacky". By this I mean that if there are some tests, or some other aspects of the current working code that does not pass testing, I believe it is a better solution to temporarily remove the tests from the code which you want to release, rather than permanently having code in the repo which is addressing this potential problem which, hopefully, should never happen.

The full workflow for a pushed release would then become:

1. Merge code to master as normal.
2. The code does not pass tests, and everything is on fire. This version will fix everything.
3. Make a new branch, "hotfix/solutionToAllMyCurrentProblems"
4. Remove any unit-tests that fails to force this version to be release
5. Remove any other tests, or sub-systems, that fails (eg. document-generation)
6. Make a new PR, and merge to master as normally.
7. Repeat 3-6 as needed if anything else break.
8. The new version should be out now, and crisis hopefully averted.
9. Make plans for how to re-introduce all the tests, and other parts which were removed in order to solve this pressing issue.
