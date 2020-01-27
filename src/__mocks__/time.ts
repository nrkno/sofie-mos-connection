/** Mock the Date object, to make sure that stuff that's using the "current time" in tests run fine */
const DATE_TO_USE = new Date('2019-01-01 17:14:42')
const _Date = Date
// @ts-ignore
global.Date = jest.fn(() => DATE_TO_USE)
global.Date.UTC = _Date.UTC
global.Date.parse = _Date.parse
global.Date.now = _Date.now
