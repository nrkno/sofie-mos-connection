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
