import * as XMLBuilder from 'xmlbuilder'
import { Socket } from 'net'
import { NCSServerConnection } from './connection/NCSServerConnection'
import { MosString128 } from './dataTypes/mosString128'
import { MosTime } from './dataTypes/mosTime'
import { IMOSExternalMetaData } from './dataTypes/mosExternalMetaData'
import { IMOSListMachInfo, IMOSDefaultActiveX } from './mosModel/0_listMachInfo'
import { ROAck } from './mosModel/ROAck'
import { ReqMachInfo } from './mosModel/0_reqMachInfo'
import {
	IMOSDeviceConnectionOptions,
	IMOSObject,
	IMOSDevice,
	IMOSRunningOrder,
	IMOSRunningOrderBase,
	IMOSRunningOrderStatus,
	IMOSStoryStatus,
	IMOSItemStatus,
	IMOSROReadyToAir,
	IMOSStoryAction,
	IMOSItem,
	IMOSROAction,
	IMOSROStory,
	IMOSItemAction,
	IMOSROFullStory,
	IMOSROAck,
	IMOSConnectionStatus
} from './api'
import { IConnectionConfig } from './config/connectionConfig'
import { SocketDescription } from './connection/socketConnection'
import * as parser from 'xml2json'
const iconv = require('iconv-lite')

export class MosDevice implements IMOSDevice {

	// private _host: string
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
	defaultActiveX: Array<IMOSDefaultActiveX>
	mosExternalMetaData: Array<IMOSExternalMetaData>

	private _id: string

	private supportedProfiles = {
		deviceType: 'MOS',
		profile0: false,
		profile1: false,
		profile2: false,
		profile3: false,
		profile4: false,
		profile5: false,
		profile6: false,
		profile7: false
	} // Use same names as IProfiles?

	// private _profiles: ProfilesSupport
	private _primaryConnection: NCSServerConnection
	private _secondaryConnection: NCSServerConnection
	private _currentConnection: NCSServerConnection

	// Profile 0
	private _callbackOnGetMachineInfo: () => Promise<IMOSListMachInfo>
	private _callbackOnConnectionChange: (connectionStatus: IMOSConnectionStatus) => void

	// Profile 1
	private _callbackOnRequestMOSOBject: (objId: string) => Promise<IMOSObject | null> 
	private _callbackOnRequestAllMOSObjects: () => Promise<Array<IMOSObject>>

	// Profile 2
	private _callbackOnCreateRunningOrder: (ro: IMOSRunningOrder) => Promise<IMOSROAck>
	private _callbackOnReplaceRunningOrder: (ro: IMOSRunningOrder) => Promise<IMOSROAck>
	private _callbackOnDeleteRunningOrder: (runningOrderId: MosString128) => Promise<IMOSROAck>
	private _callbackOnRequestRunningOrder: (runningOrderId: MosString128) => Promise<IMOSRunningOrder | null>
	private _callbackOnMetadataReplace: (metadata: IMOSRunningOrderBase) => Promise<IMOSROAck>
	private _callbackOnRunningOrderStatus: (status: IMOSRunningOrderStatus) => Promise<IMOSROAck>
	private _callbackOnStoryStatus: (status: IMOSStoryStatus) => Promise<IMOSROAck>
	private _callbackOnItemStatus: (status: IMOSItemStatus) => Promise<IMOSROAck>
	private _callbackOnReadyToAir: (Action: IMOSROReadyToAir) => Promise<IMOSROAck>
	private _callbackOnROInsertStories: (Action: IMOSStoryAction, Stories: Array<IMOSROStory>) => Promise<IMOSROAck>
	private _callbackOnROInsertItems: (Action: IMOSItemAction, Items: Array<IMOSItem>) => Promise<IMOSROAck>
	private _callbackOnROReplaceStories: (Action: IMOSStoryAction, Stories: Array<IMOSROStory>) => Promise<IMOSROAck>
	private _callbackOnROReplaceItems: (Action: IMOSItemAction, Items: Array<IMOSItem>) => Promise<IMOSROAck>
	private _callbackOnROMoveStories: (Action: IMOSStoryAction, Stories: Array<MosString128>) => Promise<IMOSROAck>
	private _callbackOnROMoveItems: (Action: IMOSItemAction, Items: Array<MosString128>) => Promise<IMOSROAck>
	private _callbackOnRODeleteStories: (Action: IMOSROAction, Stories: Array<MosString128>) => Promise<IMOSROAck>
	private _callbackOnRODeleteItems: (Action: IMOSStoryAction, Items: Array<MosString128>) => Promise<IMOSROAck>
	private _callbackOnROSwapStories: (Action: IMOSROAction, StoryID0: MosString128, StoryID1: MosString128) => Promise<IMOSROAck>
	private _callbackOnROSwapItems: (Action: IMOSStoryAction, ItemID0: MosString128, ItemID1: MosString128) => Promise<IMOSROAck>

