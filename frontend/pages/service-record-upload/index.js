const { request } = require('../../utils/request')

Page({
  data: {
    statusBarHeight: 20,
    navBarHeight: 44,
    navTotalHeight: 64,

    orderId: null,
    scheduleId: null,
    loading: true,
    submitting: false,

    order: null,

    completedOptions: [
      { value: 'FED', label: '已喂食', checked: false },
      { value: 'WATER_CHANGED', label: '已换水', checked: false },
      { value: 'CLEANED', label: '已清理', checked: false },
      { value: 'PLAYED', label: '已陪玩', checked: false },
      { value: 'LITTER_CHANGED', label: '已补充猫砂', checked: false },
      { value: 'CHECKED_STATUS', label: '已检查状态', checked: false }
    ],

    petStatusOptions: [
      { value: 'NORMAL', label: '状态正常', checked: true },
      { value: 'APPETITE_NORMAL', label: '食欲正常', checked: false },
      { value: 'NERVOUS', label: '情绪紧张', checked: false },
      { value: 'ABNORMAL', label: '有异常', checked: false }
    ],

    petStatus: 'NORMAL',
    remark: '',
    imageUrls: []
  },

  onLoad(options) {
    const systemInfo = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()
    const statusBarHeight = systemInfo.statusBarHeight || 20
    const navBarHeight = 44

    this.setData({
      statusBarHeight,
      navBarHeight,
      navTotalHeight: statusBarHeight + navBarHeight,
      orderId: options.orderId || null,
      scheduleId: options.scheduleId || null
    })

    this.loadOrderDetail()
  },

  navigateBack() {
    const pages = getCurrentPages()
    if (pages.length > 1) {
      wx.navigateBack({ delta: 1 })
      return
    }
    wx.switchTab({ url: '/pages/sitter/index' })
  },

  loadOrderDetail() {
    const currentUser = wx.getStorageSync('currentUser') || { id: 1 }

    if (!this.data.orderId) {
      this.setData({ loading: false })
      wx.showToast({ title: '订单参数缺失', icon: 'none' })
      return
    }

    request(`/api/sitter/orders/detail?id=${this.data.orderId}&sitterId=${currentUser.id}`, 'GET')
      .then((res) => {
        this.setData({
          order: this.formatOrder(res || {}),
          loading: false
        })
      })
      .catch((err) => {
        console.error('loadOrderDetail error', err)
        this.setData({ loading: false })
        wx.showToast({ title: '加载失败', icon: 'none' })
      })
  },

  formatOrder(raw) {
    const pets = raw.pets || []
    const serviceDates = raw.serviceDates || []

    let currentSchedule = null
    if (this.data.scheduleId) {
      currentSchedule = serviceDates.find(item => String(item.scheduleId || item.id) === String(this.data.scheduleId))
    }
    if (!currentSchedule && serviceDates.length) {
      currentSchedule = serviceDates[0]
    }

    return {
      ...raw,
      pets,
      currentSchedule,
      scheduleDateText: currentSchedule ? this.formatDateFull(currentSchedule.serviceDate) : '--/-- --',
      scheduleTimeText: currentSchedule ? this.formatTimeSlots(currentSchedule.timeSlots || []) : (this.formatTimeSlots(raw.timeSlots || [])),
      scheduleDurationText: `${(currentSchedule && currentSchedule.serviceDurationMinutes) || raw.serviceDurationMinutes || 0}分钟/次`,
      fullAddress: raw.serviceFullAddress || ''
    }
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

  formatTimeSlots(list) {
    if (!list || !list.length) return '时间待确认'
    return list.join('、')
  },

  toggleCompletedItem(e) {
    const value = e.currentTarget.dataset.value
    const completedOptions = this.data.completedOptions.map(item => {
      if (item.value === value) {
        return { ...item, checked: !item.checked }
      }
      return item
    })
    this.setData({ completedOptions })
  },

  choosePetStatus(e) {
    const value = e.currentTarget.dataset.value
    const petStatusOptions = this.data.petStatusOptions.map(item => ({
      ...item,
      checked: item.value === value
    }))

    this.setData({
      petStatus: value,
      petStatusOptions
    })
  },

  onRemarkInput(e) {
    this.setData({
      remark: e.detail.value
    })
  },

  chooseImages() {
    const remainCount = 6 - this.data.imageUrls.length
    if (remainCount <= 0) {
      wx.showToast({ title: '最多上传6张图片', icon: 'none' })
      return
    }

    wx.chooseMedia({
      count: remainCount,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFiles = res.tempFiles || []
        const tempUrls = tempFiles.map(item => item.tempFilePath)
        this.setData({
          imageUrls: [...this.data.imageUrls, ...tempUrls].slice(0, 6)
        })
      }
    })
  },

  previewImage(e) {
    const current = e.currentTarget.dataset.url
    if (!current) return
    wx.previewImage({
      current,
      urls: this.data.imageUrls
    })
  },

  removeImage(e) {
    const index = Number(e.currentTarget.dataset.index)
    const imageUrls = [...this.data.imageUrls]
    imageUrls.splice(index, 1)
    this.setData({ imageUrls })
  },

  getCheckedCompletedItems() {
    return this.data.completedOptions.filter(item => item.checked).map(item => item.value)
  },

  validateForm() {
    if (!this.getCheckedCompletedItems().length) {
      wx.showToast({ title: '请选择完成事项', icon: 'none' })
      return false
    }
    return true
  },

  submitRecord() {
    if (!this.validateForm()) return
    if (this.data.submitting) return

    const currentUser = wx.getStorageSync('currentUser') || { id: 1 }
    const order = this.data.order || {}
    const completedItems = this.getCheckedCompletedItems()

    this.setData({ submitting: true })
    wx.showLoading({ title: '提交中' })

    const nowText = this.formatNow()

    request('/api/service-record/create', 'POST', {
      orderId: Number(this.data.orderId),
      scheduleId: this.data.scheduleId ? Number(this.data.scheduleId) : (order.currentSchedule ? (order.currentSchedule.scheduleId || order.currentSchedule.id) : null),
      sitterId: currentUser.id,
      userId: order.userId,
      petStatus: this.data.petStatus,
      completedItems,
      remark: this.data.remark,
      arrivedAt: nowText,
      imageUrls: this.data.imageUrls
    }).then((recordId) => {
      wx.hideLoading()
      wx.redirectTo({
        url: `/pages/service-record-success/index?recordId=${recordId}&orderId=${this.data.orderId}`
      })
    }).catch((err) => {
      console.error('submitRecord error', err)
      wx.hideLoading()
    }).finally(() => {
      this.setData({ submitting: false })
    })
  },

  formatNow() {
    const date = new Date()
    const Y = date.getFullYear()
    const M = String(date.getMonth() + 1).padStart(2, '0')
    const D = String(date.getDate()).padStart(2, '0')
    const h = String(date.getHours()).padStart(2, '0')
    const m = String(date.getMinutes()).padStart(2, '0')
    const s = String(date.getSeconds()).padStart(2, '0')
    return `${Y}-${M}-${D} ${h}:${m}:${s}`
  }
})