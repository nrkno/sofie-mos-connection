export interface ListEntry<T> {
	/** ID that uniquely identifies this entry */
	id: string
	/** Hash or timestamp, that changes whenever the content has changed */
	changedHash: string
	content: T
}
export type Operation<T> = OperationInsert<T> | OperationUpdate<T> | OperationRemove | OperationMove
export interface OperationBase {
	type: OperationType
}
export enum OperationType {
	INSERT = 'insert',
	UPDATE = 'update',
	REMOVE = 'remove',
	MOVE = 'move',
}
export interface OperationInsert<T> {
	type: OperationType.INSERT
	beforeId: string
	inserts: {
		id: string
		changedHash: string
		content: T
	}[]
}
export interface OperationUpdate<T> {
	type: OperationType.UPDATE
	id: string
	changedHash: string
	content: T
}
export interface OperationRemove {
	type: OperationType.REMOVE
	ids: string[]
}
export interface OperationMove {
	type: OperationType.MOVE
	ids: string[]
	beforeId: string
}
/** Takes an old and a new list, and returns the operations needed to synk the two */
export function diffLists<T>(oldList: ListEntry<T>[], newList: ListEntry<T>[]): Operation<T>[] {
	// Preparations:
	const operations: Operation<T>[] = []
	const oldLookup: { [id: string]: { changedHash: string } } = {}
	const newLookup: { [id: string]: { changedHash: string; entry: ListEntry<T> } } = {}

	for (const entry of oldList) {
		if (!entry.id) throw new Error(`An entry in oldList is missing required property "id"!`)
		oldLookup[entry.id] = { changedHash: entry.changedHash }
	}

	// Find Inserted and Updated:
	let currentInsertOperation: OperationInsert<T> | null = null
	// for (let i = newList.length - 1; i >= 0; i--) {
	for (let i = 0; i < newList.length; i++) {
		const entry: ListEntry<T> = newList[i]
		const nextEntry: ListEntry<T> | undefined = newList[i + 1]
		const nextId = nextEntry ? nextEntry.id : ''

		if (!entry.id) throw new Error(`An entry in newList is missing required property "id"!`)
		// newRefs[entry.id] = { entry: entry, prev: prev, changedHash: entry.changedHash }
		newLookup[entry.id] = { changedHash: entry.changedHash, entry: entry }
		if (!oldLookup[entry.id]) {
			if (currentInsertOperation) {
				currentInsertOperation.inserts.push({
					id: entry.id,
					changedHash: entry.changedHash,
					content: entry.content,
				})
				currentInsertOperation.beforeId = nextId
			} else {
				currentInsertOperation = {
					type: OperationType.INSERT,
					beforeId: nextId,
					inserts: [
						{
							id: entry.id,
							changedHash: entry.changedHash,
							content: entry.content,
						},
					],
				}
			}
		} else {
			if (currentInsertOperation) {
				operations.push(currentInsertOperation)
				currentInsertOperation = null
			}
			if (oldLookup[entry.id].changedHash !== entry.changedHash) {
				operations.push({
					type: OperationType.UPDATE,
					id: entry.id,
					changedHash: entry.changedHash,
					content: entry.content,
				})
			}
		}
	}
	if (currentInsertOperation) {
		operations.push(currentInsertOperation)
		currentInsertOperation = null
	}
	// Find removed:
	let currentRemoveOperation: OperationRemove | null = null
	for (const entry of oldList) {
		if (!newLookup[entry.id]) {
			if (currentRemoveOperation) {
				currentRemoveOperation.ids.push(entry.id)
			} else {
				currentRemoveOperation = {
					type: OperationType.REMOVE,
					ids: [entry.id],
				}
			}
		}
	}
	if (currentRemoveOperation) {
		operations.push(currentRemoveOperation)
		currentRemoveOperation = null
	}

	// Apply Inserts, updates & removes on intermediary list:
	/** Intermediate list. Start with the old order and gradually ends up in the ending order,
	 * as move operations are determined
	 */
	let interList = applyOperations(oldList, operations)

	// Find Moved:
	let currentMoveOperation: OperationMove | null = null
	let currentMovePrevId = ''
	const getInterPrevId = (id: string): string => {
		const index = interList.findIndex((e) => e.id === id)
		return index > 0 ? interList[index - 1].id : ''
	}

	// for (const entry of newList) {
	for (let i = 0; i < newList.length; i++) {
		const entry: ListEntry<T> = newList[i]
		// const prevEntry: ListEntry<T> | undefined = newList[i - 1]
		const prevId = newList[i - 1] ? newList[i - 1].id : ''
		// const nextEntry: ListEntry<T> | undefined = newList[i + 1]
		const nextId = newList[i + 1] ? newList[i + 1].id : ''

		const interRefPrevId = getInterPrevId(entry.id)

		if (currentMoveOperation) {
			if (interRefPrevId !== currentMovePrevId) {
				// The new entry is not following after the same element as the one that was before the beginning of the move operation
				currentMoveOperation.ids.push(entry.id)
				currentMoveOperation.beforeId = nextId
			} else {
				// The new entry is following the element that was before the move operation started.

				// Optimize: when the tail of the move-operation is in the original order, it can be replaced by another smaller move operation:
				if (currentMoveOperation.ids.length > 1) {
					for (let i = currentMoveOperation.ids.length - 1; i >= 0; i--) {
						const id = currentMoveOperation.ids[i]
						const prev0 = getInterPrevId(id)
						if (i > 0 && currentMoveOperation.ids[i - 1] === prev0) {
							// The previous id is in the original order, continue
						} else {
							if (prev0 === entry.id) {
								// Yes, we can replace a number of ids with another move operation.
								if (i > 0) {
									currentMoveOperation.beforeId = currentMoveOperation.ids[i]
									currentMoveOperation.ids.length = i // remove entries after i
									operations.push(currentMoveOperation)
									interList = applyOperations(interList, [currentMoveOperation])
								}
								currentMoveOperation = {
									type: OperationType.MOVE,
									beforeId: nextId,
									ids: [entry.id],
								}
							}
							break
						}
					}
				}
				// Commit the move operation:
				// currentMoveOperation.beforeId = nextId
				operations.push(currentMoveOperation)
				interList = applyOperations(interList, [currentMoveOperation])
				currentMoveOperation = null
				currentMovePrevId = ''
			}
		} else if (prevId !== interRefPrevId) {
			// The new entry is not following the same entry as the old does
			currentMoveOperation = {
				type: OperationType.MOVE,
				beforeId: nextId,
				ids: [entry.id],
			}
			currentMovePrevId = prevId
		} else {
			// No change
		}
	}
	if (currentMoveOperation) {
		// todo? Optimize: when the tail of the operation will be on the end anyway:
		currentMoveOperation.beforeId = ''
		operations.push(currentMoveOperation)
	}
	return operations
}
export function applyOperations<T>(oldList: ListEntry<T>[], operations: Operation<T>[]): ListEntry<T>[] {
	let newList: ListEntry<T>[] = oldList.slice() // clone

	// Apply Inserts, updates & removes on intermediary list:
	for (const operation of operations) {
		if (operation.type === OperationType.INSERT) {
			const entries = operation.inserts.map((insert) => ({
				id: insert.id,
				changedHash: insert.changedHash,
				content: insert.content,
			}))
			if (operation.beforeId) {
				const beforeId = operation.beforeId
				const index = newList.findIndex((e) => e.id === beforeId)
				if (index === -1) throw new Error(`INSERT: beforeId "${beforeId}" not found in list!`)
				newList.splice(index, 0, ...entries)
			} else {
				// insert last
				newList.push(...entries)
			}
		} else if (operation.type === OperationType.UPDATE) {
			const idToUpdate = operation.id
			const entry = newList.find((e) => e.id === idToUpdate)
			if (!entry) throw new Error(`UPDATE: id "${idToUpdate}" not found in newList!`)
			entry.changedHash = operation.changedHash
		} else if (operation.type === OperationType.REMOVE) {
			const idsToRemove = operation.ids
			newList = newList.filter((e) => !idsToRemove.includes(e.id))
		} else if (operation.type === OperationType.MOVE) {
			const ids = operation.ids
			const moveEntries = extractList(newList, (e) => ids.indexOf(e.id))
			let index = -1
			if (operation.beforeId) {
				const beforeId = operation.beforeId
				index = newList.findIndex((e) => e.id === beforeId)
				newList.splice(index, 0, ...moveEntries)
			} else {
				// move last:
				newList.push(...moveEntries)
			}
		}
	}

	return newList
}
/** Find and extract entries from list, and return them */
function extractList<T>(list: T[], fcn: (value: T) => number): T[] {
	const list0: T[] = []
	for (let i = list.length - 1; i >= 0; i--) {
		const index = fcn(list[i])
		if (index >= 0) {
			if (list0[index]) throw new Error(`extractList: non unique index returned: ${index}`)
			list0[index] = list.splice(i, 1)[0]
		}
	}
	return makeDenseArray(list0)
}
function makeDenseArray<T>(sparse: Array<T | undefined | null>): T[] {
	return sparse.filter((x): x is T => x !== undefined && x != null)
}
