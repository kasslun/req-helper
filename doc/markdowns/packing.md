# packing

The `packing()` can be used to merge requests, through which you can package (push a single data into an array) a batch of data for batch sending. Used to reduce the number of requests. It supports packaging within a fixed time `duration` and alive time `waitTime`, as well as packaging by size `capacity`.

It is mainly used to reduce the number of requests in frequent request scenarios such as system monitoring data reporting and user's behavior data reporting.

## Usage

```js
import { packing } from 'req-helper'
const put = packing(
  packagedData => {
    // Triggered if packagedData not empty.
    sendData(packagedData)
  },
  {
    // Pack every 60 seconds.
    duration: 60000,
    // Or pack up to 10.
    capacity: 10
  }
)
put(dataItem1, dataItem2)
```
Use as proxy method, this is useful in react, vue and other components.
```js
import { packing } from 'req-helper'
const demo = {
  put: packing(function (packagedData) {
    // this function bound this, cannot be an arrow function.
    this.send(packagedData)
  }, { waitTime: 5000 })
}
demo.put({ a: 1 })
```

## Interface
```ts
export function packing<T, U>(receiver: (this: U, arg: T[]) => any, condition: {
    readonly duration?: number;
    readonly waitTime?: number;
    readonly capacity?: number;
}): {
  (arg: T): void;
  pack: () => void;
}
```
- #### Arguments
  - `receiver(packagedData)`: Function, `packagedData`(array) receiver. Triggered when the condition of parameter 2 is arbitrarily satisfied and the package is not empty.
  - `condition`: Object, Conditions that trigger packaging. There must be more than 1 of the 3 conditions. 
    - `condition.duration`: Number, optional. The packaging is triggered again after a fixed time(ms) at the last trigger; value of `0` triggers packaging at the next [macro task](https://html.spec.whatwg.org/multipage/webappapis.html#task-queue). *This condition takes effect when `put()` is called again after packaging.*
    - `condition.waitTime`: Number, optional. Packaging is triggered if it is not put again within a period of time(ms) after the last put; value of `0` triggers packaging at the next macro task. *This condition takes effect again each time `put()` is called.*
    - `condition.capacity`: Number, optional. Triggered when the number of put reaches or exceeds the capacity. *This condition is determined each time `put()` is called.*
- #### Returns
The `packing(receiver, condition)` Returns a `put` function to receive data.
  - `put(data[, ...moreData])`: Put one or more data for packaging.
    - `put.pack()`: Function, return boolean. Trigger packaging. Trigger the `receiver()` if the package is not empty.

[comment]: <> (## Have a try)

[comment]: <> ([demo]&#40;./examples/packing.html&#41;)
