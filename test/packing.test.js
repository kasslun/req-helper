const assert = require('assert')
const { describe, it } = require('mocha');
const { packing } =  require('../dist/req-helper.cjs');
const { microTask, getResolveFn } = require('./help')

describe('packing()', () => {
  describe('testing valid fn', () => {
    it('should arg 1: fn error', () =>  {
      assert.throws(() => packing(null), { name: 'TypeError' })
      assert.throws(() => packing(1), { name: 'TypeError' })
      assert.throws(() => packing(''), { name: 'TypeError' })
      assert.throws(() => packing({}), { name: 'TypeError' })
    });

    it('should arg 2: condition error', () =>  {
      const fn = () => Promise.resolve();
      assert.throws(() => packing(fn, -1), { name: 'TypeError' })
      assert.throws(() => packing(fn, {}), { name: 'TypeError' })
      assert.throws(() => packing(fn, '1'), { name: 'TypeError' })
      assert.throws(() => packing(fn, null), { name: 'TypeError' })
    });
  //
    it('should arg 3: prop of condition error', () =>  {
      const fn = () => Promise.resolve();
      assert.throws(() => packing(fn, {capacity: 0}), { name: 'TypeError' })
      assert.throws(() => packing(fn, {capacity: null}), { name: 'TypeError' })
      assert.throws(() => packing(fn, {duration: -1}), { name: 'TypeError' })
      assert.throws(() => packing(fn, {duration: false}), { name: 'TypeError' })
      assert.throws(() => packing(fn, {waitTime: {}}), { name: 'TypeError' })
      assert.throws(() => packing(fn, {waitTime: -4.1}), { name: 'TypeError' })
    });
  })

  describe('testing receiver', () => {
    it('should receive value', (done) => {
      const put = packing(values => {
        if (values.join(',') === '1,2,3,4,5') {
          done()
        }
      }, { capacity: 5 })
      put(1, 2, 3);
      put(4);
      put(5);
    });

    it('should receive value', (done) => {
      const put = packing(values => {
        if (values.join(',') === '1,2,3') {
          done()
        }
      }, { duration: 5 })
      put(1, 2, 3);
      setTimeout(() => put(4), 6)
    });

    it('should receive value', (done) => {
      const put = packing(values => {
        if (values.join(',') === '1,2,3') {
          done()
        }
      }, { waitTime: 2 })
      setTimeout(() => put(1), 1)
      setTimeout(() => put(2), 2)
      setTimeout(() => put(3), 3)
      setTimeout(() => put(4), 8)
    });

    it('should noop pack', () => {
      const put = packing(values => {
        if (values.join(',') === '1,2,3') {
          done()
        }
      }, { waitTime: 2 })
      put.pack();
    });

    it('should empty box', () => {
      const put = packing(values => {
        if (values.join(',') === '1,2,3') {
          done()
        }
      }, { capacity: 1 })
      put(1);
      put.pack()
    });

  })
})

