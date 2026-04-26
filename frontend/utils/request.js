const { getToken } = require('./auth')

const BASE_URL = 'http://8.146.237.74:8080'

/**
 * 上传接口返回的静态 URL：仅在明显无效本机地址时改写到 BASE_URL，
 * 避免服务端已是公网域名（如 https://baisui.online/uploads/...）仍被强行换成 BASE_URL 导致入库成 IP。
 */
function resolveUploadedMediaUrl(url) {
  if (!url || typeof url !== 'string') return url
  const lower = url.toLowerCase()
  const isLocalHost =
    lower.includes('localhost') ||
    lower.includes('127.0.0.1') ||
    lower.startsWith('file:')
  if (!isLocalHost) return url

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
