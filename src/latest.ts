import cache from './cache'

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

/**
 *
 * @param fn
 * @param cacheTime
 * @param maxTasks
 */
export default function <T, U, V, W = string | number> (
  fn: (this: U, setAbortHandler: (abortHandler: () => void) => void, cacheKey?: W, ...args: V[]) => Promise<T>,
  {  cacheTime, maxTasks = 4 }: { readonly cacheTime?: number; readonly maxTasks?: number; } = { maxTasks: 4 }
  ) : (this: U, cacheKey?: W, ...args: V[]) => Promise<T> {
  if (typeof fn !== 'function') {
    throw new TypeError('Failed to execute \'latest\': parameter 1 is not of type \'Function\'.')
  }

  if (cacheTime !== undefined && (!Number.isInteger(cacheTime) || cacheTime < 1)) {
    throw new TypeError('Failed to execute \'latest\': optional property `cacheTime` of parameter 2 not is a positive integer')
  }

  if (!Number.isInteger(maxTasks) || maxTasks < 1) {
    throw new TypeError('Failed to execute \'latest\': optional property `maxTasks` of parameter 2 not is a positive integer')
  }

  let thisArg: U
  const caches = new Map()
  let proxyPromise: ISeparator<T> | undefined
  let waiting: { resolve: (value: T | Promise<T>) => void, reject: (reason: string) => void, cacheKey?: W, args: V[] } | undefined
  let userTaskSize = 0
  const abortHandlerList: (() => void)[] = []
  return function proxy (this: U, cacheKey?: W, ...args: V[]): Promise<T> {
    thisArg = thisArg || this

    const conditionType = typeof cacheKey;
    const allowCaching = cacheTime !== undefined && (conditionType === 'string' || conditionType === 'number' && Number.isNaN(cacheKey));

    // Hit cache
    if (allowCaching && caches.has(cacheKey)) {
      return caches.get(cacheKey)()
    }

    // reject prev proxy, keep user data latest
    if (proxyPromise && proxyPromise.status === PromiseStatus.Pending) {
      proxyPromise.reject(new Error('The latest aborted!'))
    }

    // max tasks limit, such as http request limit;
    if (userTaskSize >= maxTasks) {
      if (abortHandlerList[0]) {
        abortHandlerList[0]()
        abortHandlerList.shift()
      }

      // return pending;
      return new Promise((resolve, reject) => {
        if (waiting) {
          waiting.reject('The latest aborted!')
        }
        waiting = { resolve, reject, cacheKey, args }
      })
    }

    // bound user fn
    let abortHandler: () => void | undefined
    const setAbortHandler = (handler: () => void)  => {
      if (typeof handler !== 'function') {
        throw new TypeError('Failed to execute \'setAbortHandler\': parameter 1 is not of type \'Function\'.')
      }
      abortHandler = handler
      abortHandlerList.push(handler)
    }
    let boundFn = () => fn.call(thisArg, setAbortHandler, cacheKey, ...args)

    // cache fn
    if (allowCaching) {
      boundFn = cache(boundFn, cacheTime, () => {
        caches.delete(cacheKey)
      })
      caches.set(cacheKey, boundFn)
    }

    userTaskSize++
    const userTask = boundFn()
    proxyPromise = generateProxyPromise(userTask)

    userTask.catch(() => {}).then(() => {
      userTaskSize--
      if (waiting) {
        waiting.resolve(proxy.call(thisArg, waiting.cacheKey, ...waiting.args))
        waiting = undefined
      }
      if (abortHandler) {
        const index = abortHandlerList.indexOf(abortHandler)
        if (index !== -1) {
          abortHandler.call(thisArg)
          abortHandlerList.splice(index, 1)
        }
      }
    })

    return proxyPromise.handler
  }
}
