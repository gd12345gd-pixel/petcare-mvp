const { request } = require('../../../utils/request')
const { ensureLogin, getCurrentUser, getToken } = require('../../../utils/auth')

const ORDER_SECTIONS = [
  { key: 'WAIT_TAKING', title: '待接单', desc: '服务尚未开始，等待托托师接单', colorClass: 'section-wait-taking' },
  { key: 'TAKEN', title: '已接单', desc: '托托师已接单，等待服务开始', colorClass: 'section-taken' },
  { key: 'SERVING', title: '服务中', desc: '服务进行中', colorClass: 'section-serving' },
  { key: 'COMPLETED', title: '已完成', desc: '服务已全部完成', colorClass: 'section-completed' },
  { key: 'CANCELLED', title: '已取消', desc: '订单已取消', colorClass: 'section-cancelled' }
]

Page({
  data: {
    loading: true,
    isLoggedIn: false,
    orders: [],
    filteredOrders: [],
    filteredSections: [],
    collapsedSections: {},

    currentTab: 'ALL',
    tabs: [
      { key: 'ALL', label: '全部' },
      { key: 'WAIT_TAKING', label: '待接单' },
      { key: 'TAKEN', label: '已接单' },
      { key: 'SERVING', label: '服务中' },
      { key: 'COMPLETED', label: '已完成' },
      { key: 'CANCELLED', label: '已取消' }
    ],

    statusBarHeight: 20,
    navBarHeight: 44,
    navTotalHeight: 64
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

    this.loadOrders()
  },

  onShow() {
    this.loadOrders()
  },

  loadOrders() {
    const currentUser = getCurrentUser()
    const isLoggedIn = !!(getToken() && currentUser && currentUser.id)

    if (!isLoggedIn) {
      this.setData({
        isLoggedIn: false,
        loading: false,
        orders: [],
        filteredOrders: []
      })
      return
    }

    this.setData({ loading: true, isLoggedIn: true })

    request(`/api/orders/list?userId=${currentUser.id}`, 'GET')
      .then((res) => {
        const orders = (res || []).map(item => this.formatOrderItem(item))

        this.setData({
          orders,
          loading: false
        }, () => {
          this.applyFilter()
        })
      })
      .catch((err) => {
        console.error('加载订单列表失败', err)
        this.setData({
          loading: false
        })
        wx.showToast({
          title: '加载订单失败',
          icon: 'none'
        })
      })
  },

  formatOrderItem(item) {
    return {
      ...item,
      orderStatusText: this.getOrderStatusText(item.orderStatus),
      orderStatusDisplayText: item.canReschedule ? '待接单 · 可修改预约' : this.getOrderStatusText(item.orderStatus),
      orderStatusClass: this.getOrderStatusClass(item.orderStatus),
      sectionKey: this.getSectionKey(item.orderStatus),
      payStatusText: this.getPayStatusText(item.payStatus),
      serviceDateRangeText: this.formatServiceDateRange(item.firstServiceDate, item.lastServiceDate),
      unitPriceText: this.formatMoney(item.unitPrice),
      totalPriceText: this.formatMoney(item.totalPrice),
      petCountText: this.formatPetCount(item),
      nextServiceText: this.formatNextService(item),
      serviceMetaText: this.formatServiceMeta(item),
      progressText: this.formatProgress(item),
      progressPercent: this.getProgressPercent(item),
      showProgress: this.shouldShowProgress(item),
      primaryActionText: this.getPrimaryActionText(item.orderStatus),
      secondaryActionText: this.getSecondaryActionText(item)
    }
  },

  applyFilter() {
    const { orders, currentTab } = this.data

    const filteredOrders = currentTab === 'ALL'
      ? [...orders].sort((a, b) => this.getSortableTime(b) - this.getSortableTime(a))
      : orders.filter(item => item.sectionKey === currentTab)

    const sectionDefs = currentTab === 'ALL'
      ? ORDER_SECTIONS
      : ORDER_SECTIONS.filter(item => item.key === currentTab)

    const filteredSections = sectionDefs
      .map(section => {
        const list = filteredOrders.filter(item => item.sectionKey === section.key)
        return {
          ...section,
          count: list.length,
          collapsed: !!this.data.collapsedSections[section.key],
          orders: list
        }
      })
      .filter(section => section.count > 0 || currentTab !== 'ALL')

    this.setData({ filteredOrders, filteredSections })
  },

  getSortableTime(item) {
    const rawTime = item.createdAt || item.createTime || item.updatedAt || ''
    const time = rawTime ? new Date(String(rawTime).replace(/-/g, '/')).getTime() : 0
    if (!Number.isNaN(time) && time > 0) return time
    return Number(item.id || 0)
  },

  switchTab(e) {
    const key = e.currentTarget.dataset.key
    if (!key || key === this.data.currentTab) return

    this.setData({
      currentTab: key
    }, () => {
      this.applyFilter()
    })
  },

  toggleSection(e) {
    const key = e.currentTarget.dataset.key
    if (!key) return
    this.setData({
      [`collapsedSections.${key}`]: !this.data.collapsedSections[key]
    }, () => {
      this.applyFilter()
    })
  },

  formatMoney(value) {
    const num = Number(value || 0)
    return String(Math.round(num))
  },

  formatServiceDate(dateStr) {
    if (!dateStr) return '未设置日期'

    const date = new Date(dateStr.replace(/-/g, '/'))
    const weekMap = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const week = weekMap[date.getDay()]

    return `${month}/${day} ${week}`
  },

  formatServiceDateRange(startDate, endDate) {
    if (!startDate) return '未设置日期'
    const startText = this.formatServiceDate(startDate)
    if (!endDate || endDate === startDate) return startText
    return `${startText} - ${this.formatServiceDate(endDate)}`
  },

  formatNextService(item) {
    if (!item.firstServiceDate) return '下次服务：时间待确认'
    return `下次服务：${this.formatServiceDate(item.firstServiceDate)}`
  },

  formatServiceMeta(item) {
    const count = Number(item.serviceDateCount || 0)
    const duration = Number(item.serviceDurationMinutes || 0)
    const parts = []
    if (count > 0) parts.push(`共${count}次服务`)
    if (duration > 0) parts.push(`${duration}分钟/次`)
    parts.push('上门喂养')
    return parts.join(' · ')
  },

  formatPetCount(item) {
    const parts = []
    if (Number(item.catCount || 0) > 0) {
      parts.push(`猫咪${item.catCount}只`)
    }
    if (Number(item.dogCount || 0) > 0) {
      parts.push(`狗狗${item.dogCount}只`)
    }
    return parts.join(' · ')
  },

  shouldShowProgress(item) {
    return ['TAKEN', 'SERVING', 'PART_SERVING', 'PART_COMPLETED', 'COMPLETED'].includes(item.orderStatus)
  },

  formatProgress(item) {
    const completed = Number(item.completedServiceCount || 0)
    const total = Number(item.serviceDateCount || 0)
    return `已完成 ${completed} / ${total} 次`
  },

  getProgressPercent(item) {
    const completed = Number(item.completedServiceCount || 0)
    const total = Number(item.serviceDateCount || 0)
    if (!total) return 0
    return Math.min(100, Math.round((completed / total) * 100))
  },

  getSectionKey(status) {
    if (status === 'PART_SERVING' || status === 'PART_COMPLETED') return 'SERVING'
    return status || 'WAIT_TAKING'
  },

  getPrimaryActionText(status) {
    const sectionKey = this.getSectionKey(status)
    const map = {
      WAIT_TAKING: '查看详情',
      TAKEN: '查看详情',
      SERVING: '查看进度',
      COMPLETED: '查看服务记录',
      CANCELLED: '查看详情'
    }
    return map[sectionKey] || '查看详情'
  },

  getSecondaryActionText(order) {
    const status = order && order.orderStatus ? order.orderStatus : order
    const sectionKey = this.getSectionKey(status)
    if (sectionKey === 'COMPLETED' && order && order.canReview) {
      return '评价服务'
    }
    const map = {
      WAIT_TAKING: '修改预约',
      TAKEN: '补充备注',
      SERVING: '补充备注',
      COMPLETED: '再约一次',
      CANCELLED: '再约一次'
    }
    return map[sectionKey] || '查看详情'
  },

  getOrderStatusText(status) {
    const map = {
      WAIT_TAKING: '待接单',
      TAKEN: '已接单',
      SERVING: '服务中',
      PART_SERVING: '服务中',
      PART_COMPLETED: '部分完成',
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
      PART_SERVING: 'status-serving',
      PART_COMPLETED: 'status-serving',
      COMPLETED: 'status-completed',
      CANCELLED: 'status-cancelled'
    }
    return map[status] || 'status-wait-taking'
  },

  getPayStatusText(status) {
    const map = {
      UNPAID: '未支付',
      PAID: '已支付',
      REFUNDED: '已退款'
    }
    return map[status] || '未知'
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id
    if (!id) return

    wx.navigateTo({
      url: `/pages/order/detail/index?id=${id}`
    })
  },

  handlePrimaryAction(e) {
    this.goDetail(e)
  },

  handleSecondaryAction(e) {
    const id = e.currentTarget.dataset.id
    const status = e.currentTarget.dataset.status
    const sectionKey = this.getSectionKey(status)

    if (!id) return

    if (sectionKey === 'COMPLETED' || sectionKey === 'CANCELLED') {
      if (sectionKey === 'COMPLETED') {
        const order = this.data.orders.find(item => String(item.id) === String(id))
        if (order && order.canReview) {
          wx.navigateTo({
            url: `/pages/order/review/index?id=${id}`
          })
          return
        }
      }
      this.goCreateOrder()
      return
    }

    if (sectionKey === 'WAIT_TAKING') {
      wx.navigateTo({
        url: `/pages/order/create/index?mode=reschedule&id=${id}`
      })
      return
    }

    if (sectionKey === 'TAKEN' || sectionKey === 'SERVING') {
      wx.navigateTo({
        url: `/pages/order/remark-add/index?id=${id}&status=${status}`
      })
      return
    }

    wx.navigateTo({
      url: `/pages/order/detail/index?id=${id}`
    })
  },

  goCreateOrder() {
    if (!ensureLogin().id) return
    wx.navigateTo({
      url: '/pages/service-detail/index'
    })
  }
})
