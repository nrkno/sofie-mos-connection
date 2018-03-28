import * as XMLBuilder from 'xmlbuilder'
import {Socket} from 'net'
import {MosString128} from './dataTypes/mosString128'
import {MosTime} from './dataTypes/mosTime'
import {IMOSExternalMetaData} from './dataTypes/mosExternalMetaData'
import {IMOSListMachInfo, IMOSDefaultActiveX} from './mosModel/0_listMachInfo'
import { IMOSDeviceConnectionOptions } from './api'
import { IConnectionConfig } from './config/connectionConfig'

export class MosDevice {

	id: string
	socket: Socket
	manufacturer: MosString128
	model: MosString128
	hwRev: MosString128
	swRev: MosString128
	DOM: MosTime
	SN: MosString128
	ID: MosString128
	time: MosTime
	opTime: MosTime
	mosRev: MosString128
	supportedProfiles: any
	defaultActiveX: Array<IMOSDefaultActiveX>
	mosExternalMetaData: Array<IMOSExternalMetaData>

	constructor (socket: Socket, connectionConfig: IConnectionConfig, connectionOptions: IMOSDeviceConnectionOptions) {
		let supportedProfiles = {
			deviceType: 'MOS',
			profile0: false,
			profile1: false,
			profile2: false,
			profile3: false,
			profile4: false,
			profile5: false,
			profile6: false,
			profile7: false
		}
		if (connectionConfig) {
			if(connectionConfig.profiles['0']) supportedProfiles.profile0 = true 
			if(connectionConfig.profiles['1']) supportedProfiles.profile1 = true 
		}

		this.socket = socket
		this.manufacturer = new MosString128('RadioVision, Ltd.')
		this.model = new MosString128('TCS6000')
		this.hwRev = new MosString128('0.1') // empty string returnes <hwRev/>
		this.swRev = new MosString128('0.1')
		this.DOM = new MosTime()
		this.SN = new MosString128('927748927')
		this.ID = new MosString128(connectionConfig ? connectionConfig.mosID : '')
		this.time = new MosTime()
		this.opTime = new MosTime()
		this.mosRev = new MosString128("2.8.5")
		this.supportedProfiles = supportedProfiles

		this.socket.on('data', this.onData)
	}

	onData (data: any) {
		console.log('onData', data)
	}
	
	getMachineInfo (): Promise<IMOSListMachInfo> {
		// @todo: implement this

		return new Promise((resolve) => {
			let list:IMOSListMachInfo = {
				manufacturer: this.manufacturer,
				model: this.model,
				hwRev: this.hwRev,
				swRev: this.swRev,
				DOM: this.DOM,
				SN: this.SN,
				ID: this.ID,
				time: this.time,
				opTime: this.opTime,
				mosRev: this.mosRev,
				supportedProfiles: this.supportedProfiles,
				defaultActiveX: this.defaultActiveX,
				mosExternalMetaData: this.mosExternalMetaData 
			}
			resolve(list)
		})
	}

	get messageXMLBlocks(): XMLBuilder.XMLElementOrXMLNode {
		let root = XMLBuilder.create('listMachInfo') // config headless 
		root.ele('manufacturer', this.manufacturer.toString())
		root.ele('model', this.model.toString())
		root.ele('hwRev', this.hwRev.toString())
		root.ele('swRev', this.swRev.toString())
		root.ele('DOM', this.DOM.toString())
		root.ele('SN', this.SN.toString())
		root.ele('ID', this.ID.toString())
		root.ele('time', this.time.toString())
		root.ele('opTime', this.opTime.toString())
		root.ele('mosRev', this.mosRev.toString())

		let p = root.ele('supportedProfiles').att('deviceType', this.supportedProfiles.deviceType)
		for(let i = 0; i < 8; i++) { // constant for # av profiles?
			p.ele('mosProfile', (this.supportedProfiles['profile'+i] ? 'YES' : 'NO')).att('number', i)
		}

		// root.ele('defaultActiveX', this.manufacturer)
		// root.ele('mosExternalMetaData', this.manufacturer) import from IMOSExternalMetaData
		return root
	}




}
