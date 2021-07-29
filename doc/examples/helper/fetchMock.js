export default (minGap = 200, maxGap = 200, token = undefined) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve()
    }, minGap + Math.random() * (maxGap - minGap));
    if (typeof token === 'object') {
      token.abort = () => {
        reject()
      };
    }
  })
}