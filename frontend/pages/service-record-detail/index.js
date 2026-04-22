const { request } = require('../../utils/request')

Page({
  data: {
    statusBarHeight: 20,
    navBarHeight: 44,
    navTotalHeight: 64,

    id: null,
    loading: true,
    record: null,

    completedItemTextMap: {
      FED: '已喂食',
      WATER_CHANGED: '已换水',
      CLEANED: '已清理',
      PLAYED: '已陪玩',
      LITTER_CHANGED: '已补充猫砂',
      CHECKED_STATUS: '已检查状态'
    },
    petStatusTextMap: {
      NORMAL: '状态正常',
      APPETITE_NORMAL: '食欲正常',
      NERVOUS: '情绪紧张',
      ABNORMAL: '有异常'
    }
  },

  onLoad(options) {
    const systemInfo = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()
    const statusBarHeight = systemInfo.statusBarHeight || 20
    const navBarHeight = 44

    this.setData({
      statusBarHeight,
      navBarHeight,
      navTotalHeight: statusBarHeight + navBarHeight,
      id: options.id || null
    })

    this.loadDetail()
  },

  navigateBack() {
    const pages = getCurrentPages()
    if (pages.length > 1) {
      wx.navigateBack({ delta: 1 })
      return
    }
  },

  loadDetail() {
    if (!this.data.id) {
      this.setData({ loading: false })
      wx.showToast({ title: '记录ID缺失', icon: 'none' })
      return
    }

    request(`/api/service-record/detail?id=${this.data.id}`, 'GET')
      .then((res) => {
        this.setData({
          record: this.formatRecord(res || {}),
          loading: false
        })
      })
      .catch((err) => {
        console.error('loadDetail error', err)
        this.setData({ loading: false })
        wx.showToast({ title: '加载失败', icon: 'none' })
      })
  },

  formatRecord(raw) {
    const completedItems = (raw.completedItems || []).map(code => ({
      code,
      text: this.data.completedItemTextMap[code] || code
    }))

    return {
      ...raw,
      completedItems,
      petStatusText: this.data.petStatusTextMap[raw.petStatus] || '未知状态'
    }
  },

  previewImage(e) {
    const current = e.currentTarget.dataset.url
    const urls = (this.data.record && this.data.record.imageUrls) || []
    if (!current || !urls.length) return

    wx.previewImage({
      current,
      urls
    })
  }
})