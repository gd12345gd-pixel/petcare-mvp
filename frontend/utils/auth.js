function getCurrentUser() {
  return wx.getStorageSync('currentUser') || null
}

function getToken() {
  return wx.getStorageSync('token') || ''
}

function buildLoginUrl() {
  const pages = getCurrentPages()
  const current = pages && pages.length ? pages[pages.length - 1] : null
  if (!current || !current.route || current.route === 'pages/login/index') {
    return '/pages/login/index'
  }

  const options = current.options || {}
  const query = Object.keys(options)
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(options[key])}`)
    .join('&')
  const returnUrl = `/${current.route}${query ? `?${query}` : ''}`
  return `/pages/login/index?returnUrl=${encodeURIComponent(returnUrl)}`
}

function goLogin() {
  const url = buildLoginUrl()
  wx.navigateTo({
    url,
    fail: () => {
      wx.redirectTo({ url })
    }
  })
}

function ensureLogin() {
  const token = getToken()
  const user = getCurrentUser()
  if (token && user && user.id) {
    return user
  }

  wx.showToast({
    title: '请先登录',
    icon: 'none'
  })
  setTimeout(goLogin, 300)
  return { id: 0 }
}

function clearLogin() {
  wx.removeStorageSync('token')
  wx.removeStorageSync('currentUser')
}

module.exports = {
  clearLogin,
  ensureLogin,
  getCurrentUser,
  getToken,
  goLogin
}
