
import { setDelay, clearDelay, DelayId } from './lib'

interface IController {
  readonly stop: () => void;
  readonly resume: () => void;
  readonly refresh: (newGap?: number) => void;
}

const notDo = () => {}
/**
 * polling
 * call fn where fn().finally
 * @param fn
 * @param gap
 */
export default <T>(fn: () => Promise<T>, gap = 10000): IController => {
  if (typeof fn !== 'function') {
    throw new TypeError('Failed to execute \'polling\': parameter 1 is not of type \'Function\'.')
  }

  if (!Number.isInteger(gap) || gap < 1) {
    throw new TypeError('Failed to execute \'polling\': parameter 2 is not a positive integer.')
  }

  let delayId: DelayId | undefined
  const proxy = () => {
    fn().catch(notDo).then(() => {
      delayId = setDelay(proxy, gap)
    })
  }
  proxy()

  return {
    stop () {
      if (delayId !== undefined) {
        clearDelay(delayId)
        delayId = undefined
      }
    },
    resume () {
      if (delayId === undefined) {
        proxy()
      }
    },
    refresh (newGap?: number) {
      if (newGap !== undefined) {
        if (!Number.isInteger(newGap) || newGap < 1) {
          throw new TypeError('Failed to execute \'changeGap\': parameter 1 is not a positive integer.')
        }
        gap = newGap;
      }
      this.stop()
      proxy()
    }
  }
}