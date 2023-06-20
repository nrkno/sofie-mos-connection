import { IMOSScope } from '@mos-connection/model'

export const READY_TO_AIR = false

export const runningOrder: any = {
	ID: 'filename',
	Slug: 'Evening show1',
	// DefaultChannel?: ''
	// EditorialStart?: MosTime;
	// EditorialDuration?: MosDuration;
	// Trigger?: ''
	// MacroIn?: ''
	// MacroOut?: ''
	MosExternalMetaData: [
		{
			MosSchema: 'http://MYMOSSCHEMA',
			MosPayload: {
				attribute: 'example',
			},
			MosScope: IMOSScope.PLAYLIST,
		},
	],
	Stories: [
		{ Slug: 'TITLE A;STORY_A', ID: 'STORY_A', Items: [] },
		{ Slug: 'TITLE A;STORY_B', ID: 'STORY_B', Items: [] },
		{ Slug: 'TITLE A;STORY_C', ID: 'STORY_C', Items: [] },
		{ Slug: 'TITLE A;STORY_D', ID: 'STORY_D', Items: [] },
		{ Slug: 'TITLE B;STORY_E', ID: 'STORY_E', Items: [] },
		{ Slug: 'TITLE D;STORY_F', ID: 'STORY_F', Items: [] },
		{ Slug: 'TITLE D;STORY_G', ID: 'STORY_G', Items: [] },
		{ Slug: 'TITLE D;STORY_H', ID: 'STORY_H', Items: [] },
		{ Slug: 'TITLE E;STORY_I', ID: 'STORY_I', Items: [] },
		{ Slug: 'TITLE B;STORY_J', ID: 'STORY_J', Items: [] },
		{ Slug: 'TITLE C;STORY_K', ID: 'STORY_K', Items: [] },
	],
}
export const fullStories: any[] = [
	{
		ID: 'STORY_A',
		Slug: 'TITLE A;STORY_A',
		MosExternalMetaData: [
			{
				MosScope: IMOSScope.PLAYLIST,
				MosSchema: 'http://MYMOSSCHEMA',
				MosPayload: {
					attribute: 'example',
				},
			},
		],
		RunningOrderId: 'filename',
		Body: [
			{
				Type: 'p',
				Content: { '@name': 'p', '@type': 'element' },
			},
			{
				Type: 'storyItem',
				Content: {
					ID: '4',
					ObjectID: 'asdf1234',
					MOSID: 'SPECIAL.ID.MOS',
					Slug: 'The slug',
					MosExternalMetaData: [
						{
							MosScope: 'PLAYLIST',
							MosSchema: 'http://MYMOSSCHEMA2',
							MosPayload: {
								attribute: 'example',
							},
						},
					],
					mosAbstract: 'This is the Absctract',
					ObjectSlug: 'This is the Slug',
				},
			},
			{
				Type: 'p',
				Content: { text: 'This is an example text', '@name': 'p', '@type': 'text' },
			},
		],
	},
]
