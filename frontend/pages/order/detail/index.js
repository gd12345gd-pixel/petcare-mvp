const { request } = require('../../../utils/request')
const { normalizePetSnapshot } = require('../../../utils/pet-display')
const { getUserOrderStatusSummary, isInProgressOrderStatus } = require('../../../utils/order-display')

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

  copyOrderNo() {
    const orderNo = this.data.order && this.data.order.orderNo
    if (!orderNo) return

    wx.setClipboardData({
      data: orderNo,
      success: () => {
        wx.showToast({
          title: '订单号已复制',
          icon: 'success'
        })
      }
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
    const serviceDates = raw.serviceDates || []

    const formattedServiceDates = serviceDates.map(item => {
      const recordId = item.recordId || null
      return {
        ...item,
        scheduleId: item.scheduleId || item.id || null,
        recordId,
        hasRecord: !!recordId,
        canViewRecord: !!recordId,
        serviceDateText: this.formatServiceDate(item.serviceDate),
        scheduleStatusText: this.getScheduleStatusText(item.scheduleStatus),
        scheduleHintText: this.getScheduleHintText(item.scheduleStatus),
        timeSlotsText: this.formatTimeSlots(item.timeSlots || []),
        serviceDurationMinutes: item.serviceDurationMinutes || raw.serviceDurationMinutes || 0
      }
    })

    const formattedPets = (raw.pets || []).map(item =>
      normalizePetSnapshot(item, this.data.defaultPetImage)
    )

    const serviceDateSummaryText = this.buildServiceDateSummary(formattedServiceDates)
    const serviceDateDetailCountText = `共${formattedServiceDates.length}次`
    const showScheduleToggle = formattedServiceDates.length > 0
    const todayServiceCard = this.buildTodayServiceCard(formattedServiceDates)
    const doneCount = formattedServiceDates.filter(d => (d.scheduleStatus || '') === 'DONE').length

    return {
      id: raw.id,
      userId: raw.userId || null,
      orderNo: raw.orderNo || '',
      orderStatus: raw.orderStatus || '',
      orderStatusText: getUserOrderStatusSummary({
        orderStatus: raw.orderStatus,
        completedServiceCount: doneCount,
        serviceDateCount: raw.serviceDateCount || formattedServiceDates.length,
        canReschedule: !!raw.canReschedule
      }),
      statusClass: this.getOrderStatusClass(raw.orderStatus),
      statusHintText: this.getOrderStatusHint(raw.orderStatus),
      payStatus: raw.payStatus || '',
      payStatusText: this.getPayStatusText(raw.payStatus),
      canCancel: this.canCancelOrder(raw.orderStatus),
      canReschedule: !!raw.canReschedule,
      canReview: !!raw.canReview,
      reviewed: !!raw.reviewed,
      createdAtText: this.formatDateTime(raw.createdAt),
      takenAtText: raw.takenAt ? this.formatDateTime(raw.takenAt) : '暂未接单',
      hasSitter: !!raw.sitterId,
      sitterName: raw.sitterName || '',
      sitterAvatarText: raw.sitterName ? String(raw.sitterName).slice(0, 1) : '托',
      sitterPhone: raw.sitterPhone || '',

      serviceContactName: raw.serviceContactName || '',
      serviceContactPhone: raw.serviceContactPhone || '',
      serviceFullAddress: raw.serviceFullAddress || '',

      petCount: raw.petCount || formattedPets.length || 0,
      serviceDateCount: raw.serviceDateCount || formattedServiceDates.length || 0,
      serviceDurationMinutes: raw.serviceDurationMinutes || 0,

      serviceDateSummaryText,
      serviceDateDetailCountText,
      showScheduleToggle,
      todayServiceCard,

      pets: formattedPets,
      serviceDates: formattedServiceDates,

      timeSlotsText: this.buildServiceTimeSummary(formattedServiceDates, raw.timeSlots || []),

      suggestedUnitPrice: this.formatMoney(raw.suggestedUnitPrice),
      unitPrice: this.formatMoney(raw.unitPrice),
      totalPrice: this.formatMoney(raw.totalPrice),

      remark: raw.remark || '暂无备注',
      remarkTimeline: this.formatRemarkTimeline(raw.remarkTimeline || []),
      canAppendRemark: !!raw.canAppendRemark
    }
  },

  formatRemarkTimeline(list) {
    return (list || []).map(item => ({
      ...item,
      title: item.remarkType === 'ORIGINAL' ? '原始备注' : `补充 ${this.formatRemarkTime(item.createdAt)}`,
      content: item.content || '',
      imageUrls: item.imageUrls || []
    }))
  },

  formatRemarkTime(value) {
    if (!value) return ''
    const date = new Date(String(value).replace('T', ' ').replace(/-/g, '/'))
    if (Number.isNaN(date.getTime())) return String(value).replace('T', ' ').slice(5, 16)
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hour = String(date.getHours()).padStart(2, '0')
    const minute = String(date.getMinutes()).padStart(2, '0')
    return `${month}/${day} ${hour}:${minute}`
  },

  buildTodayServiceCard(serviceDates) {
    if (!serviceDates || !serviceDates.length) {
      return {
        title: '今日服务',
        desc: '暂无服务安排',
        item: null
      }
    }

    const todayText = this.getTodayDateText()
    const todayItem = serviceDates.find(item => this.getDateKey(item.serviceDate) === todayText)
    if (todayItem) {
      return {
        title: '今日服务',
        desc: todayItem.scheduleHintText,
        item: todayItem
      }
    }

    const nextItem = serviceDates.find(item => item.scheduleStatus !== 'DONE' && item.scheduleStatus !== 'CANCELLED')
    if (nextItem) {
      return {
        title: '今日服务',
        desc: `今日暂无服务，下一次服务：${nextItem.serviceDateText}`,
        item: null
      }
    }

    return {
      title: '今日服务',
      desc: '本次服务已全部完成',
      item: null
    }
  },

  buildServiceDateSummary(serviceDates) {
    if (!serviceDates || !serviceDates.length) return '未安排'
    const texts = serviceDates.map(item => item.serviceDateText)
    if (texts.length === 1) {
      return `${texts[0]} · 1次服务`
    }
    return `${texts[0]} - ${texts[texts.length - 1]} · 共${texts.length}次服务`
  },

  buildServiceTimeSummary(serviceDates, fallbackSlots) {
    const allSlots = serviceDates.map(item => item.timeSlotsText).filter(Boolean)
    if (allSlots.length) {
      const merged = Array.from(new Set(allSlots.join('、').split('、').filter(Boolean)))
      return merged.join('、') || this.formatTimeSlots(fallbackSlots)
    }
    return this.formatTimeSlots(fallbackSlots)
  },

  formatMoney(value) {
    const num = Number(value || 0)
    return num.toFixed(2)
  },

  formatTimeSlots(timeSlots) {
    if (!timeSlots || !timeSlots.length) return '不限'
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

  formatDateTime(value) {
    if (!value) return ''
    const text = String(value).replace('T', ' ').replace(/-/g, '/')
    const date = new Date(text)
    if (Number.isNaN(date.getTime())) {
      return String(value).replace('T', ' ').slice(0, 16)
    }

    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hour = String(date.getHours()).padStart(2, '0')
    const minute = String(date.getMinutes()).padStart(2, '0')
    return `${month}/${day} ${hour}:${minute}`
  },

  getDateKey(dateStr) {
    const date = new Date(String(dateStr).replace(/-/g, '/'))
    if (Number.isNaN(date.getTime())) return ''
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${month}/${day}`
  },

  getTodayDateText() {
    const date = new Date()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${month}/${day}`
  },

  getOrderStatusText(status) {
    const map = {
      WAIT_TAKING: '待接单',
      TAKEN: '已接单',
      PART_SERVING: '服务中',
      SERVING: '服务中',
      PART_COMPLETED: '部分已完成',
      COMPLETED: '已完成',
      CANCELLED: '已取消',
      EXCEPTION: '异常单'
    }
    return map[status] || '未知状态'
  },

  getOrderStatusClass(status) {
    const map = {
      WAIT_TAKING: 'status-wait-taking',
      TAKEN: 'status-taken',
      PART_SERVING: 'status-serving',
      SERVING: 'status-serving',
      PART_COMPLETED: 'status-part-completed',
      COMPLETED: 'status-completed',
      CANCELLED: 'status-cancelled',
      EXCEPTION: 'status-wait-taking'
    }
    return map[status] || 'status-wait-taking'
  },

  getOrderStatusHint(status) {
    const map = {
      WAIT_TAKING: '我们已收到你的预约需求，正在为你安排服务人员',
      TAKEN: '托托师已接单，将按预约日期上门，可在「我的订单-今日服务」查看当天安排',
      PART_SERVING: '当前有上门正在进行或待结束，请留意进度与消息',
      SERVING: '当前有上门正在进行或待结束，请留意进度与消息',
      PART_COMPLETED: '部分日期已完成，其余日期仍待上门',
      COMPLETED: '本次预约的全部上门已完成，欢迎再次预约',
      CANCELLED: '订单已取消，如有问题可联系客服',
      EXCEPTION: '订单状态异常，请联系客服处理'
    }
    if (map[status]) return map[status]
    if (isInProgressOrderStatus(status)) return map.PART_SERVING
    return ''
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
      RECORDED: '待结束',
      DONE: '已完成',
      CANCELLED: '已取消'
    }
    return map[status] || '待服务'
  },

  getScheduleHintText(status) {
    const map = {
      PENDING: '等待服务开始',
      SERVING: '服务进行中',
      RECORDED: '已提交记录，待结束',
      DONE: '本次服务已完成',
      CANCELLED: '本次服务已取消'
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

  stopPopupBubble() {},

  goAddRemark() {
    if (!this.data.order || !this.data.order.id) return
    wx.navigateTo({
      url: `/pages/order/remark-add/index?id=${this.data.order.id}&status=${this.data.order.orderStatus}`
    })
  },

  previewRemarkImage(e) {
    const urls = e.currentTarget.dataset.urls || []
    const current = e.currentTarget.dataset.url
    if (!urls.length || !current) return
    wx.previewImage({ current, urls })
  },

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

  handleRescheduleOrder() {
    if (!this.data.order || !this.data.order.id) return

    wx.navigateTo({
      url: `/pages/order/create/index?mode=reschedule&id=${this.data.order.id}`
    })
  },

  handleReviewOrder() {
    if (!this.data.order || !this.data.order.id) return
    wx.navigateTo({
      url: `/pages/order/review/index?id=${this.data.order.id}`
    })
  },

  handleBookAgain() {
    wx.navigateTo({
      url: '/pages/order/create/index'
    })
  }
})
