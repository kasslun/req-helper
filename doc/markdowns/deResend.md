# deResend
The `deResend()` can be used to prevent repeated requests from ajax/fetch, such as repeated submission of forms, frequent state switching, etc.  

It needs a function `fn` that returns `Promise` object as a parameter, it return a proxy function. This proxy function can control the call frequency of `fn`. `fn` is disabled(cannot call), until `Promise` object returned by `fn()` is fulfilled (or rejected).

## Usage
```js
import { deResend } from 'req-helper';
const proxyFn = deResend((arg) => {
  return fetch(url).then(response => {
    // do some
  })
});
// call the proxy function of fn
proxyFn(arg) 
```
Use as proxy method, this is useful in react, vue and other components.
```js
import { deResend } from 'req-helper'
const demo = {
  list: null,
  loading: false,
  getData: deResend(function () {
    return axios.get(url).then(list => {
      // fn bound this, cannot be an arrow function.
      this.list = list
    })
  }, function (disabled) {
    // fn bound this, cannot be an arrow function.
    this.loading = disabled
  })
}
demo.getData()
// enable
demo.getData.enable()
```
## Interface
```ts
export function deResend<T, U, V>(
    fn: (this: V, ...arg: U[]) => Promise<T>, 
    statusChange?: (this: V, disabled: boolean) => void, 
    gap?: number
): {
  (this: V, ...arg: U[]): Promise<T>;
  enable: () => void;
}
```

- #### Arguments
  - `fn(...arg)`: Function, called function. need to return a promise object.
  - `statusChange(disabled)`: Function, optional, `fn` disable status change callback. We can use this callback function to control the disabled attribute of the button or add loading to the page.
  - `gap`: Number, optional, disable gap(ms) after promise fulfilled(or rejected). Expected to be a non-negative integer, The default(`undefined`) permanently disabled; value of `0` means that you disable to the next [macro task](https://html.spec.whatwg.org/multipage/webappapis.html#task-queue).
- #### Returns
  `deResend(fn)` returns a proxy function `proxyFn` of the `fn`, the proxy receives any parameters and finally passes in `fn`
  - `peoxyFn(...arg)`: Function, proxy function of `fn`. If `peoxyFn` is called as a method, `fn` will be bound to this. The parameters received by `peoxyFn` will be passed in `fn`. It returns the `Promise` object from `fn`.
    - `proxyFn.enable()`: Let `fn` enabled.

[comment]: <> (## Have a try)

[comment]: <> ([demo]&#40;./examples/deResend.html&#41;)
