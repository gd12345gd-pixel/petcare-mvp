const BASE_URL = 'http://8.146.237.74:8080'
const { clearLogin, getToken, goLogin } = require('./auth')

function request(url, method = 'GET', data = {}) {
  return new Promise((resolve, reject) => {
    const token = getToken()
    const header = token ? { Authorization: `Bearer ${token}` } : {}

    wx.request({
      url: `${BASE_URL}${url}`,
      method,
      data,
      header,
      success(res) {
        console.log('request success:', res)
        if (res.data && res.data.code === 0) {
          resolve(res.data.data)
          return
        }

        if (res.statusCode === 401 || (res.data && res.data.code === 401)) {
          clearLogin()
          wx.showToast({
            title: '请先登录',
            icon: 'none'
          })
          setTimeout(goLogin, 300)
          reject(res.data)
          return
        }

        wx.showToast({
          title: (res.data && res.data.message) || '请求失败',
          icon: 'none'
        })
        reject(res.data)
      },
      fail(err) {
        console.error('request fail:', err)
        wx.showToast({
          title: '网络异常',
          icon: 'none'
        })
        reject(err)
      }
    })
  })
}

module.exports = { request, BASE_URL }
