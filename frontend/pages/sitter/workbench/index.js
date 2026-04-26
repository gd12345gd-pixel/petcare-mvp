const { request } = require('../../../utils/request')
const { ensureLogin, getCurrentUser } = require('../../../utils/auth')
const { orderHasServiceToday } = require('../../../utils/order-display')

Page({
  data: {
    statusBarHeight: 20,
    navBarHeight: 44,
    navTotalHeight: 64,
    loading: true,
    profile: null,
    currentUser: null,
    availableOrders: [],
    mineOrders: [],
    stats: {
      todayAvailableCount: 0,
      todayAcceptedCount: 0,
      nearbyAvailableCount: 0
    },
    income: {
      withdrawable: '0',
      pending: '0',
      total: '0'
    },
    nextService: null,
    calendarDays: []
  },

  onLoad() {
    const systemInfo = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()
    const statusBarHeight = systemInfo.statusBarHeight || 20
    const navBarHeight = 44

    this.setData({
      statusBarHeight,
      navBarHeight,
      navTotalHeight: statusBarHeight + navBarHeight
    })

    if (!ensureLogin().id) return
    this.loadWorkbench()
  },

  onShow() {
    if (getCurrentUser() && getCurrentUser().id) {
      this.loadWorkbench()
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

  loadWorkbench() {
    this.setData({
      loading: true,
      currentUser: getCurrentUser()
    })

    request('/api/sitter/me', 'GET')
      .then((profile) => {
        if (!profile || !profile.canAcceptOrder) {
          this.setData({ profile, loading: false })
          return Promise.reject({ handled: true })
        }

        this.setData({ profile })
        return this.getCurrentLocation().then((location) => Promise.all([
          request('/api/sitter/orders/available', 'POST', {
            latitude: location.latitude,
            longitude: location.longitude
          }).catch(() => []),
          request('/api/sitter/orders/mine', 'POST', {
            latitude: location.latitude,
            longitude: location.longitude
          }).catch(() => [])
        ]))
      })
      .then(([availableOrders, mineOrders]) => {
        const available = availableOrders || []
        const mine = mineOrders || []
        this.setData({
          availableOrders: available,
          mineOrders: mine,
          stats: this.buildStats(available, mine),
          income: this.buildIncome(mine),
          nextService: this.buildNextService(mine),
          calendarDays: this.buildCalendarDays(mine),
          loading: false
        })
      })
      .catch((err) => {
        if (err && err.handled) return
        console.error('load sitter workbench error', err)
        this.setData({ loading: false })
      })
  },

  buildStats(availableOrders, mineOrders) {
    const today = this.formatDateKey(new Date())
    const activeStatuses = ['TAKEN', 'SERVING', 'PART_SERVING', 'PART_COMPLETED']
    return {
      todayAvailableCount: availableOrders.filter(item => (item.serviceDates || []).includes(today)).length,
      todayAcceptedCount: mineOrders.filter(item =>
        activeStatuses.includes(item.orderStatus) && orderHasServiceToday(item)
      ).length,
      nearbyAvailableCount: availableOrders.length
    }
  },

  buildIncome(mineOrders) {
    const completed = mineOrders
      .filter(item => item.orderStatus === 'COMPLETED')
      .reduce((sum, item) => sum + Number(item.totalPrice || 0), 0)
    const pending = mineOrders
      .filter(item => ['TAKEN', 'SERVING', 'PART_SERVING', 'PART_COMPLETED'].includes(item.orderStatus))
      .reduce((sum, item) => sum + Number(item.totalPrice || 0), 0)

    return {
      withdrawable: '0',
      pending: this.formatMoney(pending),
      total: this.formatMoney(completed)
    }
  },

  buildNextService(mineOrders) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const activeOrders = mineOrders.filter(item =>
      ['TAKEN', 'SERVING', 'PART_SERVING', 'PART_COMPLETED'].includes(item.orderStatus)
    )

    let bestDate = null
    let bestOrder = null
    activeOrders.forEach((order) => {
      const candidates = []
      ;(order.serviceDates || []).forEach((d) => {
        const parsed = this.parseDate(d)
        if (parsed) candidates.push(parsed)
      })
      const first = this.parseDate(order.firstServiceDate)
      if (first) candidates.push(first)
      candidates.forEach((d) => {
        if (d >= today && (!bestDate || d < bestDate)) {
          bestDate = d
          bestOrder = order
        }
      })
    })

    if (!bestOrder || !bestDate) return null
    const y = bestDate.getFullYear()
    const m = String(bestDate.getMonth() + 1).padStart(2, '0')
    const day = String(bestDate.getDate()).padStart(2, '0')
    return {
      id: bestOrder.id,
      dateText: this.formatDateLabel(`${y}-${m}-${day}`),
      timeText: (bestOrder.timeSlots || []).join('、') || '时间待确认',
      petText: `${bestOrder.petCount || 0}只宠物`,
      addressText: [bestOrder.serviceDistrict, bestOrder.serviceDetailAddress].filter(Boolean).join(' · ') || '地址待确认'
    }
  },

  buildCalendarDays(mineOrders) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const serviceDateSet = new Set()
    ;(mineOrders || []).forEach((item) => {
      (item.serviceDates || []).forEach((d) => {
        const k = String(d).slice(0, 10)
        if (k) serviceDateSet.add(k)
      })
      const fk = this.formatDateKeyFromText(item.firstServiceDate)
      if (fk) serviceDateSet.add(fk)
    })
    const weekMap = ['日', '一', '二', '三', '四', '五', '六']

    return Array.from({ length: 7 }).map((_, index) => {
      const date = new Date(today)
      date.setDate(today.getDate() + index)
      const key = this.formatDateKey(date)
      return {
        key,
        day: date.getDate(),
        week: weekMap[date.getDay()],
        active: index === 0,
        hasService: serviceDateSet.has(key)
      }
    })
  },

  getCurrentLocation() {
    return new Promise((resolve) => {
      wx.getLocation({
        type: 'gcj02',
        success: (res) => resolve({ latitude: res.latitude, longitude: res.longitude }),
        fail: () => resolve({ latitude: null, longitude: null })
      })
    })
  },

  goRegister() {
    wx.navigateTo({ url: '/pages/sitter/register/index' })
  },

  goTakeOrders() {
    wx.switchTab({ url: '/pages/sitter/index' })
  },

  goServiceDetail() {
    if (!this.data.nextService || !this.data.nextService.id) return
    wx.navigateTo({
      url: `/pages/sitter/order-detail/index?id=${this.data.nextService.id}&mode=MINE`
    })
  },

  goFeature(e) {
    const key = e.currentTarget.dataset.key
    if (key === 'orders') {
      wx.switchTab({ url: '/pages/sitter/index' })
      return
    }
    if (key === 'rules') {
      wx.navigateTo({ url: '/pages/sitter/rules/index' })
      return
    }
    if (key === 'growth') {
      wx.navigateTo({ url: '/pages/sitter/growth/index' })
      return
    }
    wx.showToast({ title: '功能完善中', icon: 'none' })
  },

  parseDate(value) {
    if (!value) return null
    const date = new Date(String(value).replace(/-/g, '/'))
    return Number.isNaN(date.getTime()) ? null : date
  },

  formatDateKeyFromText(value) {
    const date = this.parseDate(value)
    return date ? this.formatDateKey(date) : ''
  },

  formatDateKey(date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  },

  formatDateLabel(value) {
    const date = this.parseDate(value)
    if (!date) return '日期待确认'
    const weekMap = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${month}/${day} ${weekMap[date.getDay()]}`
  },

  formatMoney(value) {
    return String(Math.round(Number(value || 0)))
  }
})