	// Profile 4
	private _callbackOnROStory: (story: IMOSROFullStory) => Promise<any>

	private _tmp: string = ''

	constructor (
		connectionConfig: IConnectionConfig,
		primaryConnection: NCSServerConnection,
		secondaryConnection: NCSServerConnection | null
	) {
		this.socket = new Socket()
		// Add params to this in MosConnection/MosDevice
		this.manufacturer = new MosString128('RadioVision, Ltd.')
		this.model = new MosString128('TCS6000')
		this.hwRev = new MosString128('0.1') // empty string returnes <hwRev/>
		this.swRev = new MosString128('0.1')
		this.DOM = new MosTime()
		this.SN = new MosString128('927748927')
		this.ID = new MosString128(connectionConfig ? connectionConfig.mosID : '')
		this.time = new MosTime()
		this.opTime = new MosTime()
		this.mosRev = new MosString128('2.8.5')

		if (connectionConfig) {
			if (connectionConfig.profiles['0']) this.supportedProfiles.profile0 = true
			if (connectionConfig.profiles['1']) this.supportedProfiles.profile1 = true
			if (connectionConfig.profiles['2']) this.supportedProfiles.profile2 = true
			if (connectionConfig.profiles['3']) this.supportedProfiles.profile3 = true
			if (connectionConfig.profiles['4']) this.supportedProfiles.profile4 = true
			if (connectionConfig.profiles['5']) this.supportedProfiles.profile5 = true
			if (connectionConfig.profiles['6']) this.supportedProfiles.profile6 = true
			if (connectionConfig.profiles['7']) this.supportedProfiles.profile7 = true
		}

		this._primaryConnection = primaryConnection
		this._currentConnection = this._primaryConnection
		if (secondaryConnection) {
			this._secondaryConnection = secondaryConnection
		}
	}

	get id (): string {
		return this._id
	}

	get messageXMLBlocks (): XMLBuilder.XMLElementOrXMLNode {
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
		for (let i = 0; i < 8; i++) {
			p.ele('mosProfile', (this.supportedProfiles['profile' + i] ? 'YES' : 'NO')).att('number', i)
		}

		// root.ele('defaultActiveX', this.manufacturer)
		// root.ele('mosExternalMetaData', this.manufacturer) import from IMOSExternalMetaData
		return root
	}

	onData (e:SocketDescription, socketID: number, data: string): void {
		console.log(`Socket got data (${socketID}, ${e.socket.remoteAddress}, ${e.portDescription}): ${data}`)

		let parsed = null
		let parse_options = {
			object: true,
			coerce: true,
			trim: true
		}
		let first = data.substr(0, 10)
		let first_match = '\u0000<\u0000m\u0000o\u0000s\u0000>' // <mos>
		let last = data.substr(data.length - 15)
		let last_match = '<\u0000/\u0000m\u0000o\u0000s\u0000>\u0000\r\u0000\n' // </mos>

		// Data ready to be parsed
		if(first === first_match && last === last_match) {
			parsed = parser.toJson(data, parse_options)

		// Last chunk, ready to parse with saved data
		} else if(last === last_match) {
			parsed = parser.toJson(this._tmp + data, parse_options)
			this._tmp = ''

		// Chunk, save for later
		} else {
			this._tmp += data
		}

		// Route data and reply to socket
		if (parsed !== null) {
			this.routeData(parsed).then((resp) => {
				let buf = iconv.encode(resp, 'utf16-be')
				e.socket.write(buf, 'usc2')
			})
		}

	}

