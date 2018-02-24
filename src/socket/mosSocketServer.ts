export default class MosSocketServer {
	/** */
	constructor (private host: string, private port: number, private name: string) {
	}
	on (eventName: string, callback: (data: any) => any) {
		callback({event: eventName, host: this.host, port: this.port, name: this.name}) // Whatever should happen here?
	}
}
