const { request } = require('../../utils/request')
const { getCurrentUser, getToken, goLogin } = require('../../utils/auth')
const { orderHasServiceToday, getSitterMineStatusSummary } = require('../../utils/order-display')

Page({
  data: {
    statusBarHeight: 20,
    navBarHeight: 44,
    navTotalHeight: 64,

    sitterOnline: true,
    currentMainTab: 'AVAILABLE',
    currentFilter: 'ALL',

    mainTabs: [
      { key: 'AVAILABLE', label: '可接订单' },
      { key: 'MINE', label: '我的服务单' }
    ],

    availableFilters: [
      { key: 'ALL', label: '全部' },
      { key: 'TODAY', label: '今日服务' },
      { key: 'RECENT_3_DAYS', label: '近期待服务' },
      { key: 'HIGH_PRICE', label: '高价优先' },
      { key: 'NEARBY', label: '距离近' }
    ],

    mineFilters: [
      { key: 'ALL', label: '全部' },
      { key: 'TODAY', label: '今日服务' },
      { key: 'TAKEN', label: '已接单' },
      { key: 'PART_SERVING', label: '服务中' },
      { key: 'COMPLETED', label: '已完成' }
    ],

    stats: {
      todayAvailableCount: 0,
      pendingMineCount: 0
    },

    loading: true,
    profile: null,
    needRegister: false,
    gateInfo: null,
    availableOrders: [],
    mineOrders: [],
    displayedOrders: []
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

    this.loadPageData()
  },

  onShow() {
    this.loadPageData()
  },

  loadPageData() {
    const currentUser = getCurrentUser()
    const isLoggedIn = !!(getToken() && currentUser && currentUser.id)

    if (!isLoggedIn) {
      this.setData({
        loading: false,
        profile: null,
        needRegister: true,
        gateInfo: this.buildGateInfo(null),
        availableOrders: [],
        mineOrders: [],
        displayedOrders: []
      })
      return
    }

    this.setData({ loading: true })

    request('/api/sitter/me', 'GET').then((profile) => {
      if (!profile || !profile.canAcceptOrder) {
        this.setData({
          loading: false,
          profile,
          needRegister: true,
          gateInfo: this.buildGateInfo(profile),
          availableOrders: [],
          mineOrders: [],
          displayedOrders: []
        })
        return Promise.reject({ handled: true })
      }
      this.setData({ profile, needRegister: false, gateInfo: null })
      return null
    }).then(() => {
  
      return this.getCurrentLocation().then((location) => {
        this.currentLocation = location
  
        return Promise.all([
          this.loadAvailableOrders(),
          this.loadMineOrders()
        ]).finally(() => {
          this.setData({ loading: false }, () => {
            this.buildStats()
            this.applyCurrentFilter()
          })
        })
      })
    }).catch((err) => {
      if (err && err.handled) return
      console.error('load sitter profile error', err)
      this.setData({ loading: false })
    })
  },

  goRegister() {
    const currentUser = getCurrentUser()
    if (!(getToken() && currentUser && currentUser.id)) {
      goLogin()
      return
    }

    wx.navigateTo({
      url: '/pages/sitter/register/index'
    })
  },

  goWorkbench() {
    const currentUser = getCurrentUser()
    if (!(getToken() && currentUser && currentUser.id)) {
      goLogin()
      return
    }

    wx.navigateTo({
      url: '/pages/sitter/workbench/index'
    })
  },

  buildGateInfo(profile) {
    if (!profile || !profile.auditStatus || profile.auditStatus === 'NOT_SUBMITTED') {
      return {
        title: '成为托托师',
        desc: '完成入驻申请并通过审核后，即可查看和承接附近订单。',
        button: '立即申请'
      }
    }

    if (profile.auditStatus === 'PENDING') {
      return {
        title: '资料已提交',
        desc: '平台会在1-2个工作日内完成审核，你可以进入页面刷新状态。',
        button: '查看审核状态'
      }
    }

    if (profile.auditStatus === 'REJECTED') {
      return {
        title: '审核未通过',
        desc: `原因：${profile.rejectReason || '资料信息不完整，请修改后重新提交。'}`,
        button: '重新提交'
      }
    }

    if (profile.auditStatus === 'APPROVED') {
      return {
        title: '资料审核通过',
        desc: '缴纳99元履约押金后，即可进入托托师工作台并开始接单。',
        button: '去缴纳押金'
      }
    }

    return {
      title: '成为托托师',
      desc: '完成入驻申请后即可开启接单。',
      button: '查看入驻状态'
    }
  },

  loadAvailableOrders() {
    const currentUser = wx.getStorageSync('currentUser') || { id: 1 }
    const location = this.currentLocation || {}
  
    return request('/api/sitter/orders/available', 'POST', {
      sitterId: currentUser.id,
      latitude: location.latitude,
      longitude: location.longitude
    })
      .then((res) => {
        const list = (res || []).map(item => this.formatAvailableOrder(item))
        this.setData({ availableOrders: list })
      })
      .catch((err) => {
        console.error('loadAvailableOrders error', err)
        this.setData({ availableOrders: [] })
      })
  },

  loadMineOrders() {
    const currentUser = wx.getStorageSync('currentUser') || { id: 1 }
    const location = this.currentLocation || {}
  
    return request('/api/sitter/orders/mine', 'POST', {
      sitterId: currentUser.id,
      latitude: location.latitude,
      longitude: location.longitude
    })
      .then((res) => {
        const list = (res || []).map(item => this.formatMineOrder(item))
        this.setData({ mineOrders: list })
      })
      .catch((err) => {
        console.error('loadMineOrders error', err)
        this.setData({ mineOrders: [] })
      })
  },

  buildStats() {
    const todayText = this.getTodayText()
    const todayAvailableCount = this.data.availableOrders.filter(item => item.serviceDateText === todayText).length
    const pendingMineCount = this.data.mineOrders.filter(item =>
      ['TAKEN', 'SERVING', 'PART_SERVING', 'PART_COMPLETED'].includes(item.orderStatus)
    ).length

    this.setData({
      stats: {
        todayAvailableCount,
        pendingMineCount
      }
    })
  },

  getTodayText() {
    const date = new Date()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${month}/${day}`
  },

  formatAvailableOrder(item) {
    const serviceDates = item.serviceDates || []
    const firstDate = serviceDates.length ? serviceDates[0] : item.firstServiceDate
    const serviceDateText = this.formatDateSimple(firstDate)
    const serviceDateCount = item.serviceDateCount || serviceDates.length || 0
    const distanceText = this.buildDistanceText(item)

    return {
      ...item,
      id: item.id,
      orderStatus: item.orderStatus || 'WAIT_TAKING',
      orderStatusText: '待接单',
      orderStatusClass: 'status-wait-taking',
      serviceDateText,
      fullDateText: this.buildAvailableDateDisplay(serviceDates, serviceDateCount),
      timeSlotsText: this.formatTimeSlots(item.timeSlots || []),
      petSummary: `${item.petCount || 0}只宠物 · ${item.serviceDurationMinutes || 0}分钟/次`,
      addressSummary: this.buildAddressSummary(item),
      distanceText,
      remarkSummary: item.remark ? `备注：${item.remark}` : '备注：暂无特殊说明',
      unitPriceText: this.formatMoney(item.unitPrice || item.serviceFee || 0),
      totalPriceText: this.formatMoney(item.totalPrice || 0),
      serviceDateCount,
      isMultiDay: serviceDateCount > 1,
      multiDayTagText: serviceDateCount > 1 ? `${serviceDateCount}次上门` : '单次服务',
      isToday: this.hasServiceDateInRange(serviceDates, 0, 0),
      isRecent3Days: this.hasServiceDateInRange(serviceDates, 0, 2)
    }
  },

  formatMineOrder(item) {
    const firstDate = item.firstServiceDate
    const dates = item.serviceDates || []
    return {
      ...item,
      id: item.id,
      orderStatus: item.orderStatus,
      orderStatusText: getSitterMineStatusSummary(item),
      orderStatusClass: this.getOrderStatusClass(item.orderStatus),
      hasServiceToday: orderHasServiceToday(item),
      serviceDateText: this.formatDateSimple(firstDate),
      fullDateText: this.formatDateFull(firstDate),
      timeSlotsText: this.formatTimeSlots(item.timeSlots || []),
      petSummary: `${item.petCount || 0}只宠物 · ${item.serviceDurationMinutes || 0}分钟/次 · 共${item.serviceDateCount || 0}次服务`,
      addressSummary: this.buildAddressSummary(item),
      distanceText: this.buildDistanceText(item),
      remarkSummary: item.remark ? `备注：${item.remark}` : '备注：暂无特殊说明',
      unitPriceText: this.formatMoney(item.unitPrice || 0),
      totalPriceText: this.formatMoney(item.totalPrice || 0)
    }
  },

  buildAddressSummary(item) {
    const district = item.serviceDistrict || ''
    const detail = item.serviceDetailAddress || item.serviceFullAddress || ''
    if (district && detail) {
      return `${district} · ${detail}`
    }
    return detail || '地址待确认'
  },

  buildDistanceText(item) {
    const distance = item.distanceKm || item.distance || item.sitterDistanceKm
    if (distance === null || distance === undefined || distance === '') {
      return '距离待计算'
    }

    const num = Number(distance)
    if (Number.isNaN(num)) {
      return '距离待计算'
    }

    if (num < 1) {
      return `距离约${Math.round(num * 1000)}m`
    }

    return `距离约${num.toFixed(1)}km`
  },

  formatMoney(value) {
    return Number(value || 0).toFixed(2)
  },

  formatTimeSlots(list) {
    if (!list || !list.length) return '时间待确认'
    return list.join('、')
  },

  formatDateSimple(dateStr) {
    if (!dateStr) return '--/--'
    const date = new Date(String(dateStr).replace(/-/g, '/'))
    if (Number.isNaN(date.getTime())) return '--/--'
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${month}/${day}`
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

  hasServiceDateInRange(serviceDates, startOffsetDays, endOffsetDays) {
    if (!serviceDates || !serviceDates.length) return false
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const start = new Date(today)
    start.setDate(today.getDate() + startOffsetDays)
    const end = new Date(today)
    end.setDate(today.getDate() + endOffsetDays)

    return serviceDates.some((dateStr) => {
      const date = new Date(String(dateStr).replace(/-/g, '/'))
      if (Number.isNaN(date.getTime())) return false
      date.setHours(0, 0, 0, 0)
      return date >= start && date <= end
    })
  },

  buildAvailableDateDisplay(serviceDates, serviceDateCount) {
    if (!serviceDates || !serviceDates.length) {
      return '--/-- --'
    }

    const firstDate = serviceDates[0]
    const firstFull = this.formatDateFull(firstDate)

    if ((serviceDateCount || serviceDates.length) <= 1) {
      return firstFull
    }

    const date = new Date(String(firstDate).replace(/-/g, '/'))
    if (Number.isNaN(date.getTime())) {
      return `${firstFull}起 · 共${serviceDateCount || serviceDates.length}次服务`
    }

    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')

    return `${month}/${day}起 · 共${serviceDateCount || serviceDates.length}次服务`
  },

  getOrderStatusText(status) {
    const map = {
      WAIT_TAKING: '待接单',
      TAKEN: '已接单',
      SERVING: '服务中',
      PART_SERVING: '服务中',
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
      SERVING: 'status-serving',
      PART_SERVING: 'status-serving',
      PART_COMPLETED: 'status-part-completed',
      COMPLETED: 'status-completed',
      CANCELLED: 'status-cancelled',
      EXCEPTION: 'status-wait-taking'
    }
    return map[status] || 'status-taken'
  },

  switchMainTab(e) {
    const key = e.currentTarget.dataset.key
    if (!key || key === this.data.currentMainTab) return

    this.setData({
      currentMainTab: key,
      currentFilter: 'ALL'
    }, () => {
      this.applyCurrentFilter()
    })
  },

  switchFilter(e) {
    const key = e.currentTarget.dataset.key
    if (!key || key === this.data.currentFilter) return

    this.setData({ currentFilter: key }, () => {
      this.applyCurrentFilter()
    })
  },

  applyCurrentFilter() {
    const { currentMainTab, currentFilter, availableOrders, mineOrders } = this.data

    if (currentMainTab === 'AVAILABLE') {
      let list = [...availableOrders]

      if (currentFilter === 'TODAY') {
        list = list.filter(item => item.isToday)
      }

      if (currentFilter === 'RECENT_3_DAYS') {
        list = list.filter(item => item.isRecent3Days)
      }

      if (currentFilter === 'HIGH_PRICE') {
        list = list.sort((a, b) => {
          const totalDiff = Number(b.totalPriceText || 0) - Number(a.totalPriceText || 0)
          if (totalDiff !== 0) return totalDiff
          return Number(b.unitPriceText || 0) - Number(a.unitPriceText || 0)
        })
      }

      if (currentFilter === 'NEARBY') {
        list = list.sort((a, b) => {
          const da = this.extractDistanceValue(a.distanceText)
          const db = this.extractDistanceValue(b.distanceText)
          return da - db
        })
      }

      this.setData({ displayedOrders: list })
      return
    }

    let mineList = [...mineOrders]
    if (currentFilter === 'TODAY') {
      mineList = mineList.filter(item => item.hasServiceToday && item.orderStatus !== 'CANCELLED')
    } else if (currentFilter === 'PART_SERVING') {
      mineList = mineList.filter(item =>
        item.orderStatus === 'SERVING' || item.orderStatus === 'PART_SERVING' || item.orderStatus === 'PART_COMPLETED'
      )
    } else if (currentFilter !== 'ALL') {
      mineList = mineList.filter(item => item.orderStatus === currentFilter)
    }
    this.setData({ displayedOrders: mineList })
  },

  extractDistanceValue(distanceText) {
    if (!distanceText || distanceText === '距离待计算') return Number.MAX_SAFE_INTEGER

    if (distanceText.indexOf('m') > -1) {
      const num = Number(distanceText.replace(/[^\d.]/g, ''))
      return Number.isNaN(num) ? Number.MAX_SAFE_INTEGER : num / 1000
    }

    const num = Number(distanceText.replace(/[^\d.]/g, ''))
    return Number.isNaN(num) ? Number.MAX_SAFE_INTEGER : num
  },

  toggleOnlineStatus() {
    this.setData({ sitterOnline: !this.data.sitterOnline })
  },

  goOrderDetail(e) {
    const id = e.currentTarget.dataset.id
    if (!id) return

    wx.navigateTo({
      url: `/pages/sitter/order-detail/index?id=${id}&mode=${this.data.currentMainTab}`
    })
  },
  getCurrentLocation() {
    return new Promise((resolve) => {
      wx.getLocation({
        type: 'gcj02',
        success: (res) => {
          resolve({
            latitude: res.latitude,
            longitude: res.longitude
          })
        },
        fail: () => {
          resolve({
            latitude: null,
            longitude: null
          })
        }
      })
    })
  },
  takeOrderDirect(e) {
    const id = e.currentTarget.dataset.id
    if (!id) return

    wx.navigateTo({
      url: `/pages/sitter/order-detail/index?id=${id}&mode=AVAILABLE`
    })
  }
})
