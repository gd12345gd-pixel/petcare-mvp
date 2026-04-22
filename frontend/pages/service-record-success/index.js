Page({
  data: {
    statusBarHeight: 20,
    navBarHeight: 44,
    navTotalHeight: 64,
    recordId: null,
    orderId: null
  },

  onLoad(options) {
    const systemInfo = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()
    const statusBarHeight = systemInfo.statusBarHeight || 20
    const navBarHeight = 44

    this.setData({
      statusBarHeight,
      navBarHeight,
      navTotalHeight: statusBarHeight + navBarHeight,
      recordId: options.recordId || null,
      orderId: options.orderId || null
    })
  },

  goRecordDetail() {
    if (!this.data.recordId) return
    wx.redirectTo({
      url: `/pages/service-record-detail/index?id=${this.data.recordId}`
    })
  },

  goOrderDetail() {
    if (!this.data.orderId) {
      wx.switchTab({ url: '/pages/sitter/index' })
      return
    }
    wx.redirectTo({
      url: `/pages/sitter/order-detail/index?id=${this.data.orderId}&mode=MINE`
    })
  }
})