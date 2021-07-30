# req-helper

The req-helper  is an ajax, fetch and other interface request help library. It provides some functions to reduce the number of HTTP requests. Proxy functions are used to control the sending frequency of requests and cache responses.

It is applicable to client-side JavaScript (such as Browser, React Native, Electron) and server-side Node environment.

## Install and usage

Install via npm or yarn.
```shell
npm install req-helper
```
or
```shell
yarn add req-helper
```

It supports es module, commonJs module and AMD module loading and running.
```js
// es module
import { polling } from 'req-helper'
```

```js
// commonJs module
const { polling } = require('req-helper')
```
```js
// AMD module
require('req-helper', ({ polling }) => { 
  // Do something
})
```

## Function description
- [cache](./doc/markdowns/cache.md): The response to a request is cached in memory for a period of time.
- [deResend](./doc/markdowns/deResend.md): Prevent duplicate requests.
- [latest](./doc/markdowns/latest.md): Control frequent queries in a short time through cache and concurrency restrictions.
- [packing](./doc/markdowns/packing.md): Merge frequently requested data and use the requested data for batch interface.
- [polling](./doc/markdowns/polling.md): Polling for the same request.


## Documentation
[Click to see the documentation](https://kasslun.github.io/req-helper.doc/)

## License

The MIT License (MIT)

Copyright (c) 2021 kasslun

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
