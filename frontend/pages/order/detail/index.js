const { request } = require('../../../utils/request')
const { normalizePetSnapshot } = require('../../../utils/pet-display')

Page({
  data: {
    orderId: null,
    loading: true,
    order: null,

    defaultPetImage: 'https://dummyimage.com/200x200/f3f4f6/b3b7c0.png&text=PET',

    statusBarHeight: 20,
    navBarHeight: 44,
    navTotalHeight: 64,

    serviceRecordList: [],
    serviceRecordLoading: false,

    showScheduleDetail: false,

    showPetPopup: false,
    activePet: null
  },

  onLoad(options) {
    const systemInfo = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()
    const statusBarHeight = systemInfo.statusBarHeight || 20
    const navBarHeight = 44

    this.setData({
      statusBarHeight,
      navBarHeight,
      navTotalHeight: statusBarHeight + navBarHeight
    })

    const id = options.id
    if (!id) {
      wx.showToast({
        title: '订单ID不能为空',
        icon: 'none'
      })
      setTimeout(() => {
        wx.navigateBack({ delta: 1 })
      }, 800)
      return
    }

    this.setData({
      orderId: id
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
        delta: 1,
        fail: () => {
          wx.switchTab({
            url: '/pages/order/list/index'
          })
        }
      })
      return
    }

    wx.switchTab({
      url: '/pages/order/list/index'
    })
  },

  loadOrderDetail() {
    const currentUser = wx.getStorageSync('currentUser') || { id: 1 }

    this.setData({
      loading: true,
      showScheduleDetail: false,
      showPetPopup: false,
      activePet: null
    })

    request(`/api/orders/detail?id=${this.data.orderId}&userId=${currentUser.id}`, 'GET')
      .then((res) => {
        const raw = res || {}
        const order = this.formatOrderDetail(raw)

        this.setData({
          order,
          loading: false
        })

        this.loadServiceRecordList()
      })
      .catch((err) => {
        console.error('加载订单详情失败', err)
        this.setData({ loading: false })
        wx.showToast({
          title: '加载订单详情失败',
          icon: 'none'
        })
      })
  },

  formatOrderDetail(raw) {
    const timeSlots = raw.timeSlots || []
    const serviceDates = raw.serviceDates || []
    const pets = raw.pets || []


    const formattedServiceDates = serviceDates.map(item => ({
      ...item,
      serviceDateText: this.formatServiceDate(item.serviceDate),
      scheduleStatusText: this.getScheduleStatusText(item.scheduleStatus),
      timeSlotsText: this.formatTimeSlots(item.timeSlots || []),
      serviceDurationMinutes: item.serviceDurationMinutes || raw.serviceDurationMinutes || 0
    }))

    const formattedPets = (raw.pets || []).map(item =>
      normalizePetSnapshot(item, this.data.defaultPetImage)
    )

    const orderStatusText = this.getOrderStatusText(raw.orderStatus)
    const payStatusText = this.getPayStatusText(raw.payStatus)
    const statusClass = this.getOrderStatusClass(raw.orderStatus)
    const statusHintText = this.getOrderStatusHint(raw.orderStatus)

    const serviceDateSummaryText = this.buildServiceDateSummary(formattedServiceDates)
    const serviceDateDetailCountText = `共${formattedServiceDates.length}次服务`
    const showScheduleToggle = formattedServiceDates.length > 1

    return {
      id: raw.id,
      userId: raw.userId || null,
      orderNo: raw.orderNo || '',
      orderStatus: raw.orderStatus || '',
      orderStatusText,
      statusClass,
      statusHintText,
      payStatus: raw.payStatus || '',
      payStatusText,
      canCancel: this.canCancelOrder(raw.orderStatus),

      serviceContactName: raw.serviceContactName || '',
      serviceContactPhone: raw.serviceContactPhone || '',
      serviceFullAddress: raw.serviceFullAddress || '',

      petCount: raw.petCount || formattedPets.length || 0,
      serviceDateCount: raw.serviceDateCount || formattedServiceDates.length || 0,
      serviceDurationMinutes: raw.serviceDurationMinutes || 0,

      timeSlots,
      timeSlotsText: this.formatTimeSlots(timeSlots),
      serviceDateSummaryText,
      serviceDateDetailCountText,
      showScheduleToggle,

      pets: formattedPets,
      serviceDates: formattedServiceDates,

      suggestedUnitPrice: this.formatMoney(raw.suggestedUnitPrice),
      unitPrice: this.formatMoney(raw.unitPrice),
      totalPrice: this.formatMoney(raw.totalPrice),

      remark: raw.remark || '暂无备注'
    }
  },

  buildServiceDateSummary(serviceDates) {
    if (!serviceDates || !serviceDates.length) return '未安排'
    const texts = serviceDates.map(item => item.serviceDateText)
    if (texts.length <= 2) {
      return texts.join('、')
    }
    return `${texts[0]}、${texts[1]} 等${texts.length}次`
  },

  formatMoney(value) {
    const num = Number(value || 0)
    return num.toFixed(2)
  },

  formatTimeSlots(timeSlots) {
    if (!timeSlots || !timeSlots.length) return '未设置'
    return timeSlots.join('、')
  },

  formatServiceDate(dateStr) {
    if (!dateStr) return ''

    const date = new Date(String(dateStr).replace(/-/g, '/'))
    if (Number.isNaN(date.getTime())) return dateStr

    const weekMap = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const week = weekMap[date.getDay()]

    return `${month}/${day} ${week}`
  },

  getOrderStatusText(status) {
    const map = {
      WAIT_TAKING: '待接单',
      TAKEN: '已接单',
      SERVING: '服务中',
      COMPLETED: '已完成',
      CANCELLED: '已取消'
    }
    return map[status] || '未知状态'
  },

  getOrderStatusClass(status) {
    const map = {
      WAIT_TAKING: 'status-wait-taking',
      TAKEN: 'status-taken',
      SERVING: 'status-serving',
      COMPLETED: 'status-completed',
      CANCELLED: 'status-cancelled'
    }
    return map[status] || 'status-wait-taking'
  },

  getOrderStatusHint(status) {
    const map = {
      WAIT_TAKING: '我们已收到你的预约需求，正在为你安排服务人员',
      TAKEN: '订单已接单，请按预约时间等待服务',
      SERVING: '当前订单正在服务中，请留意服务进展',
      COMPLETED: '本次服务已完成，欢迎再次预约',
      CANCELLED: '订单已取消，如有问题可联系客服'
    }
    return map[status] || ''
  },

  getPayStatusText(status) {
    const map = {
      UNPAID: '未支付',
      PAID: '已支付',
      REFUNDED: '已退款'
    }
    return map[status] || '未知'
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

  canCancelOrder(status) {
    return status === 'WAIT_TAKING'
  },

  toggleScheduleDetail() {
    this.setData({
      showScheduleDetail: !this.data.showScheduleDetail
    })
  },

  loadServiceRecordList() {
    if (!this.data.orderId) return

    this.setData({ serviceRecordLoading: true })

    request(`/api/service-record/listByOrder?orderId=${this.data.orderId}`, 'GET')
      .then((res) => {
        const list = (res || []).map(item => this.formatServiceRecordItem(item))
        this.setData({
          serviceRecordList: list,
          serviceRecordLoading: false
        })
      })
      .catch((err) => {
        console.error('loadServiceRecordList error', err)
        this.setData({
          serviceRecordList: [],
          serviceRecordLoading: false
        })
      })
  },

  formatServiceRecordItem(item) {
    return {
      ...item,
      petStatusText: this.getPetStatusText(item.petStatus),
      submittedAtText: item.submittedAt || '',
      imageCountText: `${item.imageCount || 0}张图片`
    }
  },

  getPetStatusText(status) {
    const map = {
      NORMAL: '状态正常',
      APPETITE_NORMAL: '食欲正常',
      NERVOUS: '情绪紧张',
      ABNORMAL: '有异常'
    }
    return map[status] || '未知状态'
  },

  goServiceRecordDetail(e) {
    const id = e.currentTarget.dataset.id
    if (!id) return

    wx.navigateTo({
      url: `/pages/service-record-detail/index?id=${id}`
    })
  },

  openPetDetail(e) {
    const index = Number(e.currentTarget.dataset.index)
    const pets = (this.data.order && this.data.order.pets) || []
    const activePet = pets[index]

    if (!activePet) return

    this.setData({
      activePet,
      showPetPopup: true
    })
  },

  closePetDetail() {
    this.setData({
      showPetPopup: false,
      activePet: null
    })
  },

  stopPopupBubble() { },

  handleCancelOrder() {
    const currentUser = wx.getStorageSync('currentUser') || { id: 1 }

    if (!this.data.order || !this.data.order.id) {
      wx.showToast({
        title: '订单信息异常',
        icon: 'none'
      })
      return
    }

    wx.showModal({
      title: '确认取消订单',
      content: '取消后当前订单将无法继续安排服务，确定要取消吗？',
      confirmText: '确认取消',
      cancelText: '再想想',
      success: (res) => {
        if (!res.confirm) return

        wx.showLoading({ title: '取消中' })

        request('/api/orders/cancel', 'POST', {
          orderId: this.data.order.id,
          userId: currentUser.id,
          reason: '用户主动取消订单'
        }).then(() => {
          wx.hideLoading()
          wx.showToast({
            title: '取消成功',
            icon: 'success'
          })

          setTimeout(() => {
            this.loadOrderDetail()
          }, 600)
        }).catch((err) => {
          console.error('取消订单失败', err)
          wx.hideLoading()
        })
      }
    })
  },

  handleContactService() {
    wx.showToast({
      title: '这里后面接客服能力',
      icon: 'none'
    })
  },

  handleBookAgain() {
    wx.navigateTo({
      url: '/pages/order/create/index'
    })
  }
})