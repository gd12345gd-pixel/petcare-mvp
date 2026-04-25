const { clearLogin, ensureLogin, getCurrentUser, getToken, goLogin } = require('../../utils/auth')
const { request } = require('../../utils/request')

Page({
  data: {
    isLoggedIn: false,
    isAdmin: false,
    currentUser: null,
    unreadCount: 0,
    stats: {
      petCount: 0,
      orderCount: 0,
      addressCount: 0
    }
  },

  onShow() {
    const currentUser = getCurrentUser()
    const isLoggedIn = !!(getToken() && currentUser && currentUser.id)
    this.setData({
      currentUser,
      isLoggedIn,
      isAdmin: isLoggedIn && currentUser.role === 'ADMIN'
    })

    if (isLoggedIn) {
      this.loadStats(currentUser.id)
      this.loadUnreadCount()
    } else {
      this.setData({
        unreadCount: 0,
        stats: {
          petCount: 0,
          orderCount: 0,
          addressCount: 0
        },
        isAdmin: false
      })
    }
  },

  loadStats(userId) {
    Promise.all([
      request(`/api/pet/list?userId=${userId}`, 'GET').catch(() => []),
      request(`/api/orders/list?userId=${userId}`, 'GET').catch(() => []),
      request(`/api/address/list?userId=${userId}`, 'GET').catch(() => [])
    ]).then(([pets, orders, addresses]) => {
      this.setData({
        stats: {
          petCount: (pets || []).length,
          orderCount: (orders || []).length,
          addressCount: (addresses || []).length
        }
      })
    })
  },

  loadUnreadCount() {
    request('/api/notifications/unread-count', 'GET', {}, { silent: true })
      .then((res) => {
        this.setData({
          unreadCount: res && res.count ? res.count : 0
        })
      })
      .catch(() => {
        this.setData({ unreadCount: 0 })
      })
  },

  goLogin() {
    goLogin()
  },

  handleProfileTap() {
    if (this.data.isLoggedIn) {
      this.goEditProfile()
    } else {
      this.goLogin()
    }
  },

  goEditProfile() {
    if (!ensureLogin().id) return
    wx.navigateTo({
      url: '/pages/profile-edit/index'
    })
  },

  goNotifications() {
    if (!ensureLogin().id) return
    wx.navigateTo({
      url: '/pages/notification/index'
    })
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
    wx.switchTab({
      url: '/pages/order/list/index'
    })
  },
  goSitterRegister() {
    if (!ensureLogin().id) return
    wx.navigateTo({
      url: '/pages/sitter/register/index'
    })
  },
  goSitterWorkbench() {
    if (!ensureLogin().id) return
    wx.navigateTo({
      url: '/pages/sitter/workbench/index'
    })
  },
  goSitterAudit() {
    if (!ensureLogin().id) return
    if (!this.data.isAdmin) {
      wx.showToast({
        title: '仅管理员可进入',
        icon: 'none'
      })
      return
    }
    wx.navigateTo({
      url: '/pages/admin/sitter-audit/index'
    })
  },
  goFeedback() {
    if (!ensureLogin().id) return
    wx.navigateTo({
      url: '/pages/feedback/index'
    })
  },
  goFaq() {
    wx.navigateTo({
      url: '/pages/faq/index'
    })
  },
  goAbout() {
    wx.showToast({
      title: '关于我们待完善',
      icon: 'none'
    })
  },
  logout() {
    if (!this.data.isLoggedIn) return
    wx.showModal({
      title: '退出登录',
      content: '退出后将无法查看订单、宠物和地址信息，确认退出吗？',
      confirmText: '退出',
      confirmColor: '#ff5f8d',
      success: (res) => {
        if (!res.confirm) return
        clearLogin()
        this.setData({
          isLoggedIn: false,
          currentUser: null,
          isAdmin: false,
          stats: {
            petCount: 0,
            orderCount: 0,
            addressCount: 0
          }
        })
        wx.showToast({ title: '已退出', icon: 'success' })
      }
    })
  }
})
