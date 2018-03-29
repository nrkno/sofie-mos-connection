const Socket = require('net').Socket
const lib = require('./../dist/index.js')
const MosConnection = lib.MosConnection
const ConnectionConfig = lib.ConnectionConfig

const mos = new MosConnection(new ConnectionConfig({
  mosID: 'mockMos',
  acceptsConnections: true,
  profiles: {
      '0': true,
      '1': true
  }
}))

mos.isListening
.then(() => {
  new Promise((listeningResolve, listeningReject) => {
    let incoming1 = new Socket()
    incoming1.once('connect', () => {
      console.log('client-side connected')
      // incoming1.write('ping')
    })
    incoming1.once('data', (b) => {
      console.log('client-side got data: ', b.toString())
      listeningResolve() // close and bye
    })
    incoming1.connect(10541)
  }).then(() => mos.dispose()) // etter mottatt connection
})
