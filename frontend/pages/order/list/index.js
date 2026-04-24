const { request } = require('../../../utils/request')
const { ensureLogin, getCurrentUser, getToken } = require('../../../utils/auth')

Page({
  data: {
    loading: true,
    isLoggedIn: false,
    orders: [],
    filteredOrders: [],

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
      orderStatusClass: this.getOrderStatusClass(item.orderStatus),
      payStatusText: this.getPayStatusText(item.payStatus),
      firstServiceDateText: this.formatServiceDate(item.firstServiceDate),
      unitPriceText: this.formatMoney(item.unitPrice),
      totalPriceText: this.formatMoney(item.totalPrice)
    }
  },

  applyFilter() {
    const { orders, currentTab } = this.data

    const filteredOrders = currentTab === 'ALL'
      ? orders
      : orders.filter(item => item.orderStatus === currentTab)

    this.setData({ filteredOrders })
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

  formatMoney(value) {
    const num = Number(value || 0)
    return num.toFixed(2)
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

  goCreateOrder() {
    if (!ensureLogin().id) return
    wx.navigateTo({
      url: '/pages/service-detail/index'
    })
  }
})