	routeData (data:object): Promise<any> {
		let keys = Object.keys(data.mos)
		let key = keys[3]

		return new Promise((resolve, reject) => {
			console.log('parsedData', data)
			console.log('parsedTest', keys)

			// Route and format data
			if (key === 'roReadyToAir' && typeof this._callbackOnReadyToAir === 'function') {
				this._callbackOnReadyToAir({
					ID: data.mos.roReadyToAir.roID,
					Status: data.mos.roReadyToAir.roAir
				}).then(this.createROAck).then((ack) => {
					ack.mosID = data.mos.mosID
					ack.ncsID = data.mos.ncsID
					ack.prepare()
					resolve(ack.toString())
				})

			} else if (key === 'roStoryMove' && typeof this._callbackOnROMoveStories === 'function') {
				this._callbackOnROMoveStories({
					StoryID: data.mos.roStoryMove.roID
				}, [
					data.mos.roStoryMove.storyID[0],
					data.mos.roStoryMove.storyID[1]
				]).then(this.createROAck).then((ack) => {
					ack.mosID = data.mos.mosID
					ack.ncsID = data.mos.ncsID
					ack.prepare()
					resolve(ack.toString())
				})

			// TODO: Use MosMessage instead of string
			// TODO: Use reject if function dont exists? Put Nack in ondata
			} else {
				resolve('<mos><mosID>test2.enps.mos</mosID><ncsID>2012R2ENPS8VM</ncsID><messageID>99</messageID><roAck><roID>2012R2ENPS8VM;P_ENPSMOS\W\F_HOLD ROs;DEC46951-28F9-4A11-8B0655D96B347E52</roID><roStatus>Unknown object M000133</roStatus><storyID>5983A501:0049B924:8390EF2B</storyID><itemID>0</itemID><objID>M000224</objID><status>LOADED</status><storyID>3854737F:0003A34D:983A0B28</storyID><itemID>0</itemID><objID>M000133</objID><itemChannel>A</itemChannel><status>UNKNOWN</status></roAck></mos>')
			}

		})
	}

	createROAck (resp:IMOSROAck): Promise<ROAck> {
		return new Promise((resolve, reject) => {
			let ack = new ROAck()
			ack.ID = resp.ID
			ack.Status = resp.Status
			ack.Stories = resp.Stories
			resolve(ack)
		})
	}

	/* Profile 0 */
	getMachineInfo (): Promise<IMOSListMachInfo> {
		let message = new ReqMachInfo()

		return new Promise((resolve) => {
			this._currentConnection.executeCommand(message).then((data) => {
				let listMachInfo = data.mos.listMachInfo
				let list: IMOSListMachInfo = {
					manufacturer: listMachInfo.manufacturer,
					model: listMachInfo.model,
					hwRev: listMachInfo.hwRev,
					swRev: listMachInfo.swRev,
					DOM: listMachInfo.DOM,
					SN: listMachInfo.SN,
					ID: listMachInfo.ID,
					time: listMachInfo.time,
					opTime: listMachInfo.opTime,
					mosRev: listMachInfo.mosRev,
					supportedProfiles: this.supportedProfiles,		// TODO: No data from ENPS, needs test!
					defaultActiveX: this.defaultActiveX,			// TODO: No data from ENPS, needs test!
					mosExternalMetaData: this.mosExternalMetaData	// TODO: No data from ENPS, needs test!
				}
				resolve(list)
			})
		})
	}

	onGetMachineInfo (cb: () => Promise<IMOSListMachInfo>) {
		this._callbackOnGetMachineInfo = cb
	}

	onConnectionChange (cb: (connectionStatus: IMOSConnectionStatus) => void) {
		this._callbackOnConnectionChange = cb
	}

	getConnectionStatus (): IMOSConnectionStatus {
		// TODO: Implement this
	}

	/* Profile 1 */
	onRequestMOSObject (cb: (objId: string) => Promise<IMOSObject | null>) {
		this._callbackOnRequestMOSOBject = cb
	}

	onRequestAllMOSObjects (cb: () => Promise<Array<IMOSObject>>) {
		this._callbackOnRequestAllMOSObjects = cb
	}

	getMOSObject (objID: string): Promise<IMOSObject> {
		// TODO: Implement this
	}

	getAllMOSObjects (): Promise<Array<IMOSObject>> {
		// TODO: Implement this
	}

