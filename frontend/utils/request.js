const { getToken } = require('./auth')

const BASE_URL = 'http://127.0.0.1:8080'

/** 将接口返回的静态文件 URL 对齐到当前 BASE_URL（避免服务端 access-url-prefix 为 localhost 时真机无法加载） */
function resolveUploadedMediaUrl(url) {
  if (!url || typeof url !== 'string') return url
  const idx = url.indexOf('/uploads/')
  if (idx !== -1) {
    return `${BASE_URL}${url.slice(idx)}`
  }
  return url
}

function request(url, method = 'GET', data = {}) {
  return new Promise((resolve, reject) => {
    const token = getToken()
    const header = {}
    if (token) {
      header.Authorization = `Bearer ${token}`
    }

    wx.request({
      url: `${BASE_URL}${url}`,
      method,
      data,
      header,
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

module.exports = { request, BASE_URL, resolveUploadedMediaUrl }
