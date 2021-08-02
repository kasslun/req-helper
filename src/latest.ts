import cache from './cache'
import { isPromise } from "./lib";

enum PromiseStatus {
  Rejected = -1,
  Pending,
  Fulfilled
}

interface ISeparator<T>{
  handler: Promise<T>;
  reject: (reason: Error) => void;
  status: PromiseStatus;
}


/**
 * Documentation https://kasslun.github.io/req-helper.doc/#latest
 * The latest() used to frequently request a resource through different query terms in a short time (for example,
 * more than one second). For example, <input> query input suggestions during fast input.
 * It can limit the number of concurrent requests through parameters to prevent browser requests from queuing (see browser concurrency).
 * It can also temporarily cache the response of the request through query criteria (which need to be string or number).
 * The latest() needs a function that returns Promise object as parameter fn, and returns a proxy function proxyFn
 * to control the call and arguments of fn.
 *
 * @param fn .fn(setAbortHandler, cacheKey [, ...arg]): Function, Send request and return Promise object. It receives
 * the parameters passed by proxyFn starting with parameter 2 (See Returns part).
 *
 * - setAbortHandler(abortHandler): Function, parameters 1 of fn, We need to set an abort function abortHandler to abort
 * the ajax/fetch request so that the Promise returned by fn changes from pending to rejected. (Fetch abort see AbortController)
 *
 * - cacheKey: Any type. If the type is String or Number(not NaN) , the fulfilled Promise returned by fn will be cached through dictionary key cacheKey, and the cache time is set through config.cacheTime. If you need no cache.
 *
 * @param config Object, optional, default { maxTasks: 4 }
 * - config.cacheTime: Number, optional, positive integer, default undefined is no cache. Cache time(ms) of results
 * corresponding to dictionary key cacheKey.
 * - config.maxTasks: Number, optional, positive integer, default 4. Maximum number of concurrent request.
 *
 * @return latest() returns a proxy function proxyFn of the fn, the proxy function receives any parameters and finally passes in fn.
 */
export default function <T, U, V, W = string | number, X = () => void> (
  fn: (this: U, setAbortHandler: (abortHandler: X) => void, cacheKey?: W, ...args: V[]) => Promise<T>,
  config: { readonly cacheTime?: number; readonly maxTasks?: number; } = { maxTasks: 4 }
  ) : (this: U, cacheKey?: W, ...args: V[]) => Promise<T> {
  if (typeof fn !== 'function') {
    throw new TypeError('Failed to execute \'latest\': parameter 1 is not of type \'Function\'.')
  }

  if (typeof config !== 'object') {
    throw new TypeError('Failed to execute \'latest\': optional parameter 2 is not of type \'Object\'.')
  }

  const { cacheTime, maxTasks = 4 } = config;

  if (cacheTime != undefined && (!Number.isInteger(cacheTime) || cacheTime < 1)) {
    throw new TypeError('Failed to execute \'latest\': optional property `cacheTime` of parameter 2 not is a positive integer')
  }

  if (maxTasks != undefined && (!Number.isInteger(maxTasks) || maxTasks < 1)) {
    throw new TypeError('Failed to execute \'latest\': optional property `maxTasks` of parameter 2 not is a positive integer')
  }

  let thisArg: U
  const caches = new Map()
  let proxyPromise: ISeparator<T> | undefined
  let waiting: { resolve: (value: T | Promise<T>) => void, reject: (reason: string) => void, cacheKey?: W, args: V[] } | undefined
  let userTaskSize = 0
  const abortHandlerList: X[] = []

  return function proxy (this: U, cacheKey?: W, ...args: V[]): Promise<T> {
    thisArg = thisArg || this

    const conditionType = typeof cacheKey;
    const allowCaching = cacheTime != undefined && (conditionType === 'string' || conditionType === 'number' && !Number.isNaN(cacheKey));

    // Hit cache
    if (allowCaching && caches.has(cacheKey)) {
      return caches.get(cacheKey)()
    }

    // reject previous proxy, keep user task is latest
    if (proxyPromise?.status === PromiseStatus.Pending) {
      proxyPromise.reject(new Error('The latest aborted!'))
      proxyPromise = undefined;
    }

    // max tasks limit, such as http request limit;
    if (userTaskSize >= maxTasks) {

      // return pending;
      const pms: Promise<T> = new Promise((resolve, reject) => {
        if (waiting) {
          waiting.reject('The latest aborted!')
        }
        waiting = { resolve, reject, cacheKey, args }
      })

      if (typeof abortHandlerList[0] === 'function') {
        abortHandlerList[0]()
        abortHandlerList.shift()
      }

      return pms;
    }

    let abortIndex: number | undefined
    const setAbortHandler = (handler: X)  => {
      if (typeof handler !== 'function') {
        throw new TypeError('Failed to execute \'setAbortHandler\': parameter 1 is not of type \'Function\'.')
      }
      abortIndex = abortHandlerList.push(handler) - 1
    }

    // bound user fn
    let boundFn = () => fn.call(thisArg, setAbortHandler, cacheKey, ...args)

    // cache fn
    if (allowCaching) {
      caches.set(
        cacheKey,
        boundFn = cache(boundFn, cacheTime, () => {
          caches.delete(cacheKey)
        })
      )
    }

    userTaskSize++
    const userTask = boundFn()

    if (!isPromise(userTask)) {
      userTaskSize --;
      throw new TypeError('Failed to execute \'proxy\' in \'latest\' : the return value of the parameter 1 of \'cache\' call is not of type \'Promise\'.')
    }

    userTask.catch(noop).then(() => {
      userTaskSize--

      if (abortIndex !== undefined) {
        abortHandlerList.splice(abortIndex, 1)
      }

      if (waiting) {
        waiting.resolve(proxy.call(thisArg, waiting.cacheKey, ...waiting.args))
        waiting = undefined
      }

    })

    return (proxyPromise = generateProxyPromise(userTask)).handler

  }
}


/**
 * generate a proxy promise
 * @param pms
 */
function generateProxyPromise<T> (pms: Promise<T>): ISeparator<T> {
  const separator = {
    status: PromiseStatus.Pending
  } as ISeparator<T>
  separator.handler = new Promise((resolve, reject) => {
    pms.then((value: T) => {
      if (separator.status === PromiseStatus.Pending) {
        resolve(value)
        separator.status = PromiseStatus.Fulfilled
      }
    }).catch(separator.reject = (reason: Error) => {
      if (separator.status === PromiseStatus.Pending) {
        reject(reason)
        separator.status = PromiseStatus.Rejected
      }
    })
  })
  return separator
}

const noop = () => {}