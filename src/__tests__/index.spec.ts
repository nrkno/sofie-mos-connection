


import {MosConnection} from "../index"

test('Simple test', () => {
	
	var myMosC = new MosConnection({
	})

	expect(myMosC).toBeInstanceOf(MosConnection)
})
