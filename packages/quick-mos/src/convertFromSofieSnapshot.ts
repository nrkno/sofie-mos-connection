import { getMosTypes, IMOSROFullStory, IMOSROStory, IMOSRunningOrder } from '@mos-connection/model'

/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

export function convertFromSofieSnapshot(
	filePath: string,
	snapShotData: any
): { ro: IMOSRunningOrder; stories: IMOSROFullStory[]; readyToAir: boolean }[] {
	const output: { ro: IMOSRunningOrder; stories: IMOSROFullStory[]; readyToAir: boolean }[] = []
	const mosTypes = getMosTypes(true)

	const snapshot = snapShotData.ingestData

	const rundownData = snapshot.filter((e: any) => e.type === 'rundown')
	const segmentData = snapshot.filter((e: any) => e.type === 'segment')
	const partData = snapshot.filter((e: any) => e.type === 'part')

	if (rundownData.length === 0) throw new Error(`Got ${rundownData.length} rundown ingest data. Can't continue`)

	for (const seg of segmentData) {
		let parts = partData.filter((e: any) => e.segmentId === seg.segmentId)
		parts = parts.map((e: any) => e.data)
		parts = parts.sort((a: any, b: any) => b.rank - a.rank)

		seg.data.parts = parts
	}

	rundownData.forEach((rundown: any, rundownIndex: number) => {
		const segments0 = segmentData.filter((e: any) => e.rundownId === rundown.rundownId)

		let segments = segments0.map((s: any) => s.data)
		segments = segments.sort((a: any, b: any) => b.rank - a.rank)

		const fullStories: IMOSROFullStory[] = []
		const stories: IMOSROStory[] = []

		segments.sort((a: any, b: any) => (a.rank || 0) - (b.rank || 0))

		for (const segment of segments) {
			segment.parts.sort((a: any, b: any) => (a.rank || 0) - (b.rank || 0))

			for (const part of segment.parts) {
				fullStories.push(part.payload)
				stories.push({
					ID: part.payload.ID,
					Slug: part.name,
					Items: [],
				})
			}
		}

		const runningOrder: IMOSRunningOrder = {
			...rundown.data.payload,
			ID: mosTypes.mosString128.create(filePath.replace(/\W/g, '_') + `_${rundownIndex}`),
			Stories: stories,
			EditorialStart: mosTypes.mosTime.create(rundown.data.payload.EditorialStart),
			EditorialDuration: mosTypes.mosDuration.create(rundown.data.payload.EditorialDuration),
		}

		output.push({
			ro: runningOrder,
			stories: fixStoryBody(fullStories),
			readyToAir: rundown.data.readyToAir || false,
		})
	})
	return output
}

function fixStoryBody(stories: any[]) {
	for (const story of stories) {
		for (const item of story.Body) {
			if (item.Type === 'p' && item.Content) {
				if (item.Content['@type'] === 'element') {
					delete item.Content
				} else if (item.Content['@type'] === 'text') {
					item.Content = item.Content['text']
				}
			}
		}
	}
	return stories
}
