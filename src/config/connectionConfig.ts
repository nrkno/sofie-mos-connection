export default class ConnectionConfig {
  mosID: string
  ncs: {
    ncsID: string,
    host: string,
    portUpper: number,
    portLower: number,
    portQuery: number
  }
  ncsBuddy: {
    ncsID: string,
    host: string,
    portUpper: number,
    portLower: number,
    portQuery: number
  } | undefined
  profiles: {
    '0': boolean,
    '1': boolean,
    '2': boolean,
    '3': boolean,
    '4': boolean,
    '5': boolean,
    '6': boolean,
    '7': boolean
  }
	// machineInfo: {
	// 	manufacturer: "SuperFly.tv",
	//     model: 	"YAAS"
	//     //hwRev:	 ,
	//     swRev: 	'0.0.1.0'
	//     DOM: 	'', // date of manufacture
	//     /*<SN>927748927</SN>
	//     <ID>airchache.newscenter.com</ID>
	//     <time>2009-04-11T17:20:42</time>
	//     <opTime>2009-03-01T23:55:10</opTime>
	//     <mosRev>2.8.2</mosRev>
	//     */
	// }
}
