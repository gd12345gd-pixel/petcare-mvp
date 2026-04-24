const { request } = require('../../utils/request')

Page({
  data: {
    statusBarHeight: 20,
    navBarHeight: 44,
    navTotalHeight: 64,

    id: null,
    loading: true,
    detail: null,

    serviceItemTextMap: {
      FEED: '已喂食',
      WATER: '已换水',
      CLEAN: '已清理排泄区',
      WALK_PLAY: '已遛狗/陪玩',
      CHECK: '已观察宠物状态',
      OTHER: '其他服务'
    },

    petObservationTextMap: {
      NORMAL: '状态正常',
      APPETITE_NORMAL: '食欲正常',
      WATER_NORMAL: '饮水正常',
      EMOTION_STABLE: '情绪稳定',
      EXCRETION_NORMAL: '排泄正常',
      ENERGY_GOOD: '精神不错',
      RESTED: '已休息',
      ABNORMAL: '有异常情况'
    }
  },

  onLoad(options) {
    const systemInfo = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()
    const statusBarHeight = systemInfo.statusBarHeight || 20
    const navBarHeight = 44
    const id = options.id

    this.setData({
      statusBarHeight,
      navBarHeight,
      navTotalHeight: statusBarHeight + navBarHeight,
      id: id || null
    })

    if (!id) {
      wx.showToast({
        title: '缺少记录ID',
        icon: 'none'
      })
      setTimeout(() => {
        this.navigateBack()
      }, 800)
      return
    }

    this.loadDetail()
  },

  navigateBack() {
    const pages = getCurrentPages()
    if (pages.length > 1) {
      wx.navigateBack({ delta: 1 })
      return
    }
  },

  async loadDetail() {
    this.setData({ loading: true })

    try {
      const res = await request(`/api/service-record/detail?id=${this.data.id}`, 'GET')
      const raw = res || {}

      this.setData({
        detail: this.formatDetail(raw),
        loading: false
      })
    } catch (err) {
      console.error('loadDetail error', err)
      this.setData({ loading: false })
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      })
    }
  },

  formatDetail(raw) {
    const serviceItems = (raw.serviceItems || []).map(code => ({
      code,
      text: this.data.serviceItemTextMap[code] || code
    }))

    const petObservations = (raw.petObservations || []).map(code => ({
      code,
      text: this.data.petObservationTextMap[code] || code,
      isAbnormal: code === 'ABNORMAL'
    }))

    const images = (raw.images || []).map(url => ({ url }))
    const videos = (raw.videos || []).map(url => ({ url }))

    return {
      id: raw.id,
      orderId: raw.orderId,
      scheduleId: raw.scheduleId,
      sitterId: raw.sitterId,
      remark: raw.remark || '暂无备注',
      abnormalDesc: raw.abnormalDesc || '',
      submittedAtText: this.formatDateTime(raw.submittedAt),
      serviceItems,
      petObservations,
      images,
      videos,
      hasImages: images.length > 0,
      hasVideos: videos.length > 0,
      hasAbnormal: !!raw.abnormalDesc
    }
  },

  formatDateTime(value) {
    if (!value) return '--'
    const text = String(value).replace('T', ' ')
    return text.length >= 16 ? text.slice(0, 16) : text
  },

  previewImage(e) {
    const index = Number(e.currentTarget.dataset.index)
    const detail = this.data.detail
    if (!detail || !detail.images || !detail.images.length) return

    const urls = detail.images.map(item => item.url)
    wx.previewImage({
      current: urls[index],
      urls
    })
  },

  handleContactService() {
    wx.showToast({
      title: '这里后面接客服能力',
      icon: 'none'
    })
  }
})