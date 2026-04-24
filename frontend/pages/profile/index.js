const { ensureLogin, getCurrentUser, getToken, goLogin } = require('../../utils/auth')

Page({
  data: {
    isLoggedIn: false,
    currentUser: null
  },

  onShow() {
    const currentUser = getCurrentUser()
    this.setData({
      currentUser,
      isLoggedIn: !!(getToken() && currentUser && currentUser.id)
    })
  },

  goLogin() {
    goLogin()
  },

  goMyPets() {
    if (!ensureLogin().id) return
    wx.navigateTo({
      url: '/pages/pet-list/index'
    })
  },
  goAddressList() {
    if (!ensureLogin().id) return
    wx.navigateTo({
      url: '/pages/address-list/index?from=profile'
    })
  },
  goMyOrders() {
    if (!ensureLogin().id) return
    wx.navigateTo({
      url: '/pages/order/list/index?from=profile'
    })
  }
})
