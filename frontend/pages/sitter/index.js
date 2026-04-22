const { request } = require('../../utils/request')

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
      { key: 'TODAY', label: '今日可接' },
      { key: 'HIGH_PRICE', label: '高价优先' },
      { key: 'NEARBY', label: '近距离' }
    ],

    mineFilters: [
      { key: 'ALL', label: '全部' },
      { key: 'TAKEN', label: '已接单' },
      { key: 'SERVING', label: '服务中' },
      { key: 'COMPLETED', label: '已完成' }
    ],

    stats: {
      todayAvailableCount: 0,
      pendingMineCount: 0
    },

    loading: true,
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
    this.setData({ loading: true })
  
    this.getCurrentLocation().then((location) => {
      this.currentLocation = location
  
      Promise.all([
        this.loadAvailableOrders(),
        this.loadMineOrders()
      ]).finally(() => {
        this.setData({ loading: false }, () => {
          this.buildStats()
          this.applyCurrentFilter()
        })
      })
    })
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
    const pendingMineCount = this.data.mineOrders.filter(item => item.orderStatus === 'TAKEN' || item.orderStatus === 'SERVING').length

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
      isToday: serviceDateText === this.getTodayText()
    }
  },

  formatMineOrder(item) {
    const firstDate = item.firstServiceDate
    return {
      ...item,
      id: item.id,
      orderStatus: item.orderStatus,
      orderStatusText: this.getOrderStatusText(item.orderStatus),
      orderStatusClass: this.getOrderStatusClass(item.orderStatus),
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
      TAKEN: '已接单',
      SERVING: '服务中',
      COMPLETED: '已完成',
      CANCELLED: '已取消'
    }
    return map[status] || '未知状态'
  },

  getOrderStatusClass(status) {
    const map = {
      TAKEN: 'status-taken',
      SERVING: 'status-serving',
      COMPLETED: 'status-completed',
      CANCELLED: 'status-cancelled'
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

      if (currentFilter === 'HIGH_PRICE') {
        list = list.sort((a, b) => Number(b.unitPriceText) - Number(a.unitPriceText))
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
    if (currentFilter !== 'ALL') {
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