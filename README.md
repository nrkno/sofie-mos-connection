# MOS-Connection

[![Tests](https://github.com/nrkno/sofie-mos-connection/actions/workflows/node.yaml/badge.svg)](https://github.com/nrkno/sofie-mos-connection/actions/workflows/node.yaml)
[![codecov](https://codecov.io/gh/nrkno/sofie-mos-connection/branch/master/graph/badge.svg?token=LQL02uXajF)](https://codecov.io/gh/nrkno/sofie-mos-connection)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=nrkno_tv-automation-mos-connection&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=nrkno_tv-automation-mos-connection)

[![@mos-connection/connector NPM Version](https://img.shields.io/npm/v/%40mos-connection%2Fconnector)](https://www.npmjs.com/package/@mos-connection/connector)
[![@mos-connection/helper NPM Version](https://img.shields.io/npm/v/%40mos-connection%2Fhelper)](https://www.npmjs.com/package/@mos-connection/helper)
[![@mos-connection/model NPM Version](https://img.shields.io/npm/v/%40mos-connection%2Fmodel)](https://www.npmjs.com/package/@mos-connection/model)

_MOS-Connection_ is a Node.js library to communicate, using the [MOS Protocol](http://mosprotocol.com/), with systems such as Newsroom Computer Systems (NRCS) or other MOS devices.

Features include:

- Acting as a _MOS Device_ (ie a client), connecting to an NRCS.
- Acting as a _NRCS_ (ie a server), allowing other MOS Devices to connect to it.
- Helpful tools for developing _MOS Plugins_ and parsing MOS data.
- A simple tool for testing MOS connections, called _Quick-MOS_.

This library is developed as a part of the [**Sofie** TV Automation System](https://github.com/nrkno/Sofie-TV-automation/).

## General Sofie System Information

- [_Sofie_ Documentation](https://nrkno.github.io/sofie-core/)
- [_Sofie_ Releases](https://nrkno.github.io/sofie-core/releases)
- [Contribution Guidelines](CONTRIBUTING.md)
- [License](LICENSE)

---

## Packages

MOS-Connection consists of 4 packages:

- **@mos-connection/connector** is a Node.js library is used to connect to MOS devices or act as a MOS Server/NCS.
  The `helper` and `model` functionality is included in this library as well.
- **@mos-connection/helper** is a library that provides various functions useful for those that prepare/handle data that will be sent to (or has been received by) the MOS-connection.
  The `model` functionality is included in this library as well.
- **@mos-connection/model** is a library that contains types and enums, useful for applications that handles MOS-data.
- There is also a helper application **QuickMos** designed to be a minimal mock MOS server for testing client applications.

## Getting Started

### Installation

```bash
npm install @mos-connection/connector
```

### Usage

\_See more examples in the [examples](/packages/examples/src) folder, or the [QuickMos](/packages/quick-mos/src/index.ts) implementation!

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

### Quick-MOS

"Quick-MOS" is a simple MOS application that can be used to test the MOS-connection library.

It reads data-files from disk and pretends to be an NRCS, so you can connect other MOS-clients to it.

See [Quick-MOS](/packages/quick-mos/README.md) for more information.

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

---

_The NRK logo is a registered trademark of Norsk rikskringkasting AS. The license does not grant any right to use, in any way, any trademarks, service marks or logos of Norsk rikskringkasting AS._
