
const resolve = Promise.resolve()
let start = 0.1
const delayIds: { [key: string]: true } = {}

export type DelayId = string | ReturnType<typeof setTimeout>;

export function setDelay (fn: () => void, time: number): DelayId {
  if (typeof fn !== 'function') {
    throw new TypeError('Failed to execute \'setDelay\': parameter 1 is not of type \'Function\'.')
  }
  if (time < 0) {
    throw new TypeError('Failed to execute \'setDelay\': parameter 2 is not a non-negative integer.')
  }
  if (time === 0) {
    const delayId = --start + ''
    delayIds[delayId] = true
    resolve.then(() => {
      if (delayIds[delayId]) {
        delete delayIds[delayId]
        fn()
      }
    })
    return delayId
  }
  return setTimeout(fn, time)
}

export function clearDelay (delayId?: DelayId): void {
  switch (typeof delayId) {
    case 'undefined':
      break
    case 'string':
      delete delayIds[delayId]
      break
    default:
      clearTimeout(delayId)
  }
}