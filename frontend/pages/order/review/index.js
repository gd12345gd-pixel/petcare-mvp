const { request } = require('../../../utils/request')

Page({
  data: {
    statusBarHeight: 20,
    navBarHeight: 44,
    navTotalHeight: 64,
    orderId: null,
    rating: 5,
    tags: [
      { label: '服务准时', selected: false },
      { label: '照护细心', selected: false },
      { label: '沟通及时', selected: false },
      { label: '记录清晰', selected: false },
      { label: '宠物喜欢', selected: false },
      { label: '值得推荐', selected: false }
    ],
    content: '',
    submitting: false
  },

  onLoad(options) {
    const systemInfo = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()
    const statusBarHeight = systemInfo.statusBarHeight || 20
    const navBarHeight = 44
    this.setData({
      statusBarHeight,
      navBarHeight,
      navTotalHeight: statusBarHeight + navBarHeight,
      orderId: options.id || null
    })
  },

  navigateBack() {
    wx.navigateBack({ delta: 1 })
  },

  chooseRating(e) {
    const rating = Number(e.currentTarget.dataset.rating || 5)
    this.setData({ rating })
  },

  toggleTag(e) {
    const label = e.currentTarget.dataset.label
    const tags = this.data.tags.map(item => item.label === label ? { ...item, selected: !item.selected } : item)
    this.setData({ tags })
  },

  onContentInput(e) {
    this.setData({ content: (e.detail.value || '').slice(0, 200) })
  },

  submitReview() {
    if (!this.data.orderId) {
      wx.showToast({ title: '订单信息异常', icon: 'none' })
      return
    }
    if (!this.data.rating) {
      wx.showToast({ title: '请选择评分', icon: 'none' })
      return
    }
    if (this.data.submitting) return

    this.setData({ submitting: true })
    wx.showLoading({ title: '提交中' })
    request('/api/reviews/submit', 'POST', {
      orderId: this.data.orderId,
      rating: this.data.rating,
      tags: this.data.tags.filter(item => item.selected).map(item => item.label),
      content: this.data.content.trim()
    }).then(() => {
      wx.hideLoading()
      wx.showToast({ title: '评价已提交', icon: 'success' })
      setTimeout(() => {
        wx.navigateBack({ delta: 1 })
      }, 700)
    }).catch(() => {
      wx.hideLoading()
    }).finally(() => {
      this.setData({ submitting: false })
    })
  }
})
