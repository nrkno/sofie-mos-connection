import type { IMOSROFullStory, IMOSString128 } from '@mos-connection/model'

export type NormalizeMosAttributes<T> = {
	[P in keyof T]: T[P] extends IMOSString128
		? string
		: T[P] extends IMOSString128 | undefined
		? string | undefined
		: T[P] extends string | number | null | undefined
		? T[P]
		: NormalizeMosAttributes<T[P]>
}

export function fixStoryBody(
	stories: Array<NormalizeMosAttributes<IMOSROFullStory>>
): Array<NormalizeMosAttributes<IMOSROFullStory>> {
	stories.forEach((story) => {
		story.Body.forEach((item) => {
			if (item.Type === 'p' && item.Content) {
				if (item.Content['@type'] === 'element') {
					delete item.Content
				} else if (item.Content['@type'] === 'text') {
					item.Content = item.Content['text']
				}
			}
		})
	})
	return stories
}
