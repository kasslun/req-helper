# latest
The `latest()` used to frequently request a resource through different query terms in a short time (for example, more than one second). For example, `<input>` query input suggestions during fast input.

It can limit the number of concurrent requests through parameters to prevent browser requests from queuing (see browser concurrency). It can also temporarily cache the response of the request through query criteria (which need to be string or number).

The `latest()` needs a function that returns `Promise` object as parameter `fn`, and returns a proxy function `proxyFn` to control the call and arguments of `fn`.

## Usage
The parameter 1 of `fn` is a function that sets the abort function. The abort function can abort the ajax request and change the returned promise from pending to rejected.
```js
import { latest } from 'req-helper'
const CancelToken = axios.CancelToken;
const source = CancelToken.source();

const proxyFn = latest(
  (setCancelHandler, keyword, other) => {
    // set an abort handler
    setCancelHandler(() => {
      source.cancel('abort~')
    })
    return axios.get('https://host/query?q=' + keyword, {
      cancelToken: source.token
    })
  }, 
  { cache }
)

buttonDom.addEventListener('click', () => proxyFn(keyword, other))
```
Use as proxy method, this is useful in react, vue and other components.
```js
import { latest } from 'req-helper'
const demo = {
  list: null,
  query: latest(function (setAbortHandler, keyword) {
    // this function bound this, cannot be an arrow function.
    setAbortHandler(cacheHandler)
    axios.get('https://host/query?q=' + keyword, {
      cancelToken: source.token
    }).then(list => this.list = list)
  })
}

demo.query(keyword)
```
## Interface
```ts
export function latest<T, U, V, W>(
  fn: (
    this: U,
    setAbortHandler: (abortHandler: () => void) => void,
    cacheKey?: W,
    ...args: V[]
  ) => Promise<T>,
  config?: { readonly cacheTime?: number; readonly maxTasks: number; }
): (this: U, cacheKey?: W, ...args: V[]) => Promise<T>;
```
#### Arguments
- `fn(setAbortHandler, cacheKey [, ...arg])`: Function, Send request and return Promise object. It receives the parameters passed by `proxyFn` starting with parameter 2 (See Returns part).
  - `setAbortHandler(abortHandler)`: Function, parameters 1 of `fn`, We need to set an abort function `abortHandler` to abort the ajax/fetch request so that the `Promise` returned by `fn` changes from pending to rejected.
    (Fetch abort see [AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController))
  - `cahceKey`: Any type. If the type is String or Number(not NaN) , the fulfilled `Promise` returned by `fn` will be cached through dictionary key `cahceKey`, and the cache time is set through `config.cacheTime`. If you need no cache, 
  
```js
// Cached.
const proxyFn = latest(fn, { cacheTime: 1000 });
// cacheKey's type is String or Number(not NaN).
proxyFn('hello');

// No cache.
// The config.cacheTime is default no cache (See Returns part).
const proxyFn = latest(fn);
// Or yout can also let cacheKey's type not is String and Number.
proxyFn(null);
```
- `config`: Object, optional, default `{ maxTasks: 4 }`. 
  - `config.cacheTime`: Number, optional, positive integer. Cache time(ms) of results corresponding to dictionary key `cachekey`.
  - `canfig.maxTasks`: Number, optional, positive integer, default `4`. Maximum number of concurrent request.

Set cache time `config.cacheTime` and maximum concurrency `config.maxTasks`.
```js
import { latest } from 'req-helper'
latest((set) => {}, {
  // Cache according to the cachekey parameter
  cacheTime: 1000,
  // Set request concurrency
  maxTasks: 4
})
```

#### Returns
`latest()` returns a proxy function `proxyFn` of the `fn`, the proxy function receives any parameters and finally passes in `fn`.
- `proxyFn([cacheKey, ...args])`: Function. proxy function. It returns the `Promise` object from `fn`.

[comment]: <> (## Have a try)

[comment]: <> ([demo]&#40;./examples/latest.html&#41;)