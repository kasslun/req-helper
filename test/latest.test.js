const assert = require('assert')
const { describe, it } = require('mocha');
const { latest } =  require('../dist/req-helper.cjs');
const { microTask, getResolveFn } = require('./help')


describe('latest()', () => {
  describe('testing valid fn', () => {
    it('should arg 1: fn error', () =>  {
      assert.throws(() => latest(null), { name: 'TypeError' })
      assert.throws(() => latest(1), { name: 'TypeError' })
      assert.throws(() => latest(''), { name: 'TypeError' })
      assert.throws(() => latest({}), { name: 'TypeError' })
    });

    it('should arg 2: config error', () =>  {
      const fn = () => Promise.resolve();
      assert.throws(() => latest(fn, -1), { name: 'TypeError' })
      assert.throws(() => latest(fn, '1'), { name: 'TypeError' })
      assert.throws(() => latest(fn, null), { name: 'TypeError' })
    });

    it('should arg 2: cacheTime error', () =>  {
      const fn = () => Promise.resolve();
      assert.throws(() => latest(fn, { cacheTime: 0 }), { name: 'TypeError' })
      assert.throws(() => latest(fn, { cacheTime : null}), { name: 'TypeError' })
      assert.throws(() => latest(fn, { cacheTime: NaN }), { name: 'TypeError' })
      assert.throws(() => latest(fn, { cacheTime: {} }), { name: 'TypeError' })
      assert.throws(() => latest(fn, { cacheTime: false }), { name: 'TypeError' })
    });

    it('should arg 2: maxTasks error', () =>  {
      const fn = () => Promise.resolve();
      assert.throws(() => latest(fn, { maxTasks: 0 }), { name: 'TypeError' })
      assert.throws(() => latest(fn, { maxTasks : null}), { name: 'TypeError' })
      assert.throws(() => latest(fn, { maxTasks: NaN }), { name: 'TypeError' })
      assert.throws(() => latest(fn, { maxTasks: {} }), { name: 'TypeError' })
      assert.throws(() => latest(fn, { maxTasks: false }), { name: 'TypeError' })
    });
  })

  describe('testing fn\'s returns', () => {
    it('should get value', (done) => {
      const value = 'hi'
      const fn = () => Promise.resolve(value);
      latest(fn)().then(v => {
        if (v === value) {
          done()
        }
      })
    });

    it('should no promise error', () => {
      assert.throws(() => latest(() => {})(), { name: 'TypeError' })
    });

    it('should promise rejected success', done => {
      latest(() => Promise.reject(new Error()))().catch(() => done())
    });
  })

  describe('testing latest config.maxTasks', () => {
    it('should maxTasks = 2 and size = 3', done => {
      let size = 0;
      let fn = (setAbortHandler, key, num) => {
        let rejectHandler
        const pms = new Promise((resolve, reject) => {
          rejectHandler = reject;
          size++
          setTimeout(resolve, 4);
        })
        setAbortHandler(() => {
          rejectHandler();
        });
        return pms;
      }
      const proxyFn = latest(fn, { maxTasks: 2 });
      proxyFn(null, 1);
      proxyFn(null, 2);
      proxyFn(null, 3);
      proxyFn(null, 4);
      proxyFn(null, 5);
      setTimeout(() => {
        if (size === 3) {
          done()
        }
      }, 10)
    });

    it('should maxTasks = 2 and rejected', done => {
      let size = 0;
      const fn = getResolveFn(() => {
        size++;
      }, 5)
      const proxyFn = latest(fn, { maxTasks: 2 });
      proxyFn().catch(() => done());
      proxyFn();
      setTimeout(() => {
        proxyFn();
      }, 2)
    });

  })


  describe('testing latest config.cacheTime', () => {
    it('is cache', done => {
      let value = 0;
      const fn = getResolveFn(() => {
        let v = Math.random();
        value = value || v;
        return v;
      }, 2)
      const proxyFn = latest(fn, { cacheTime: 3});
      proxyFn('1');
      setTimeout(() => {
        proxyFn('1').then(v => {
          if (v === value) {
            done()
          }
        })
      }, 1)
    });

    it('cache expire', done => {
      let value = 0;
      const fn = getResolveFn(() => {
        let v = Math.random();
        value = value || v;
        return v;
      }, 2)
      const proxyFn = latest(fn, { cacheTime: 2});
      proxyFn('1');
      setTimeout(() => {
        proxyFn('1').then(v => {
          if (v !== value) {
            done()
          }
        })
      }, 3)
    });

    it('no cache', done => {
      let value = 0;
      const fn = getResolveFn(() => {
        let v = Math.random();
        value = value || v;
        return v;
      }, 2)
      const proxyFn = latest(fn, { cacheTime: 2});
      proxyFn(NaN);
      setTimeout(() => {
        proxyFn().then(v => {
          if (v !== value) {
            done()
          }
        })
      }, 1)
    });

    it('no cache 1', done => {
      let value = 0;
      const fn = getResolveFn(() => {
        let v = Math.random();
        value = value || v;
        return v;
      }, 2)
      const proxyFn = latest(fn, { cacheTime: undefined});
      proxyFn(1);
      setTimeout(() => {
        proxyFn(1).then(v => {
          if (v !== value) {
            done()
          }
        })
      }, 1)
    });
  })

  describe('testing abort', () => {
    let fn = (setAbortHandler, key, done) => {
      let rejectHandler
      const pms = new Promise((resolve, reject) => {
        rejectHandler = reject;
        setTimeout(resolve, 10);
      })
      setAbortHandler(() => {
        done && done()
        rejectHandler();
      });
      return pms;
    }

    it('should abort',  (done) => {
      const proxyFn = latest(fn, { maxTasks: 2});
      proxyFn(null, done);
      proxyFn(null, done)
      proxyFn(null, done)
    });

    it('should abort error',  () => {
      const proxyFn = latest(setAbortHandler => {
        setAbortHandler(null)
        return Promise.resolve();
      }, { maxTasks: 1});
      assert.throws(() => proxyFn(), { name: 'TypeError' })
    });

  })

  describe('testing the <this>', () => {
    it('should <this> ok', function (done) {
      const demo = {
        proxyFn: latest(function () {
          if (demo === this) {
            done()
          }
          return Promise.resolve()
        })
      }
      demo.proxyFn();
    });

    it('should abort <this> ok', function (done) {
      const demo = {
        proxyFn: latest(function (setAbort, key, isDone) {
          if (isDone && demo === this) {
            done()
          }
          return Promise.resolve()
        }, { maxTasks: 1 })
      }
      demo.proxyFn();
      demo.proxyFn(null, true);
    });
  })
})