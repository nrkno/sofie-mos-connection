import {
	xml2js
} from '../Utils'
test('xml2js', () => {
	let o = xml2js(`
<mos>
<p>Hello and welcome</p>
<mosObject>[name sign]</mosObject>
<p>This is a extra broadcast bla bla</p>
<mosObject></mosObject>
<p>Let's look at this video:</p>
<mosObject>[video]</mosObject>
</mos>
	`)
	// console.log(o.mos)
	expect(o).toBeTruthy()
	// expect(o.mos).toBeTruthy()
})
