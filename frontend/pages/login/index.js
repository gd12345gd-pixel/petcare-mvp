const { request } = require('../../utils/request')

Page({
  data: {
    loading: false
  },

  handleWechatLogin() {
    if (this.data.loading) return

    this.setData({ loading: true })

    wx.login({
      success: (loginRes) => {
        if (!loginRes.code) {
          wx.showToast({ title: '获取登录code失败', icon: 'none' })
          this.setData({ loading: false })
          return
        }

        request('/api/auth/wechat-login', 'POST', {
          code: loginRes.code
        }).then((data) => {
          wx.setStorageSync('token', data.token)
          wx.setStorageSync('currentUser', data.user)

          const role = data.user.currentRole || 'USER'
          if (role === 'SITTER') {
            wx.reLaunch({
              url: '/pages-sitter/home/index'
            })
          } else {
            wx.reLaunch({
              url: '/pages-user/home/index'
            })
          }
        }).catch(() => {
          this.setData({ loading: false })
        })
      },
      fail: () => {
        wx.showToast({ title: '微信登录失败', icon: 'none' })
        this.setData({ loading: false })
      }
    })
  },

  goGuest() {
    wx.reLaunch({
      url: '/pages-user/home/index'
    })
  }
})