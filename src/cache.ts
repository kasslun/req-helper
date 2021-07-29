import { setDelay, clearDelay, DelayId } from './lib'

interface IProxy<T, U> {
  (this: U): Promise<T>;
  refresh: () => Promise<T>;
  expire: () => void;
}
/**
 * @param fn
 * @param cacheTime
 * @param expirationHandler
 */
export default <T, U>(fn: (this: U) => Promise<T>, cacheTime?: number, expirationHandler?: () => void): IProxy<T, U> => {
  if (typeof fn !== 'function') {
    throw new TypeError('Failed to execute \'cache\': parameter 1 is not of type \'Function\'.')
  }

  if (cacheTime !== undefined && (!Number.isInteger(cacheTime) || cacheTime < 0)) {
    throw new TypeError('Failed to execute \'cache\': parameter 2 is not undefined or a non-negative integer.')
  }

  if (expirationHandler !== undefined && typeof expirationHandler !== 'function') {
    throw new TypeError('Failed to execute \'cache\' : optional parameter 3 is not undefined or of type \'Function\'.')
  }

  let thisArg: U
  let delayId: DelayId | undefined
  let cache: Promise<T> | undefined
  const expireCb = expirationHandler ? () => {
    if (cache) {
      cache = undefined
      expirationHandler && expirationHandler.call(thisArg)
    }
  } : () => { cache = undefined }
  const proxy = function (this: U) {
    thisArg = thisArg || this
    if (!cache) {
      cache = fn.call(thisArg)
      cache.catch(expireCb)

      if (cacheTime !== undefined) {
        cache.then(() => {
          delayId = setDelay(expireCb, cacheTime)
        })
      }
    }
    return cache
  } as IProxy<T, U>

  proxy.refresh = () => {
    cache = undefined
    clearDelay(delayId)
    return proxy.call(thisArg)
  }

  proxy.expire = () => {
    expireCb();
    clearDelay(delayId)
  }

  return proxy
}
