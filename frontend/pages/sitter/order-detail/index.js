const { request } = require('../../../utils/request')

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
    serviceRecordLoading: false
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

  loadPageData() {
    this.setData({ loading: true })

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
    const pets = (raw.pets || []).map(item => ({
      ...item,
      petImageUrl: item.petImageUrl || this.data.defaultPetImage
    }))

    const canTake = raw.orderStatus === 'WAIT_TAKING'
    const todayStr = this.getTodayDateString()
    const hasServingSchedule = (raw.serviceDates || []).some(item => item.scheduleStatus === 'SERVING')

    const recordMap = {}
    ;(recordList || []).forEach(item => {
      if (item && item.scheduleId) {
        recordMap[String(item.scheduleId)] = item
      }
    })

    const serviceDates = (raw.serviceDates || []).map(item => {
      const scheduleId = item.scheduleId || item.id || null
      const rawStatus = item.scheduleStatus || 'PENDING'
      const matchedRecord = scheduleId ? recordMap[String(scheduleId)] : null

      const serviceDateRaw = item.serviceDate || ''
      const isToday = serviceDateRaw === todayStr
      const isPast = this.isPastDate(serviceDateRaw)
      const displayStatus = this.buildDisplayScheduleStatus(rawStatus, isToday, isPast)

      const canStartSchedule =
        !canTake &&
        rawStatus === 'PENDING' &&
        isToday &&
        !hasServingSchedule

      const canWriteRecord =
        !canTake &&
        rawStatus === 'SERVING'

      const canFinishSchedule =
        !canTake &&
        rawStatus === 'RECORDED'

      const canViewRecord = !!matchedRecord

      return {
        ...item,
        scheduleId,
        recordId: matchedRecord ? matchedRecord.id : null,
        hasRecord: !!matchedRecord,
        isToday,
        isPast,
        serviceDateText: this.formatDateFull(serviceDateRaw),
        serviceDateShortText: this.formatDateShort(serviceDateRaw),
        timeSlotsText: this.formatTimeSlots(item.timeSlots || []),
        serviceDurationMinutes: item.serviceDurationMinutes || raw.serviceDurationMinutes || 0,

        rawScheduleStatus: rawStatus,
        scheduleStatus: displayStatus,
        scheduleStatusText: this.getScheduleStatusText(displayStatus),

        canStartSchedule,
        canWriteRecord,
        canFinishSchedule,
        canViewRecord
      }
    })

    const progress = this.buildProgress(serviceDates)
    const header = this.buildHeaderByOrderStatus(raw.orderStatus, progress, serviceDates)
    const currentActionSchedule = this.pickCurrentActionSchedule(serviceDates, canTake)

    return {
      ...raw,
      orderStatusText: this.getOrderStatusText(raw.orderStatus),
      orderStatusClass: this.getOrderStatusClass(raw.orderStatus),
      totalPriceText: this.formatMoney(raw.totalPrice || 0),
      unitPriceText: this.formatMoney(raw.unitPrice || 0),
      pets,
      serviceDates,

      serviceDateSummary: this.buildServiceDateSummary(serviceDates),
      serviceTimeSummary: this.buildServiceTimeSummary(serviceDates, raw.timeSlots || []),
      serviceDurationSummary: `${raw.serviceDurationMinutes || 0}分钟/次`,

      progressText: progress.text,
      progressSubText: progress.subText,
      headerTitle: header.title,
      headerDesc: header.desc,

      canTake,
      showScheduleActions: !canTake,
      scheduleCount: serviceDates.length,
      currentActionSchedule
    }
  },

  pickCurrentActionSchedule(serviceDates, canTake) {
    if (canTake) return null
    if (!serviceDates || !serviceDates.length) return null

    let target =
      serviceDates.find(item => item.rawScheduleStatus === 'SERVING') ||
      serviceDates.find(item => item.rawScheduleStatus === 'RECORDED') ||
      serviceDates.find(item => item.canStartSchedule) ||
      serviceDates.find(item => item.isToday) ||
      null

    return target
  },

  buildDisplayScheduleStatus(rawStatus, isToday, isPast) {
    if (rawStatus === 'DONE') return 'DONE'
    if (rawStatus === 'SERVING') return 'SERVING'
    if (rawStatus === 'RECORDED') return 'RECORDED'
    if (rawStatus === 'CANCELLED') return 'CANCELLED'

    if (rawStatus === 'PENDING') {
      if (isToday) return 'PENDING'
      if (isPast) return 'PENDING'
      return 'LOCKED'
    }

    return 'LOCKED'
  },

  buildProgress(serviceDates) {
    const total = serviceDates.length
    const doneCount = serviceDates.filter(item => item.rawScheduleStatus === 'DONE').length
    const servingCount = serviceDates.filter(item => item.rawScheduleStatus === 'SERVING').length
    const recordedCount = serviceDates.filter(item => item.rawScheduleStatus === 'RECORDED').length
    const pendingCount = serviceDates.filter(item => item.rawScheduleStatus === 'PENDING').length

    let text = `已完成 ${doneCount}/${total} 次服务`
    let subText = ''

    if (servingCount > 0) {
      text = '服务进行中'
      subText = `当前有 ${servingCount} 次服务处理中`
    } else if (recordedCount > 0) {
      text = '待结束本次服务'
      subText = '请确认服务记录无误后结束本次服务'
    } else if (doneCount === total && total > 0) {
      text = `已完成 ${doneCount}/${total} 次服务`
      subText = '本次预约服务均已完成'
    } else if (doneCount > 0) {
      text = `已完成 ${doneCount}/${total} 次服务`
      subText = `还有 ${pendingCount} 次待服务`
    } else if (pendingCount > 0) {
      text = '待开始服务'
      subText = `共有 ${pendingCount} 次待服务`
    }

    return { text, subText, doneCount, total }
  },

  buildHeaderByOrderStatus(orderStatus, progress, serviceDates) {
    const nextPending = serviceDates.find(item => item.rawScheduleStatus === 'PENDING')
    const servingItem = serviceDates.find(item => item.rawScheduleStatus === 'SERVING')
    const recordedItem = serviceDates.find(item => item.rawScheduleStatus === 'RECORDED')

    if (orderStatus === 'WAIT_TAKING') {
      return {
        title: '待接单',
        desc: '确认接单后再按日期逐次完成上门服务'
      }
    }

    if (orderStatus === 'TAKEN') {
      return {
        title: '已接单',
        desc: nextPending
          ? `下一次待服务：${nextPending.serviceDateText}`
          : '请按预约日期完成每次服务'
      }
    }

    if (orderStatus === 'PART_SERVING') {
      if (servingItem) {
        return {
          title: '服务进行中',
          desc: `当前服务：${servingItem.serviceDateText}，请先填写记录再结束本次服务`
        }
      }
      if (recordedItem) {
        return {
          title: '待结束本次服务',
          desc: `已提交记录：${recordedItem.serviceDateText}，请完成本次服务`
        }
      }
      return {
        title: progress.text,
        desc: progress.subText || '请继续处理当前服务'
      }
    }

    if (orderStatus === 'PART_COMPLETED') {
      return {
        title: progress.text,
        desc: nextPending ? `下一次待服务：${nextPending.serviceDateText}` : (progress.subText || '还有未完成服务')
      }
    }

    if (orderStatus === 'COMPLETED') {
      return {
        title: '订单已全部完成',
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
      desc: progress.subText || ''
    }
  },

  buildServiceDateSummary(serviceDates) {
    if (!serviceDates || !serviceDates.length) return '--'
    if (serviceDates.length === 1) return serviceDates[0].serviceDateText
    return `${serviceDates[0].serviceDateText} 起 · 共${serviceDates.length}次服务`
  },

  buildServiceTimeSummary(serviceDates, fallbackSlots) {
    const allSlots = serviceDates
      .map(item => item.timeSlotsText)
      .filter(Boolean)

    if (allSlots.length) {
      const merged = Array.from(new Set(allSlots.join('、').split('、').filter(Boolean)))
      return merged.join('、') || this.formatTimeSlots(fallbackSlots)
    }

    return this.formatTimeSlots(fallbackSlots)
  },

  getTodayDateString() {
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  },

  isPastDate(dateStr) {
    if (!dateStr) return false
    const today = this.getTodayDateString()
    return dateStr < today
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

  formatDateShort(dateStr) {
    if (!dateStr) return '--/--'
    const date = new Date(String(dateStr).replace(/-/g, '/'))
    if (Number.isNaN(date.getTime())) return '--/--'
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${month}/${day}`
  },

  getOrderStatusText(status) {
    const map = {
      WAIT_TAKING: '待接单',
      TAKEN: '已接单',
      PART_SERVING: '服务进行中',
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
      PART_COMPLETED: 'status-part-completed',
      COMPLETED: 'status-completed',
      CANCELLED: 'status-cancelled'
    }
    return map[status] || 'status-wait-taking'
  },

  getScheduleStatusText(status) {
    const map = {
      LOCKED: '未开始',
      PENDING: '待开始',
      SERVING: '服务中',
      RECORDED: '已提交记录',
      DONE: '已完成',
      CANCELLED: '已取消'
    }
    return map[status] || '未开始'
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
        fail: (err) => {
          reject(err)
        }
      })
    })
  },

  handleStartSchedule(e) {
    const scheduleId = e.currentTarget.dataset.scheduleId
    const currentUser = wx.getStorageSync('currentUser') || { id: 1 }

    if (!scheduleId) return

    wx.showModal({
      title: '开始本次服务',
      content: '请确认你已到达服务地址附近。开始后将记录开始时间和当前位置。',
      confirmText: '确认开始',
      cancelText: '取消',
      success: async (res) => {
        if (!res.confirm) return

        try {
          wx.showLoading({ title: '定位中' })
          const location = await this.getCurrentLocation()

          wx.showLoading({ title: '处理中' })
          await request('/api/sitter/orders/start-schedule', 'POST', {
            orderId: this.data.orderId,
            scheduleId,
            sitterId: currentUser.id,
            latitude: location.latitude,
            longitude: location.longitude
          })

          wx.hideLoading()
          wx.redirectTo({
            url: `/pages/service-record-upload/index?orderId=${this.data.orderId}&scheduleId=${scheduleId}`
          })
        } catch (err) {
          console.error('handleStartSchedule error', err)
          wx.hideLoading()
          wx.showToast({
            title: '请开启定位并在服务地址附近重试',
            icon: 'none'
          })
        }
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
      content: '结束后将记录结束时间和当前位置。若未填写服务记录，将无法结束本次服务。',
      confirmText: '确认结束',
      cancelText: '取消',
      success: async (res) => {
        if (!res.confirm) return

        try {
          wx.showLoading({ title: '定位中' })
          const location = await this.getCurrentLocation()

          wx.showLoading({ title: '处理中' })
          await request('/api/sitter/orders/finish-schedule', 'POST', {
            orderId: this.data.orderId,
            scheduleId,
            sitterId: currentUser.id,
            latitude: location.latitude,
            longitude: location.longitude
          })

          wx.hideLoading()
          wx.showToast({ title: '本次服务已结束', icon: 'success' })
          setTimeout(() => this.loadPageData(), 500)
        } catch (err) {
          console.error('handleFinishSchedule error', err)
          wx.hideLoading()
          wx.showToast({
            title: '结束失败，请先提交记录并检查定位',
            icon: 'none'
          })
        }
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