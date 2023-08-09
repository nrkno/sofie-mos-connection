/** Return true if the object has a property */
export function has(obj: unknown, property: string): boolean {
	return Object.hasOwnProperty.call(obj, property)
}
export function safeStringify(obj: unknown): string {
	if (typeof obj === 'string') {
		return obj
	}
	try {
		return JSON.stringify(obj)
	} catch (e) {
		return `--Unable to stringify: ${e}--`
	}
}

export function isTestingWithJest(): boolean {
	return process.env.JEST_WORKER_ID !== undefined
}

// If running in Jest, wait a bit longer before checking the profile validity:
export const PROFILE_VALIDNESS_CHECK_WAIT_TIME = isTestingWithJest() ? 500 : 100
