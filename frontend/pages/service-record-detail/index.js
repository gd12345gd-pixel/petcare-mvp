const { request } = require('../../utils/request')

const TYPE_MAP = {
  FEEDING: '喂食',
  CLEANING: '清理猫砂',
  PLAY: '互动玩耍',
  OTHER: '其他'
}

Page({
  data: {
    orderId: null,
    orderNo: '',
    serviceDate: '',
    timeSlot: '',
    records: []
  },

  onLoad(options) {
    const orderId = options.orderId ? Number(options.orderId) : null
    this.setData({
      orderId,
      orderNo: options.orderNo || '',
      serviceDate: options.serviceDate || '',
      timeSlot: options.timeSlot || ''
    })

    if (orderId) {
      this.loadRecords()
    }
  },

  onShow() {
    if (this.data.orderId) {
      this.loadRecords()
    }
  },

  loadRecords() {
    const { orderId } = this.data
    wx.showLoading({ title: '加载中' })

    request(`/api/service-records?orderId=${orderId}`, 'GET')
      .then((data) => {
        const records = (data || []).map(item => {
          return {
            ...item,
            typeText: TYPE_MAP[item.type] || item.type
          }
        })
        this.setData({ records })
        wx.hideLoading()
      })
      .catch(() => {
        wx.hideLoading()
      })
  },

  previewImage(e) {
    const url = e.currentTarget.dataset.url
    if (!url) return

    const urls = this.data.records
      .map(item => item.imageUrl)
      .filter(Boolean)

    wx.previewImage({
      current: url,
      urls
    })
  },

  goUpload() {
    const { orderId, orderNo, serviceDate, timeSlot } = this.data
    wx.navigateTo({
      url: `/pages/service-record-upload/index?orderId=${orderId}&orderNo=${orderNo}&serviceDate=${serviceDate}&timeSlot=${timeSlot}`
    })
  }
})