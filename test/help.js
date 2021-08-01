module.exports = {
  microTask(fn) {
    return Promise.resolve().then(fn)
  },

  macroTask(fn) {
    setTimeout(fn, 1);
  },

  getResolveFn(getValue, time = 100) {
    return function () {
      return new Promise(resolve => {
        setTimeout(() => {
          resolve(typeof getValue === 'function' ? getValue(): getValue)
        }, time);
      })
    }
  }
}