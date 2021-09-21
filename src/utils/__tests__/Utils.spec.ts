import { xml2js } from '../Utils'

test('xml2js with junk', () => {
	let o: any = xml2js(`
<content>
	<navn>Jon Gelius</navn>
	<tittel/>
	<funksjoner>
		<funksjon>Redaktør:</funksjon>
		<navn/>
	</funksjoner>
	<funksjoner>
		<funksjon>Regi:</funksjon>
		<navn/>
	</funksjoner>
	<sami>false</sami>
	<_valid>true</_valid>
</content>
	`)

	expect(o.content).toEqual({
		navn: 'Jon Gelius',
		tittel: {},
		funksjoner: [
			{
				funksjon: 'Redaktør:',
				navn: {},
			},
			{
				funksjon: 'Regi:',
				navn: {},
			},
		],
		sami: false,
		_valid: true,
	})
})
test('xml2js with simple array', () => {
	let o: any = xml2js(`
<content>
	<navn>Jon Gelius</navn>
	<tittel/>
	<tematekst/>
	<tematekst/>
</content>
	`)

	expect(o.content).toEqual({
		navn: 'Jon Gelius',
		tittel: {},
		tematekst: [{}, {}],
	})
})
test('xml2js with array', () => {
	let o: any = xml2js(`
<content>
	<navn>Jon Gelius</navn>
	<tittel/>
	<tematekst/>
	<infotekst/>
	<funksjoner>
		<funksjon>Redaktør:</funksjon>
		<navn/>
	</funksjoner>
	<funksjoner>
		<funksjon>Regi:</funksjon>
		<navn>Johan</navn>
	</funksjoner>
	<_valid>true</_valid>
</content>
	`)

	expect(o.content).toEqual({
		navn: 'Jon Gelius',
		tittel: {},
		tematekst: {},
		infotekst: {},
		funksjoner: [
			{
				funksjon: 'Redaktør:',
				navn: {},
			},
			{
				funksjon: 'Regi:',
				navn: 'Johan',
			},
		],
		_valid: true,
	})
})

test('xml2js with clean', () => {
	let o: any = xml2js(`
<content>
	<navn>Jon Gelius</navn>
	<tittel/>
	<tematekst/>
	<infotekst/>
	<_valid>true</_valid>
</content>
	`)

	expect(o.content).toEqual({
		navn: 'Jon Gelius',
		tittel: {},
		tematekst: {},
		infotekst: {},
		_valid: true,
	})
})
