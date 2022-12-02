export interface IMOSTime {
	toString(): string
	getTime(): number
	setTime(timestamp: number): number
}
export interface IMOSString128 {
	toString(): string
}
export interface IMOSDuration {
	toString(): string
	valueOf(): number
}

export interface IMOSExternalMetaData {
	MosScope?: IMOSScope
	MosSchema: string
	MosPayload: any
}
export enum IMOSScope {
	OBJECT = 'OBJECT',
	STORY = 'STORY',
	PLAYLIST = 'PLAYLIST',
}
