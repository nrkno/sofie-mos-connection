import { ConnectionConfig, ProfilesSupport } from './config/connectionConfig'
import { MosSocketServer } from './connection/mosSocketServer'
import { ConnectionManager } from './connection/connectionManager'
import { IMosConnection } from './api'


export class MosConnection implements IMosConnection {
	static CONNECTION_PORT_LOWER: number = 10540
	static CONNECTION_PORT_UPPER: number = 10541
	static CONNECTION_PORT_QUERY: number = 10542

	public isListening: Promise<boolean[]>

	private _conf: ConnectionConfig

	private _connectionManager: ConnectionManager = new ConnectionManager()
	private _upperSocketServer: MosSocketServer
	private _querySocketServer: MosSocketServer

	/** */
	constructor (config: ConnectionConfig) {
		this._conf = config
		if (this._conf.acceptsConnections) {
			this.isListening = this._initiateIncomingConnections()
		}
	}

	/** */
	get isCompliant (): boolean {
		return true
	}

	/** */
	get acceptsConnections (): boolean {
		return this._conf.acceptsConnections
	}

	/** */
	getProfiles (): ProfilesSupport {
		return this._conf.profiles
	}

	/** */
	dispose () {
		if (this._upperSocketServer) {
			this._upperSocketServer.dispose()
		}
		if (this._querySocketServer) {
			this._querySocketServer.dispose()
		}
	}

	/** */
	getComplianceText (): string {
		if (this.isCompliant) {
			let profiles: string[] = []
			for (let i in this._conf.profiles) {
				if (this._conf.profiles[i] === true) {
					profiles.push(i)
				}
			}

			return `MOS Compatible – Profiles ${profiles.join(',')}`
		}
		return 'Warning: Not MOS compatible'
	}

	/** */
	private _initiateIncomingConnections (): Promise<boolean[]> {
		// shouldn't accept connections, so won't rig socket servers
		if (!this._conf.acceptsConnections) {
			return Promise.reject(false)
		}

		// setup two socket servers, then resolve with their listening statuses
		return new Promise((outerResolve) => {
			this._upperSocketServer = new MosSocketServer(MosConnection.CONNECTION_PORT_UPPER, 'upper', this._connectionManager)
			this._querySocketServer = new MosSocketServer(MosConnection.CONNECTION_PORT_QUERY, 'query', this._connectionManager)

			Promise.all(
				[
					this._upperSocketServer.listen(),
					this._querySocketServer.listen()
				]
			)
			.then(result => outerResolve(result))
		})
	}
}
