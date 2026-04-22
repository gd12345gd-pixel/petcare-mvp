const {
  request
} = require('../../../utils/request')

Page({
  data: {
    statusBarHeight: 20,
    navBarHeight: 44,
    navTotalHeight: 64,

    orderId: null,
    mode: 'AVAILABLE',
    loading: true,
    order: null,
    defaultPetImage: 'https://dummyimage.com/200x200/f3f4f6/b3b7c0.png&text=PET'
  },

  onLoad(options) {
    const systemInfo = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()
    const statusBarHeight = systemInfo.statusBarHeight || 20
    const navBarHeight = 44

    this.setData({
      statusBarHeight,
      navBarHeight,
      navTotalHeight: statusBarHeight + navBarHeight,
      orderId: options.id || null,
      mode: options.mode || 'AVAILABLE'
    })

    this.loadOrderDetail()
  },

  onShow() {
    if (this.data.orderId) {
      this.loadOrderDetail()
    }
  },

  navigateBack() {
    const pages = getCurrentPages()
    if (pages.length > 1) {
      wx.navigateBack({
        delta: 1
      })
      return
    }
    wx.switchTab({
      url: '/pages/sitter/index'
    })
  },

  loadOrderDetail() {
    const currentUser = wx.getStorageSync('currentUser') || {
      id: 1
    }
    this.setData({
      loading: true
    })

    request(`/api/sitter/orders/detail?id=${this.data.orderId}&sitterId=${currentUser.id}`, 'GET')
      .then((res) => {
        this.setData({
          order: this.formatDetail(res || {}),
          loading: false
        })
      })
      .catch((err) => {
        console.error('loadOrderDetail error', err)
        this.setData({
          loading: false
        })
        wx.showToast({
          title: '加载失败',
          icon: 'none'
        })
      })
  },

  formatDetail(raw) {
    const pets = (raw.pets || []).map(item => ({
      ...item,
      petImageUrl: item.petImageUrl || this.data.defaultPetImage
    }))

    const serviceDates = raw.serviceDates || []

    return {
      ...raw,
      orderStatusText: raw.orderStatus === 'WAIT_TAKING' ? '待接单' : this.getOrderStatusText(raw.orderStatus),
      totalPriceText: this.formatMoney(raw.totalPrice || 0),
      unitPriceText: this.formatMoney(raw.unitPrice || 0),
      pets,
      serviceDates: serviceDates.map(item => ({
        ...item,
        serviceDateText: this.formatDateFull(item.serviceDate),
        timeSlotsText: this.formatTimeSlots(item.timeSlots || []),
        scheduleStatusText: this.getScheduleStatusText(item.scheduleStatus),
        serviceDurationMinutes: item.serviceDurationMinutes || raw.serviceDurationMinutes || 0
      })),
      timeSlotsText: this.formatTimeSlots(raw.timeSlots || []),
      canTake: raw.orderStatus === 'WAIT_TAKING',
      canStart: raw.orderStatus === 'TAKEN',
      canComplete: raw.orderStatus === 'SERVING'
    }
  },

  formatMoney(value) {
    return Number(value || 0).toFixed(2)
  },

  formatTimeSlots(list) {
    if (!list || !list.length) return '时间待确认'
    return list.join('、')
  },

  formatDateFull(dateStr) {
    if (!dateStr) return '--/-- --'
    const date = new Date(String(dateStr).replace(/-/g, '/'))
    if (Number.isNaN(date.getTime())) return '--/-- --'
    const weekMap = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${month}/${day} ${weekMap[date.getDay()]}`
  },

  getOrderStatusText(status) {
    const map = {
      TAKEN: '已接单',
      SERVING: '服务中',
      COMPLETED: '已完成',
      CANCELLED: '已取消'
    }
    return map[status] || '未知状态'
  },

  getScheduleStatusText(status) {
    const map = {
      PENDING: '待服务',
      SERVING: '服务中',
      DONE: '已完成',
      CANCELLED: '已取消'
    }
    return map[status] || '待服务'
  },

  handleTakeOrder() {
    const currentUser = wx.getStorageSync('currentUser') || {
      id: 1
    }
    wx.showModal({
      title: '确认接单',
      content: '确认后该订单将归你处理，是否继续？',
      success: (res) => {
        if (!res.confirm) return

        wx.showLoading({
          title: '接单中'
        })
        request('/api/sitter/orders/take', 'POST', {
          orderId: this.data.orderId,
          sitterId: currentUser.id
        }).then(() => {
          wx.hideLoading()
          wx.showToast({
            title: '接单成功',
            icon: 'success'
          })
          setTimeout(() => this.loadOrderDetail(), 500)
        }).catch(() => {
          wx.hideLoading()
        })
      }
    })
  },

  handleStartService() {
    const currentUser = wx.getStorageSync('currentUser') || {
      id: 1
    }
    wx.showLoading({
      title: '处理中'
    })
    request('/api/sitter/orders/start-service', 'POST', {
      orderId: this.data.orderId,
      sitterId: currentUser.id
    }).then(() => {
      wx.hideLoading()
      wx.redirectTo({
        url: `/pages/service-record-upload/index?orderId=${this.data.orderId}`
      })
    }).catch(() => {
      wx.hideLoading()
    })
  },

  handleCompleteService() {
    const currentUser = wx.getStorageSync('currentUser') || {
      id: 1
    }
    wx.showModal({
      title: '确认完成服务',
      content: '确认后订单将进入已完成状态。',
      success: (res) => {
        if (!res.confirm) return

        wx.showLoading({
          title: '处理中'
        })
        request('/api/sitter/orders/complete-service', 'POST', {
          orderId: this.data.orderId,
          sitterId: currentUser.id
        }).then(() => {
          wx.hideLoading()
          wx.showToast({
            title: '服务已完成',
            icon: 'success'
          })
          setTimeout(() => this.loadOrderDetail(), 500)
        }).catch(() => {
          wx.hideLoading()
        })
      }
    })
  }
})