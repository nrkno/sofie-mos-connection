import {Socket} from 'net'
import {MosString128} from './dataTypes/mosString128'
import {MosTime} from './dataTypes/mosTime'
import {IMOSExternalMetaData} from './dataTypes/mosExternalMetaData'
import {IMOSListMachInfo, IMOSDefaultActiveX} from './mosModel/0_listMachInfo'

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

	constructor (socket: Socket) {
		this.socket = socket
		this.supportedProfiles = {
			deviceType: 'NCS',
			profile0: true,
			profile1: true,
			profile2: false,
			profile3: false,
			profile4: false,
			profile5: false,
			profile6: false,
			profile7: false
		}
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

}
