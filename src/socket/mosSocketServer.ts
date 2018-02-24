import * as net from 'net'
import {EventEmitter} from 'events'
import {SocketType} from './socketType'
import {SocketServerConnectionStatus} from './mosSocketEvents'
import {SocketConnection} from './socketConnection'

export class MosSocketServer extends EventEmitter {
  private _port: number

  private _description: string
  private _server: net.Server

  private _connections: SocketConnection[]
  private _i: number = 0

  /** */
  constructor (port: number, description: SocketType) {
    super()
    this._port = port
    this._description = description
    this._listen()
  }

  /** */
  get port (): number {
    if (this._server) {
      return this._port
    }
    return this._port
  }

  /** */
  get socketConnections (): SocketConnection[] {
    return this._connections
  }

  /** */
  get i (): number {
    return this._i++
  }

  /** */
  dispose (): void {
    // @TODO JALLA SHIT
    this._server.once('close', () => {
      this.emit(SocketServerConnectionStatus.DISPOSED)
      delete this._server
    })

    // close all connections
    this._connections.forEach((connection) => {
      connection.socket.end()
    })
  }

  /**
   * convenience wrapper to expose all logging calls to parent object
   */
  log (args: any): void {
    console.log(args)
  }

  /** */
  private _listen (): void {
    // prevents manipulation of active socket
    if (this._server && !this._server.listening) {
      // recereates server if new attempt
      if (this._server) {
        this._server.close()
        this._server.removeAllListeners()
        delete this._server
      }

      // (re)creates client, either on first run or new attempt
      if (!this._server) {
        this._server = net.createServer()
        this._server.on('connection', (socket: net.Socket) => this._registerSocketClient(socket))
        this._server.on('error', (error) => this._onError(error))
        this._server.on('listening', () => this._onListening())
      }

        // connects
      this.log(`Server ${this._description} attempting to listen`)
      this._server.listen(this._port)
    }
  }

  /** */
  private _onError (error: Error) {
    // dispatch error!!!!!
    this.log(`Socket event error: ${error.message}`)
  }

  /** */
  private _registerSocketClient (socket: net.Socket) {

    // keep track of all servr, all connctons, filter actibity pr. server

    this._connections.push(new SocketConnection(this.i, socket))
  }

  /** */
  private _onListening () {
    this.emit(SocketServerConnectionStatus.LISTENING)
  }
}
