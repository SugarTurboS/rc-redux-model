const getUserInfo = (payload) => {
  const user = {
    name: '彭道宽',
    job: 'CVTE FE',
  }
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve({
        code: 0,
        data: user,
      })
    }, 2000)
  })
}
module.exports = getUserInfo
