# Sofie MOS-Connection

[![Tests](https://github.com/nrkno/sofie-mos-connection/actions/workflows/node.yaml/badge.svg)](https://github.com/nrkno/sofie-mos-connection/actions/workflows/node.yaml)
[![codecov](https://codecov.io/gh/nrkno/sofie-mos-connection/branch/master/graph/badge.svg?token=LQL02uXajF)](https://codecov.io/gh/nrkno/sofie-mos-connection)

This is the _MOS-Connection_ library of the [**Sofie** TV Automation System](https://github.com/nrkno/Sofie-TV-automation/), used for connecting to a _MOS_ device using the [MOS Protocol](http://mosprotocol.com/).

## General Sofie System Information

- [_Sofie_ Documentation](https://nrkno.github.io/sofie-core/)
- [_Sofie_ Releases](https://nrkno.github.io/sofie-core/releases)
- [Contribution Guidelines](CONTRIBUTING.md)
- [License](LICENSE)

---

## Getting Started

```typescript
import { MosConnection } from '@mos-connection/connector'

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
	device.onRequestMachineInfo(() => {})
	device.onCreateRunningOrder((ro) => {})
	device.onDeleteRunningOrder((RunningOrderID: MosString128) => {})
	device.onReadyToAir(() => {})
	// ...
})
```

## MOS Support

The MOS-Connection library currently supports the [MOS Protocol version **2.8.5**](https://mosprotocol.com/wp-content/MOS-Protocol-Documents/MOS_Protocol_Version_2.8.5_Final.htm).

### Supported MOS Profiles

| Profile   | Status                |
| --------- | --------------------- |
| Profile 0 | Implemented           |
| Profile 1 | Implemented           |
| Profile 2 | Implemented           |
| Profile 3 | Implemented           |
| Profile 4 | Implemented           |
| Profile 5 | Not implemented (yet) |
| Profile 6 | Not implemented (yet) |
| Profile 7 | Not implemented (yet) |

Pull Requests for the remaining profiles would be happily accepted!

## Packages

MOS-Connection consists of 3 packages:

- **@mos-connection/connector** is a Node.js library is used to connect to MOS devices or act as a MOS Server/NCS.
  The `helper` and `model` functionality is included in this library as well.
- **@mos-connection/helper** is a library that provides various functions useful for those that prepare/handle data that will be sent to (or has been received by) the MOS-connection.
  The `model` functionality is included in this library as well.
- **@mos-connection/model** is a library that contains types and enums, useful for applications that handles MOS-data.

There is also a helper application **quickMos** designed to be a minimal mock MOS server for testing client applications.

---

_The NRK logo is a registered trademark of Norsk rikskringkasting AS. The license does not grant any right to use, in any way, any trademarks, service marks or logos of Norsk rikskringkasting AS._
