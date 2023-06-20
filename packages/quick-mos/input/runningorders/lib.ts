import type { IMOSString128 } from '@mos-connection/model'

export type NormalizeMosAttributes<T> = {
	[P in keyof T]: T[P] extends IMOSString128
		? string
		: T[P] extends string | number | null | undefined
		? T[P]
		: NormalizeMosAttributes<T[P]>
}
