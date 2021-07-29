import { setDelay, clearDelay, DelayId } from './lib'

interface IProxy<T, U, V> {
  (this: V, ...arg: U[]): Promise<T>;
  enable: () => void;
}

/**
 * @param fn
 * @param statusChange
 * @param gap
 */
export default <T, U, V>(fn: (this: V, ...arg: U[]) => Promise<T>, statusChange?: (this: V, disabled: boolean) => void, gap = 0): IProxy<T, U, V> => {
  if (typeof fn !== 'function') {
    throw new TypeError('Failed to execute \'deResend\': parameter 1 is not of type \'Function\'.')
  }

  if (gap !== undefined && (!Number.isInteger(gap) || gap < 0)) {
    throw new TypeError('Failed to execute \'deResend\': parameter 2 is not undefined or a non-negative integer.')
  }

  let thisArg: V
  let disabled = false
  let delayId: DelayId | undefined
  const setDisable = statusChange ? (flag: boolean) => {
    if (disabled !== flag) {
      disabled = flag;
      statusChange.call(thisArg, disabled);
    }
  } : (flag: boolean) => {
    disabled = flag;
  }

  const proxy = function (this: V, ...arg: U[]): Promise<T> {
    thisArg = thisArg || this
    if (disabled) {
      return Promise.reject(new Error('deResendRet'))
    }
    setDisable(true);

    const pms = fn.call(this, ...arg)
    if (gap !== undefined) {
      pms.then(() => {
        if (disabled) {
          delayId = setDelay(() => {
            setDisable(false)
          }, gap)
        }
      })
      pms.catch(() => { setDisable(false) })
    }
    return pms
  } as IProxy<T, U, V>

  proxy.enable = () => {
    if (disabled) {
      setDisable(false)
      clearDelay(delayId)
    }
  }

  return proxy
}
