import { ConnectionConfig, ProfilesSupport } from './config/connectionConfig'

export class MosConnection {

	private _conf: ConnectionConfig

	/** */
	constructor (config: ConnectionConfig) {
		this._conf = config
	}

	/** */
	getProfiles (): ProfilesSupport {
		return this._conf.profiles
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
	get isCompliant (): boolean {
		return false
	}
}
