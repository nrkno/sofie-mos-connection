import { xml2js } from '../Utils'

test('xml2js with junk', () => {
	const o: any = xml2js(`
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
	const o: any = xml2js(`
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
	const o: any = xml2js(`
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
	const o: any = xml2js(`
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

test('xml2js with simple data', () => {
	{
		const data = xml2js(`
			<element_source>
				<story>
					<storyID>17</storyID>
					<secondProperty>2</secondProperty>
				</story>
			</element_source>
		`)

		expect(data).toEqual({
			element_source: {
				story: {
					storyID: 17,
					secondProperty: 2,
				},
			},
		})
	}
	{
		const data = xml2js(`
			<element_source>
				<story>
					<storyID>17</storyID>
				</story>
			</element_source>
		`)
		expect(data).toEqual({
			element_source: {
				story: {
					storyID: 17,
				},
			},
		})
	}
})

test('xml2js handle objID with nubmerformatting as string', () => {
	const o: any = xml2js(`
<content>
	<navn>Jon Gelius</navn>
	<objId>000987.6540</objId>
	<tittel/>
	<tematekst/>
	<infotekst/>
	<_valid>true</_valid>
</content>
	`)

	expect(o.content).toEqual({
		navn: 'Jon Gelius',
		objId: '000987.6540',
		tittel: {},
		tematekst: {},
		infotekst: {},
		_valid: true,
	})
})