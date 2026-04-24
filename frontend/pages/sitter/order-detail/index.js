const { request } = require('../../../utils/request')
const { normalizePetSnapshot } = require('../../../utils/pet-display')

Page({
  data: {
    statusBarHeight: 20,
    navBarHeight: 44,
    navTotalHeight: 64,

    orderId: null,
    mode: 'AVAILABLE',
    loading: true,
    order: null,
    defaultPetImage: 'https://dummyimage.com/200x200/f3f4f6/b3b7c0.png&text=PET',

    serviceRecordList: [],
    serviceRecordLoading: false,

    showAllSchedules: false,

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
      navTotalHeight: statusBarHeight + navBarHeight,
      orderId: options.id || null,
      mode: options.mode || 'AVAILABLE'
    })

    this.loadPageData()
  },

  onShow() {
    if (this.data.orderId) {
      this.loadPageData()
    }
  },

  navigateBack() {
    const pages = getCurrentPages()
    if (pages.length > 1) {
      wx.navigateBack({ delta: 1 })
      return
    }
    wx.switchTab({ url: '/pages/sitter/index' })
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

  loadPageData() {
    this.setData({
      loading: true,
      showPetPopup: false,
      activePet: null
    })

    this.loadOrderDetail()
      .then(() => this.loadServiceRecordList())
      .finally(() => {
        this.setData({ loading: false })
      })
  },

  loadOrderDetail() {
    const currentUser = wx.getStorageSync('currentUser') || { id: 1 }

    return request(`/api/sitter/orders/detail?id=${this.data.orderId}&sitterId=${currentUser.id}`, 'GET')
      .then((res) => {
        this.rawOrder = res || {}
      })
      .catch((err) => {
        console.error('loadOrderDetail error', err)
        wx.showToast({ title: '加载失败', icon: 'none' })
        throw err
      })
  },

  loadServiceRecordList() {
    if (!this.data.orderId) {
      this.applyFormattedOrder([])
      return Promise.resolve()
    }

    this.setData({ serviceRecordLoading: true })

    return request(`/api/service-record/listByOrder?orderId=${this.data.orderId}`, 'GET')
      .then((res) => {
        const list = res || []
        this.setData({
          serviceRecordList: list,
          serviceRecordLoading: false
        })
        this.applyFormattedOrder(list)
      })
      .catch((err) => {
        console.error('loadServiceRecordList error', err)
        this.setData({
          serviceRecordList: [],
          serviceRecordLoading: false
        })
        this.applyFormattedOrder([])
      })
  },

  applyFormattedOrder(recordList) {
    const order = this.formatDetail(this.rawOrder || {}, recordList || [])
    this.setData({ order })
  },

  formatDetail(raw, recordList) {
    const canTake = raw.orderStatus === 'WAIT_TAKING'
    const canOperateSchedules = !canTake && raw.orderStatus !== 'CANCELLED' && raw.orderStatus !== 'COMPLETED'

    const pets = (raw.pets || []).map(item =>
      normalizePetSnapshot(item, this.data.defaultPetImage)
    )

    const recordMap = {}
    ;(recordList || []).forEach(item => {
      if (item && item.scheduleId) {
        recordMap[String(item.scheduleId)] = item
      }
    })

    const serviceDates = (raw.serviceDates || []).map(item => {
      const scheduleId = item.scheduleId || item.id || null
      const scheduleStatus = item.scheduleStatus || 'PENDING'
      const matchedRecord = scheduleId ? recordMap[String(scheduleId)] : null
      const recordId = matchedRecord ? matchedRecord.id : (item.recordId || null)
      const displayState = this.resolveScheduleDisplayState(item, scheduleStatus, raw.orderStatus)

      return {
        ...item,
        scheduleId,
        recordId,
        hasRecord: !!recordId,
        serviceDateText: this.formatDateFull(item.serviceDate),
        timeSlotsText: this.formatTimeSlots(item.timeSlots || []),
        serviceDurationMinutes: item.serviceDurationMinutes || raw.serviceDurationMinutes || 0,
        scheduleStatus,
        displayState,
        scheduleStatusText: this.getScheduleStatusText(scheduleStatus, displayState),
        scheduleHintText: this.getScheduleHintText(scheduleStatus, displayState),
        canStartSchedule: canOperateSchedules && displayState === 'TODAY_PENDING' && scheduleStatus === 'PENDING',
        canWriteRecord: canOperateSchedules && scheduleStatus === 'SERVING',
        canFinishSchedule: canOperateSchedules && scheduleStatus === 'RECORDED',
        canViewRecord: !!recordId
      }
    })

    const header = this.buildHeader(raw.orderStatus, serviceDates)
    const todayTask = this.buildTodayTask(canTake, serviceDates)
    const serviceDateSummaryText = this.buildServiceDateSummary(serviceDates)

    return {
      id: raw.id,
      orderNo: raw.orderNo || '',
      orderStatus: raw.orderStatus || '',
      orderStatusText: this.getOrderStatusText(raw.orderStatus),
      statusClass: this.getOrderStatusClass(raw.orderStatus),
      headerTitle: header.title,
      headerDesc: header.desc,

      serviceContactName: raw.serviceContactName || '',
      serviceContactPhone: raw.serviceContactPhone || '',
      serviceFullAddress: raw.serviceFullAddress || '',

      serviceDateCount: raw.serviceDateCount || serviceDates.length || 0,
      scheduleCount: serviceDates.length,
      serviceDurationMinutes: raw.serviceDurationMinutes || 0,

      pets,
      serviceDates,
      todayTask,

      serviceDateSummaryText,
      serviceTimeSummaryText: this.buildServiceTimeSummary(serviceDates, raw.timeSlots || []),
      serviceDurationSummaryText: `${raw.serviceDurationMinutes || 0}分钟/次`,
      progressCountText: `共${serviceDates.length}次`,

      totalPriceText: this.formatMoney(raw.totalPrice || 0),
      unitPriceText: this.formatMoney(raw.unitPrice || 0),
      remark: raw.remark || '暂无备注',

      canTake,
      showScheduleToggle: serviceDates.length > 0,
      scheduleToggleText: this.data.showAllSchedules ? '收起日期明细' : '查看全部日期明细'
    }
  },

  buildHeader(orderStatus, serviceDates) {
    const todayDone = serviceDates.find(item => item.scheduleStatus === 'DONE' && this.getDateKey(item.serviceDate) === this.getTodayDateText())
    const nextPending = serviceDates.find(item => item.scheduleStatus === 'PENDING')
    const servingItem = serviceDates.find(item => item.scheduleStatus === 'SERVING')
    const recordedItem = serviceDates.find(item => item.scheduleStatus === 'RECORDED')

    if (orderStatus === 'WAIT_TAKING') {
      return {
        title: '待接单',
        desc: '确认接单后可按日期逐次完成上门服务'
      }
    }

    if (orderStatus === 'TAKEN') {
      return {
        title: '已接单',
        desc: nextPending ? `下一次服务：${nextPending.serviceDateText}` : '请按预约日期完成每次服务'
      }
    }

    if (orderStatus === 'PART_SERVING' || orderStatus === 'SERVING') {
      if (servingItem) {
        return {
          title: '服务进行中',
          desc: `当前服务：${servingItem.serviceDateText}`
        }
      }
      if (recordedItem) {
        return {
          title: '待结束本次服务',
          desc: `已提交记录：${recordedItem.serviceDateText}`
        }
      }
    }

    if (orderStatus === 'PART_COMPLETED') {
      return {
        title: '部分已完成',
        desc: nextPending ? `下一次服务：${nextPending.serviceDateText}` : '还有未完成服务'
      }
    }

    if (orderStatus === 'COMPLETED') {
      return {
        title: '订单已完成',
        desc: '本次预约服务均已完成'
      }
    }

    if (orderStatus === 'CANCELLED') {
      return {
        title: '订单已取消',
        desc: '该订单已结束，不可继续操作'
      }
    }

    return {
      title: this.getOrderStatusText(orderStatus),
      desc: ''
    }
  },

  buildTodayTask(canTake, serviceDates) {
    if (canTake) return null

    const todayPending = serviceDates.find(item => item.displayState === 'TODAY_PENDING')
    const todayServing = serviceDates.find(item => item.displayState === 'TODAY_SERVING')
    const todayRecorded = serviceDates.find(item => item.displayState === 'TODAY_RECORDED')
    const nextPending = serviceDates.find(item => item.scheduleStatus === 'PENDING')

    if (todayServing) {
      return {
        title: '今日待服务',
        desc: '请先填写服务记录，再结束本次服务',
        item: todayServing
      }
    }

    if (todayRecorded) {
      return {
        title: '今日待服务',
        desc: '已提交记录，请确认后结束本次服务',
        item: todayRecorded
      }
    }

    if (todayPending) {
      return {
        title: '今日待服务',
        desc: '请按预约时间开始本次服务',
        item: todayPending
      }
    }

    if (todayDone) {
      return {
        title: '今日服务',
        desc: '今日服务已完成',
        item: todayDone
      }
    }

    if (nextPending) {
      return {
        title: '今日待服务',
        desc: `今日暂无任务，下一次服务：${nextPending.serviceDateText}`,
        item: null
      }
    }

    return {
      title: '今日待服务',
      desc: '当前没有待处理服务',
      item: null
    }
  },

  buildServiceDateSummary(serviceDates) {
    if (!serviceDates || !serviceDates.length) return '未安排'
    const first = serviceDates[0].serviceDateText
    const last = serviceDates[serviceDates.length - 1].serviceDateText
    if (serviceDates.length === 1) {
      return `${first} · 1次服务`
    }
    return `${first} - ${last} · 共${serviceDates.length}次服务`
  },

  buildServiceTimeSummary(serviceDates, fallbackSlots) {
    const allSlots = serviceDates.map(item => item.timeSlotsText).filter(Boolean)
    if (allSlots.length) {
      const merged = Array.from(new Set(allSlots.join('、').split('、').filter(Boolean)))
      return merged.join('、') || this.formatTimeSlots(fallbackSlots)
    }
    return this.formatTimeSlots(fallbackSlots)
  },

  resolveScheduleDisplayState(item, scheduleStatus, orderStatus) {
    if (scheduleStatus === 'SERVING') return 'TODAY_SERVING'
    if (scheduleStatus === 'RECORDED') return 'TODAY_RECORDED'
    if (scheduleStatus === 'DONE') return 'DONE'

    const serviceDate = new Date(String(item.serviceDate).replace(/-/g, '/'))
    if (Number.isNaN(serviceDate.getTime())) return 'LOCKED'

    if (orderStatus === 'WAIT_TAKING') return 'READONLY'

    const now = new Date()
    const todayText = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    const currentText = `${serviceDate.getFullYear()}-${String(serviceDate.getMonth() + 1).padStart(2, '0')}-${String(serviceDate.getDate()).padStart(2, '0')}`

    if (currentText < todayText) return 'LOCKED'
    if (currentText > todayText) return 'LOCKED'
    return 'TODAY_PENDING'
  },

  getOrderStatusText(status) {
    const map = {
      WAIT_TAKING: '待接单',
      TAKEN: '已接单',
      PART_SERVING: '服务中',
      SERVING: '服务中',
      PART_COMPLETED: '部分已完成',
      COMPLETED: '已完成',
      CANCELLED: '已取消'
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
      CANCELLED: 'status-cancelled'
    }
    return map[status] || 'status-wait-taking'
  },

  getScheduleStatusText(status, displayState) {
    if (displayState === 'LOCKED') return '未开始'
    const map = {
      PENDING: '待开始',
      SERVING: '服务中',
      RECORDED: '待结束',
      DONE: '已完成',
      CANCELLED: '已取消'
    }
    return map[status] || '待服务'
  },

  getScheduleHintText(status, displayState) {
    if (displayState === 'LOCKED') return '未到服务日'
    const map = {
      PENDING: '待开始服务',
      SERVING: '服务进行中',
      RECORDED: '已提交记录，可结束服务',
      DONE: '本次服务已完成',
      CANCELLED: '本次服务已取消'
    }
    return map[status] || '待服务'
  },

  formatMoney(value) {
    return Number(value || 0).toFixed(2)
  },

  formatTimeSlots(list) {
    if (!list || !list.length) return '不限'
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

  toggleScheduleExpand() {
    this.setData({
      showAllSchedules: !this.data.showAllSchedules
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

  getCurrentLocation() {
    return new Promise((resolve, reject) => {
      wx.getLocation({
        type: 'gcj02',
        success: (res) => {
          resolve({
            latitude: res.latitude,
            longitude: res.longitude
          })
        },
        fail: (err) => reject(err)
      })
    })
  },

  handleTakeOrder() {
    const currentUser = wx.getStorageSync('currentUser') || { id: 1 }

    wx.showModal({
      title: '确认接单',
      content: '确认后该订单将归你处理，是否继续？',
      success: (res) => {
        if (!res.confirm) return

        wx.showLoading({ title: '接单中' })
        request('/api/sitter/orders/take', 'POST', {
          orderId: this.data.orderId,
          sitterId: currentUser.id
        }).then(() => {
          wx.hideLoading()
          wx.showToast({ title: '接单成功', icon: 'success' })
          setTimeout(() => this.loadPageData(), 500)
        }).catch(() => {
          wx.hideLoading()
        })
      }
    })
  },

  handleStartSchedule(e) {
    const scheduleId = e.currentTarget.dataset.scheduleId
    const currentUser = wx.getStorageSync('currentUser') || { id: 1 }
    if (!scheduleId) return

    wx.showModal({
      title: '开始本次服务',
      content: '请确认你已到达服务地址附近，开始后将记录开始时间和当前位置。',
      success: (res) => {
        if (!res.confirm) return

        wx.showLoading({ title: '定位中' })
        this.getCurrentLocation()
          .then((location) => {
            return request('/api/sitter/orders/start-schedule', 'POST', {
              orderId: this.data.orderId,
              scheduleId,
              sitterId: currentUser.id,
              latitude: location.latitude,
              longitude: location.longitude
            })
          })
          .then(() => {
            wx.hideLoading()
            wx.redirectTo({
              url: `/pages/service-record-upload/index?orderId=${this.data.orderId}&scheduleId=${scheduleId}`
            })
          })
          .catch((err) => {
            console.error('handleStartSchedule error', err)
            wx.hideLoading()
          })
      }
    })
  },

  goWriteServiceRecord(e) {
    const scheduleId = e.currentTarget.dataset.scheduleId
    if (!scheduleId) return

    wx.navigateTo({
      url: `/pages/service-record-upload/index?orderId=${this.data.orderId}&scheduleId=${scheduleId}`
    })
  },

  handleFinishSchedule(e) {
    const scheduleId = e.currentTarget.dataset.scheduleId
    const currentUser = wx.getStorageSync('currentUser') || { id: 1 }
    if (!scheduleId) return

    wx.showModal({
      title: '结束本次服务',
      content: '结束后将记录结束时间和当前位置；若未提交服务记录，将无法结束本次服务。',
      success: (res) => {
        if (!res.confirm) return

        wx.showLoading({ title: '定位中' })
        this.getCurrentLocation()
          .then((location) => {
            return request('/api/sitter/orders/finish-schedule', 'POST', {
              orderId: this.data.orderId,
              scheduleId,
              sitterId: currentUser.id,
              latitude: location.latitude,
              longitude: location.longitude
            })
          })
          .then(() => {
            wx.hideLoading()
            wx.showToast({ title: '本次服务已结束', icon: 'success' })
            setTimeout(() => this.loadPageData(), 500)
          })
          .catch((err) => {
            console.error('handleFinishSchedule error', err)
            wx.hideLoading()
          })
      }
    })
  },

  handleViewRecord(e) {
    const recordId = e.currentTarget.dataset.recordId
    if (!recordId) {
      wx.showToast({ title: '暂未找到服务记录', icon: 'none' })
      return
    }

    wx.navigateTo({
      url: `/pages/service-record-detail/index?id=${recordId}`
    })
  }
})
