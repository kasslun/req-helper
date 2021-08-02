const assert = require('assert')
const { describe, it } = require('mocha');
const { cache } =  require('../dist/req-helper.cjs');
const { microTask, getResolveFn } = require('./help')

describe('cache()', () => {
  describe('testing valid fn', () => {
    it('should arg 1: fn error', () =>  {
      assert.throws(() => cache(null), { name: 'TypeError' })
      assert.throws(() => cache(1), { name: 'TypeError' })
      assert.throws(() => cache(''), { name: 'TypeError' })
      assert.throws(() => cache({}), { name: 'TypeError' })
    });

    it('should arg 2: cacheTime error', () =>  {
      const fn = () => Promise.resolve();
      assert.throws(() => cache(fn, -1), { name: 'TypeError' })
      assert.throws(() => cache(fn, NaN), { name: 'TypeError' })
      assert.throws(() => cache(fn, '1'), { name: 'TypeError' })
      assert.throws(() => cache(fn, {}), { name: 'TypeError' })
    });

    it('should arg 3: expirationHandler error', () =>  {
      const fn = () => Promise.resolve();
      assert.throws(() => cache(fn, 1, false), { name: 'TypeError' })
      assert.throws(() => cache(fn, 1, 1), { name: 'TypeError' })
      assert.throws(() => cache(fn, 1, ''), { name: 'TypeError' })
      assert.throws(() => cache(fn, 1, []), { name: 'TypeError' })
    });
  })

  describe('testing fn\'s returns', () => {
    it('should get value', (done) => {
      const value = 'hi'
      const fn = () => Promise.resolve(value);
      cache(fn)().then(v => {
        if (v === value) {
          done()
        }
      })
    });

    it('should no promise error', () => {
      assert.throws(() => cache(() => {})(), { name: 'TypeError' })
    });

    it('should promise rejected success', done => {
      cache(() => Promise.reject(new Error()))().catch(() => done())
    });

    it('should promise rejected no cache', done => {
      const proxyFn = cache(() => Promise.reject(Math.random()));
       Promise.all([
         proxyFn().catch(e => e), microTask(proxyFn).catch(e => e)
       ]).then(([v1, v2]) => {
         if (v1 !== v2) {
           done()
         }
       })
    })
  })

  describe('testing cacheTime value', () => {
    it('should cacheTime = 0', done => {
      let value;
      const fn = getResolveFn(() => {
        let newValue = Math.random()
        value = value || newValue;
        return newValue;
      }, 10)
      const proxyFn = cache(fn, 0);
      proxyFn();
      setTimeout(() => {
        proxyFn().then(v => {
          value !== v && done();
        })
      }, 1)
    });

    it('should cacheTime = 0 and cache', done => {
      let value;
      const fn = getResolveFn(() => {
        let newValue = Math.random()
        value = value || newValue;
        return newValue;
      }, 10)
      const proxyFn = cache(fn, 0);
      proxyFn();
      proxyFn().then(v => {
        value === v && done();
      })
    });

    it('should cacheTime > 0', done => {
      let value;
      const fn = getResolveFn(() => {
        let newValue = Math.random()
        value = value || newValue;
        return newValue;
      }, 1)
      const proxyFn = cache(fn, 5);
      proxyFn();
      setTimeout(() => {
        proxyFn().then(v => {
          value === v && done();
        })
      }, 1)
    });

    it('should cacheTime > 0 and expire', done => {
      let value;
      const fn = getResolveFn(() => {
        let newValue = Math.random()
        value = value || newValue;
        return newValue;
      }, 1)
      const proxyFn = cache(fn, 2);
      proxyFn();
      setTimeout(() => {
        proxyFn().then(v => {
          value !== v && done();
        })
      }, 5)
    });
  })

  describe('testing expire()', () => {

    it('should expire ok', function (done) {
      let value;
      const fn = getResolveFn(() => {
        let newValue = Math.random()
        value = value || newValue;
        return newValue;
      }, 1)
      const proxyFn = cache(fn, 5);
      proxyFn();
      setTimeout(() => {
        proxyFn.expire()
        proxyFn().then(v => {
          value !== v && done();
        })
      }, 1)
    });
  })

  describe('testing the <this>', () => {
    it('should <this> ok', function (done) {
      const demo = {
        proxyFn: cache(function () {
          if (demo === this) {
            done()
          }
          return Promise.resolve()
        })
      }
      demo.proxyFn();
    });
  })

  describe('testing this expirationHandler', () => {
    it('should 0 ms expire', (done) => {
      cache(() => Promise.resolve(), 0, () => {
        done();
      })()
    });

    it('should 0 ms expire method', (done) => {
      const proxy = cache(() => Promise.resolve(), 0, () => {
        done();
      })
      proxy();
      proxy.expire();
    });

    it('should 1 ms expire', (done) => {
      cache(() => Promise.resolve(), 1, () => {
        done();
      })()
    });

    it('should expire method', (done) => {
      const proxy = cache(() => Promise.resolve(), undefined, () => {
        done();
      })
      proxy();
      setTimeout(() => proxy.expire(), 1)
    });
    it('should expire method', (done) => {
      const proxy = cache(() => Promise.resolve(), undefined, () => {
        done();
      })
      proxy();
      proxy(true);
    });
  })
})

