const assert = require('assert')
const { describe, it } = require('mocha');
const { polling } =  require('../dist/req-helper.cjs');
const { microTask, getResolveFn } = require('./help')

describe('polling()', () => {
  describe('testing valid fn', () => {
    it('should arg 1: fn error', () =>  {
      assert.throws(() => polling(null), { name: 'TypeError' })
      assert.throws(() => polling(1), { name: 'TypeError' })
      assert.throws(() => polling(''), { name: 'TypeError' })
      assert.throws(() => polling({}), { name: 'TypeError' })
    });

    it('should arg 2: gap error', () =>  {
      const fn = () => Promise.resolve();
      assert.throws(() => polling(fn, -1), { name: 'TypeError' })
      assert.throws(() => polling(fn, NaN), { name: 'TypeError' })
      assert.throws(() => polling(fn, '1'), { name: 'TypeError' })
      assert.throws(() => polling(fn, null), { name: 'TypeError' })
      assert.throws(() => polling(fn, 0), { name: 'TypeError' })
    });
  })

  describe('testing polling fn', () => {
    it('should fn returns error', () => {
      assert.throws(() => polling(() => {}), { name: 'TypeError' })
    });
  })

  describe('testing poling stop', () => {
    it('should polling size', (done) => {
      let size = 0;
      const controller = polling(() => {
        size++;
        if (size >= 5) {
          controller.stop()
          done()
        }
        return Promise.resolve()
      }, 1)
    });

    it('should polling timer size', (done) => {
      let size = 0;
      const controller = polling(() => {
        size++;
        return Promise.resolve()
      }, 5)

      setTimeout(() => controller.stop(), 3)
      setTimeout(() => {
        if (size === 1) {
          done()
        }
      }, 6)
    });
  })

  describe('testing poling resume', () => {
    it('should resume on init', function (done) {
      let size = 0;
      const controller = polling(() => {
        size++;
        if (size === 2) {
          controller.stop()
          done()
        }
        return Promise.resolve()
      }, 5)
      setTimeout(() => {
        controller.stop()
        controller.resume()
      }, 3)
    });

    it('should resume on will stop', function (done) {
      let size = 0;
      const controller = polling(getResolveFn(() => {
        size++;
        if (size === 2) {
          controller.stop()
          done()
        }
        return size;
      }, 10), 1)
      setTimeout(() => {
        controller.stop()
        controller.resume()
      }, 5)
    });
  })

  describe('testing poling refresh', () => {
    it('should refresh on init', function (done) {
      let size = 0;
      const controller = polling(() => {
        size++;
        if (size === 2) {
          controller.stop()
          done()
        }
        return Promise.resolve()
      }, 5)
      setTimeout(() => {
        controller.stop()
        controller.refresh()
      }, 3)
    });

    it('should refresh on will stop', function (done) {
      let size = 0;
      const controller = polling(getResolveFn(() => {
        size++;
        if (size === 2) {
          controller.stop()
          done()
        }
        return size;
      }, 10), 1)
      setTimeout(() => {
        controller.stop()
        controller.refresh()
      }, 5)
    });

    it('should refresh on timer', (done) => {
      let size = 0;
      const controller = polling(() => {
        size++;
        return Promise.resolve()
      }, 5)

      setTimeout(() => {
        controller.refresh(5)
        if (size === 2) {
          controller.stop();
          done()
        }
      }, 3)
    });

    it('should new gap error', function () {
      const controller = polling(() => Promise.resolve(), 5)
      assert.throws(() => controller.refresh(0), { name: 'TypeError'})
      assert.throws(() => controller.refresh(NaN), { name: 'TypeError'})
      assert.throws(() => controller.refresh(false), { name: 'TypeError'})
      assert.throws(() => controller.refresh(0.1), { name: 'TypeError'})
      controller.stop()
    });
  })
})