	/* Profile 2 */
	onCreateRunningOrder (cb: (ro: IMOSRunningOrder) => Promise<IMOSROAck>) {
		this._callbackOnCreateRunningOrder = cb
	}

	onReplaceRunningOrder (cb: (ro: IMOSRunningOrder) => Promise<IMOSROAck>) {
		this._callbackOnReplaceRunningOrder = cb
	}

	onDeleteRunningOrder (cb: (runningOrderId: MosString128) => Promise<IMOSROAck>) {
		this._callbackOnDeleteRunningOrder = cb
	}

	//onRequestRunningOrder: (cb: (runningOrderId: MosString128) => Promise<IMOSRunningOrder | null>) => void // get roReq, send roList
	onRequestRunningOrder (cb: (runningOrderId: MosString128) => Promise<IMOSRunningOrder | null>) {
		this._callbackOnRequestRunningOrder = cb
	}

	getRunningOrder (runningOrderId: MosString128): Promise<IMOSRunningOrder | null> {
		// TODO: Implement this
	}

	onMetadataReplace (cb: (metadata: IMOSRunningOrderBase) => Promise<IMOSROAck>) {
		this._callbackOnMetadataReplace = cb
	}

	onRunningOrderStatus (cb: (status: IMOSRunningOrderStatus) => Promise<IMOSROAck>) {
		this._callbackOnRunningOrderStatus = cb
	}

	onStoryStatus (cb: (status: IMOSStoryStatus) => Promise<IMOSROAck>) {
		this._callbackOnStoryStatus = cb
	}

	onItemStatus (cb: (status: IMOSItemStatus) => Promise<IMOSROAck>) {
		this._callbackOnItemStatus = cb
	}

	setRunningOrderStatus (status: IMOSRunningOrderStatus): Promise<IMOSROAck> {
		// TODO: Implement this
	}

	setStoryStatus (status: IMOSStoryStatus): Promise<IMOSROAck> {
		// TODO: Implement this
	}

	setItemStatus (status: IMOSItemStatus): Promise<IMOSROAck> {
		// TODO: Implement this
	}

	onReadyToAir (cb: (Action: IMOSROReadyToAir) => Promise<IMOSROAck>) {
		this._callbackOnReadyToAir = cb
	}

	onROInsertStories (cb: (Action: IMOSStoryAction, Stories: Array<IMOSROStory>) => Promise<IMOSROAck>) {
		this._callbackOnROInsertStories = cb
	}

	onROInsertItems (cb: (Action: IMOSItemAction, Items: Array<IMOSItem>) => Promise<IMOSROAck>) {
		this._callbackOnROInsertItems = cb
	}

	onROReplaceStories (cb: (Action: IMOSStoryAction, Stories: Array<IMOSROStory>) => Promise<IMOSROAck>) {
		this._callbackOnROReplaceStories = cb
	}

	onROReplaceItems (cb: (Action: IMOSItemAction, Items: Array<IMOSItem>) => Promise<IMOSROAck>) {
		this._callbackOnROReplaceItems = cb
	}

	onROMoveStories (cb: (Action: IMOSStoryAction, Stories: Array<MosString128>) => Promise<IMOSROAck>) {
		this._callbackOnROMoveStories = cb
	}

	onROMoveItems (cb: (Action: IMOSItemAction, Items: Array<MosString128>) => Promise<IMOSROAck>) {
		this._callbackOnROMoveItems = cb
	}

	onRODeleteStories (cb: (Action: IMOSROAction, Stories: Array<MosString128>) => Promise<IMOSROAck>) {
		this._callbackOnRODeleteStories = cb
	}

	onRODeleteItems (cb: (Action: IMOSStoryAction, Items: Array<MosString128>) => Promise<IMOSROAck>) {
		this._callbackOnRODeleteItems = cb
	}

	onROSwapStories (cb: (Action: IMOSROAction, StoryID0: MosString128, StoryID1: MosString128) => Promise<IMOSROAck>) {
		this._callbackOnROSwapStories = cb
	}

	onROSwapItems (cb: (Action: IMOSStoryAction, ItemID0: MosString128, ItemID1: MosString128) => Promise<IMOSROAck>) {
		this._callbackOnROSwapItems = cb
	}

	/* Profile 4 */
	onROStory (cb: (story: IMOSROFullStory) => Promise<any>) {
		this._callbackOnROStory = cb
	}

}
