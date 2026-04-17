const BASE_URL = 'http://127.0.0.1:8080'

function request(url, method = 'GET', data = {}) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${BASE_URL}${url}`,
      method,
      data,
      success(res) {
        console.log('request success:', res)
        if (res.data && res.data.code === 0) {
          resolve(res.data.data)
        } else {
          wx.showToast({
            title: (res.data && res.data.message) || '请求失败',
            icon: 'none'
          })
          reject(res.data)
        }
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