import {Socket} from 'net'
import {MosString128} from './dataTypes/mosString128'
import {MosTime} from './dataTypes/mosTime'
import {MosExternalMetaData} from './dataTypes/mosExternalMetaData'
import {IMOSListMachInfo, IMOSListMachInfoDefaultActiveXMode} from './mosModel/0_listMachInfo'

export class MosDevice {

	id: string
	socket: Socket

	constructor (socket: Socket) {
		this.socket = socket
	}
	
	getMachineInfo (): Promise<IMOSListMachInfo> {
		// @todo: implement this

		return new Promise((resolve) => {
			let list:IMOSListMachInfo = {
				manufacturer: new MosString128('Manufacturer'),
				model: new MosString128('Model text desc.'),
				hwRev: new MosString128('Hardware Revision'),
				swRev: new MosString128('Software Revision'),
				DOM: new MosTime(),
				SN: new MosString128('Serial number'),
				ID: new MosString128('ID of a Machine'),
				time: new MosTime(),
				opTime: new MosTime(),
				mosRev: new MosString128('Mos revision'),
				supportedProfiles: {
					deviceType: 'NCS',
					profile0: true,
					profile1: true,
					profile2: false,
					profile3: false,
					profile4: false,
					profile5: false,
					profile6: false,
					profile7: false
				},
				defaultActiveX: [{
					mode: IMOSListMachInfoDefaultActiveXMode.MODALDIALOG,
					controlFileLocation: 'file/path',
					controlSlug: new MosString128('controlSlug'),
					controlName: 'controlName',
					controlDefaultParams: 'URL=test.ncs.com'
				}],
				mosExternalMetaData: [{
				}]
			}
			resolve(list)
		})

	}

}
