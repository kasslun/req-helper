# polling
The ```polling()``` controls the polling of ajax/fetch. It needs an argument `fn` of function type, and `fn` needs to return a `Promise` object. When `polling()` is called, `fn` is called synchronously. When the `Promise` object returned by the `fn` call, it will call the `fn` again after `gap` (unit:ms) and loop indefinitely.
```js
-> polling(fn, gap)
  -> fn() 
  -> promise fulfilled(or rejected)
  ----------wait gap ms---------
  
  -> fn()
  -> promise fulfilled(or rejected)
  ----------wait gap ms---------
  
  -> fn() 
  ......
```
## Usage
```js
import { polling } from 'req-helper';
// start polling
polling(() => {
  return fetch(url).then(response => {
    // do some
  })
}, 1000);
```
You can control the call of `fn`.
```js
import { polling } from 'req-helper';
const controller = polling(() => {
  return fetch(url).then(response => {
    // do some
  })
}, 1000);
controller.stop()
controller.resume()
controller.refresh(3000)
```

## Interface

```typescript
export function polling<T>(fn: () => Promise<T>, gap?: number): {
  readonly stop: () => void;
  readonly resume: () => void;
  readonly refresh: (newGap?: number) => void;
}
```
- #### Arguments
  - `fn`: Function, polled function, no parameters. need to return a promise object.
  - `gap`: Number, optional, polling gap(ms) after promise fulfilled(or rejected). Expected to be a positive integer, The default value is 10000.
- #### Returns
  `polling()` returns an object `controller` to control the call of `fn`.
  - `controller.stop()`: Stop `fn`'s call loop.
  - `controller.resume()`: If the loop stops, will resume.
  - `controller.refresh([newGap])`: Stop `fn`'s call loop and start a new call loop immediately. If the parameter `newGap`(number) is passed in, the new loop follow the `newGap`.

If you need to destroy `polling`, you can call `controller.stop()` and break the reference of the `controller`.
```js 
let controller = polling(fn, gap);
// destroy, gc
controller.stop();
controller = undefined;
```

[comment]: <> (## Have a try)

[comment]: <> ([demo]&#40;./examples/polling.html&#41;)