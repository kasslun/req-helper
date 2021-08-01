const assert = require('assert')
const { describe, it } = require('mocha');
const { deResend } =  require('../dist/req-helper.cjs');
const { microTask, getResolveFn } = require('./help')

const none = () => {}
describe('deResend()', () => {
  describe('testing valid fn', () => {
    it('should arg 1: fn error', () =>  {
      assert.throws(() => deResend(null), { name: 'TypeError' })
      assert.throws(() => deResend(1), { name: 'TypeError' })
      assert.throws(() => deResend(''), { name: 'TypeError' })
      assert.throws(() => deResend({}), { name: 'TypeError' })
    });

    it('should arg 2: statusChange error', () =>  {
      const fn = () => Promise.resolve();
      assert.throws(() => deResend(fn, -1), { name: 'TypeError' })
      assert.throws(() => deResend(fn, {}), { name: 'TypeError' })
      assert.throws(() => deResend(fn, '1'), { name: 'TypeError' })
      assert.throws(() => deResend(fn, null), { name: 'TypeError' })
    });

    it('should arg 3: gap error', () =>  {
      const fn = () => Promise.resolve();
      assert.throws(() => deResend(fn, none, null), { name: 'TypeError' })
      assert.throws(() => deResend(fn, none, -1), { name: 'TypeError' })
      assert.throws(() => deResend(fn, none, ''), { name: 'TypeError' })
      assert.throws(() => deResend(fn, none, []), { name: 'TypeError' })
    });
  })

  describe('testing fn\'s returns', () => {
    it('should get value', (done) => {
      const value = 'hi'
      const fn = () => Promise.resolve(value);
      deResend(fn)().then(v => {
        if (v === value) {
          done()
        }
      })
    });

    it('should no promise error', () => {
      assert.throws(() => deResend(() => {})(), { name: 'TypeError' })
    });

    it('should promise rejected success', done => {
      deResend(() => Promise.reject(new Error()))().catch(() => done())
    });
  })

  describe('testing deResend function', () => {
    it('should gap = 0', done => {
      let size = 0;
      const fn = getResolveFn(() => {
        size++;
      }, 2)
      const proxyFn = deResend(fn, none, 0);
      proxyFn();
      proxyFn();
      setTimeout(() => {
        if (size === 1) {
          done()
        }
      }, 10)
    });

    it('should gap = 0 and call gap = 1', done => {
      let size = 0;
      const fn = getResolveFn(() => {
        size++;
      }, 1)
      const proxyFn = deResend(fn, none, 0);
      proxyFn();
      setTimeout(proxyFn, 3)
      setTimeout(() => {
        if (size === 2) {
          done()
        }
      }, 10)
    });

    it('should gap = 5', done => {
      let size = 0;
      const fn = getResolveFn(() => {
        size++;
      }, 1)
      const proxyFn = deResend(fn, none, 5);
      proxyFn();
      setTimeout(proxyFn, 2)
      setTimeout(proxyFn, 3)
      setTimeout(proxyFn, 4)
      setTimeout(() => {
        if (size === 1) {
          done()
        }
      }, 10)
    });

    it('should statusChange 1', done => {
      const fn = getResolveFn(1, 1)
      let disabledCache;
      const proxyFn = deResend(fn, disabled => {
        disabledCache = disabledCache === undefined ? disabled : disabledCache;
        if (disabled === false && disabledCache) {
          done()
        }
      }, 1)();
    });

    it('should gap = 5 and enable', done => {
      let size = 0;
      const fn = getResolveFn(() => {
        size++;
      }, 1)
      const proxyFn = deResend(fn, none, 5);
      proxyFn();
      setTimeout(proxyFn.enable, 2)
      setTimeout(proxyFn, 3)
      setTimeout(() => {
        if (size === 2) {
          done()
        }
      }, 10)
    });
  })


  describe('testing the <this>', () => {
    it('should <this> ok', function (done) {
      const demo = {
        proxyFn: deResend(function () {
          if (demo === this) {
            done()
          }
          return Promise.resolve()
        })
      }
      demo.proxyFn();
      demo.proxyFn.enable()
    });
  })
})