import { clearDelay, DelayId, setDelay } from './lib'

interface IPut<T> {
  (arg: T): void;
  pack: () => void;
}

const validTime = (name: string, time: number | undefined) => {
  if (time !== undefined && (!Number.isInteger(time) || time < 0)) {
    throw TypeError(`Failed to execute 'packing': property '${name}' of parameter 2 is not a non-negative integer.`)
  }
}
export default <T, U>(receiver: (this: U, arg: T[]) => any, condition: {
  readonly duration?: number;
  readonly waitTime?: number;
  readonly capacity?: number;
}): IPut<T> => {
  if (typeof receiver !== 'function') {
    throw new TypeError('Failed to execute \'packing\': parameter 1 is not of type \'Function\'.')
  }

  if (typeof condition !== 'object') {
    throw new TypeError('Failed to execute \'packing\': parameter 2 is not of type \'Object\'.')
  }
  const { duration, waitTime, capacity } = condition

  if (duration === undefined && waitTime === undefined && capacity === undefined) {
    throw new TypeError('Failed to execute \'packing\': parameter 2 needs to have properties \'duration\', \'capacity\' or \'waitTime\'.')
  }

  if (capacity !== undefined && (!Number.isInteger(capacity) || capacity < 1)) {
    throw new TypeError('Failed to execute \'packing\': property \'capacity\' of parameter 2 is not a positive integer.')
  }

  validTime('duration', duration)
  validTime('waitTime', waitTime)

  let isCallPut = false;
  let thisArg: U
  let box: T[] = []
  let durationDelayId: DelayId | undefined
  let waitTimeDelayId: DelayId | undefined
  const assembler = function (this: U, ...arg: T[]) {
    isCallPut = true;
    thisArg = thisArg || this;
    if (arg.length) {
      box = box.concat(arg)

      // condition.capacity;
      const length = box.length
      if (capacity && length >= capacity) {
        assembler.pack()
        return;
      }
    }

    // condition.duration
    if (duration !== undefined && durationDelayId === undefined) {
      durationDelayId = setDelay(assembler.pack, duration)
    }

    // condition.waitTime
    if (waitTime !== undefined) {
      if (waitTimeDelayId !== undefined) {
        clearDelay(waitTimeDelayId)
      }
      waitTimeDelayId = setDelay(assembler.pack, waitTime)
    }
  } as IPut<T>

  assembler.pack = () => {
    if (!isCallPut) {
      return;
    }

    if (durationDelayId !== undefined) {
      clearDelay(durationDelayId)
      durationDelayId = undefined
    }

    if (waitTimeDelayId !== undefined) {
      clearDelay(waitTimeDelayId)
      waitTimeDelayId = undefined
    }

    if (!box.length) {
      return
    }

    const packedBox = box
    box = []
    receiver.call(thisArg, packedBox)
  }

  return assembler
}
