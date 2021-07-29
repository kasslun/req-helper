# cache
The `cache()` can remember the result of `Promise` pending or fulfilled for a period of time and return the result directly in the next call, which is very useful when an ajax/fetch request is triggered frequently in a short time.

It needs a function `fn` that returns `Promise` object as a parameter, it returns a proxy function. This proxy function call can cache the results of `Promise` pending or fulfilled.

## Usage
```js
import { cache } from 'req-helper'
const proxyFn = cache(() => fetch(url), 1000)
// The promise returned by fn is cached for 1 second.
proxyFn().then(response => {
  // do something
}).catch(() => {
  // do other thing
})
```
Use as proxy method, this is useful in react, vue and other components.
```js
import { cache } from 'req-helper'
const demo = {
  list: null,
  getData: cache(
    function () {
      return axios.get(url).then(list => {
        // fn bound this, cannot be an arrow function.
        this.list = list
      })
    }, 
    1000, 
    function () {
      // fn bound this, cannot be an arrow function.
      this.list = null
    }
  )
}
demo.getData();
// cache expire
demo.getData.exipre()
```

## Interface
```ts
export function cache<T, U>(
    fn: (this: U, arg: never) => Promise<T>, 
    cacheTime?: number, 
    expirationHandler?: () => void
): {
  (this: U): Promise<T>;
  refresh: () => Promise<T>;
  expire: () => void;
}
```

- #### Arguments
  - `fn()`: Function, called function, no parameters. need to return a `Promise` object.
  - `cacheTime`: Number, optional, cache time(ms). Expected to be a non-negative integer, The default(`undefined`) permanently valid in memory; value of `0` is valid until the next [macro task](https://html.spec.whatwg.org/multipage/webappapis.html#task-queue).
  - `expirationHandler()`: Called when the cache expires.
- #### Returns
  `cache(fn)` returns a proxy function of the `fn`.
  - `peoxyFn()`: Function, proxy function of `fn`. It returns the `Promise` object from `fn`.
    - `proxyFn.refresh()`: Force call `fn` and re cache.
    - `proxyFn.expire()`: Expire cache.
  
[comment]: <> (## Have a try)

[comment]: <> ([demo]&#40;./examples/cache.html&#41;)