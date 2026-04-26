const { request, resolveUploadedMediaUrl } = require('../../../utils/request')
const { ensureLogin, getCurrentUser, getToken } = require('../../../utils/auth')
const { orderHasServiceToday, isInProgressOrderStatus } = require('../../../utils/order-display')

const ORDER_SECTIONS = [
  { key: 'WAIT_TAKING', title: '待接单', desc: '等待托托师接单', colorClass: 'section-wait-taking' },
  { key: 'IN_PROGRESS', title: '进行中', desc: '已接单，待上门或正在服务', colorClass: 'section-serving' },
  { key: 'COMPLETED', title: '已完成', desc: '全部上门已完成', colorClass: 'section-completed' },
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
    todayFilterOn: false,
    todayOrderCount: 0,
    /** 打开「今日」筛选前选中的 Tab，关闭时还原 */
    tabBeforeTodayFilter: 'ALL',
    tabs: [
      { key: 'ALL', label: '全部' },
      { key: 'WAIT_TAKING', label: '待接单' },
      { key: 'IN_PROGRESS', label: '进行中' },
      { key: 'COMPLETED', label: '已完成' },
      { key: 'CANCELLED', label: '已取消' }
    ],

    statusBarHeight: 20,
    navBarHeight: 44,
    navTotalHeight: 64
  },

  onLoad() {
    this.initNavigationHeight()
    this.loadOrders()
  },

  onShow() {
    this.loadOrders()
  },

  initNavigationHeight() {
    const systemInfo = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()
    const statusBarHeight = systemInfo.statusBarHeight || 20
    let navBarHeight = 44

    try {
      const menuButton = wx.getMenuButtonBoundingClientRect ? wx.getMenuButtonBoundingClientRect() : null
      if (menuButton && menuButton.top && menuButton.height) {
        navBarHeight = (menuButton.top - statusBarHeight) * 2 + menuButton.height
      }
    } catch (err) {
      navBarHeight = 44
    }

    this.setData({
      statusBarHeight,
      navBarHeight,
      navTotalHeight: statusBarHeight + navBarHeight
    })
  },

  loadOrders() {
    const currentUser = getCurrentUser()
    const isLoggedIn = !!(getToken() && currentUser && currentUser.id)

    if (!isLoggedIn) {
      this.setData({
        isLoggedIn: false,
        loading: false,
        orders: [],
        filteredOrders: [],
        filteredSections: [],
        todayFilterOn: false,
        todayOrderCount: 0,
        tabBeforeTodayFilter: 'ALL'
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
    const orderStatusDisplayText = this.getOrderListBadge(item)
    const progressPercent = this.getProgressPercent(item)
    const progressTotal = Number(item.serviceDateCount || 0)
    const showProgress = this.shouldShowProgress(item)

    return {
      ...item,
      orderStatusText: this.getOrderStatusText(item.orderStatus),
      orderStatusDisplayText,
      orderStatusClass: this.getOrderStatusClass(item.orderStatus),
      statusTagClass: this.getOrderStatusTagClass(item, orderStatusDisplayText),
      sectionKey: this.getSectionKey(item.orderStatus),
      hasServiceToday: orderHasServiceToday(item),
      payStatusText: this.getPayStatusText(item.payStatus),
      serviceDateRangeText: this.formatServiceDateRange(item.firstServiceDate, item.lastServiceDate),
      unitPriceText: this.formatMoney(item.unitPrice),
      totalPriceText: this.formatMoney(item.totalPrice),
      petCountText: this.formatPetCount(item),
      cardTitleText: this.formatCardTitle(item),
      petImageUrl: this.getOrderPetImage(item),
      petIconText: this.getPetIconText(item),
      nextServiceText: this.formatNextService(item, orderStatusDisplayText),
      serviceMetaText: this.formatServiceMeta(item),
      progressTotal,
      progressPercent,
      progressPercentText: `${progressPercent}%`,
      progressFillStyle: `width: ${progressPercent}%;`,
      progressCompactText: this.formatProgressCompact(item),
      showProgress,
      progressVisible: progressTotal > 0 || showProgress,
      primaryActionText: this.getPrimaryActionText(item.orderStatus),
      secondaryActionText: this.getSecondaryActionText(item)
    }
  },

  formatProgressCompact(item) {
    const completed = Number(item.completedServiceCount || 0)
    const total = Number(item.serviceDateCount || 0)
    return `已完成 ${completed} / ${total} 次`
  },

  formatCardTitle(item) {
    const c = Number(item.catCount || 0)
    const d = Number(item.dogCount || 0)
    const parts = []

    if (c > 0) parts.push(c === 1 ? '猫咪' : `猫咪${c}只`)
    if (d > 0) parts.push(d === 1 ? '狗狗' : `狗狗${d}只`)

    const total = Number(item.petCount || c + d || 0)
    const petText = parts.length ? parts.join(' · ') : (total > 0 ? `${total}只宠物` : '宠物')
    const serviceName = this.getOrderServiceName(item)

    return serviceName ? `${petText} · ${serviceName}` : petText
  },

  getOrderServiceName(item) {
    const candidates = [
      item.serviceName,
      item.serviceTitle,
      item.serviceTypeName,
      item.serviceTypeText,
      item.productName,
      item.goodsName,
      item.packageName
    ]

    for (let i = 0; i < candidates.length; i += 1) {
      const value = candidates[i]
      if (value) return String(value)
    }

    const serviceTypeMap = {
      FEEDING: '上门喂养',
      HOME_FEEDING: '上门喂养',
      PET_FEEDING: '上门喂养',
      WALKING: '遛狗',
      DOG_WALKING: '遛狗',
      BOARDING: '寄养',
      BATHING: '洗护'
    }

    if (item.serviceType && serviceTypeMap[item.serviceType]) {
      return serviceTypeMap[item.serviceType]
    }

    return '上门喂养'
  },

  getPetIconText(item) {
    const c = Number(item.catCount || 0)
    const d = Number(item.dogCount || 0)

    if (c > 0 && d <= 0) return '猫'
    if (d > 0 && c <= 0) return '狗'
    return '宠'
  },

  getOrderPetImage(item) {
    const pickImage = (value) => {
      if (!value) return ''

      if (typeof value === 'string') {
        return value
      }

      if (Array.isArray(value)) {
        for (let i = 0; i < value.length; i += 1) {
          const img = pickImage(value[i])
          if (img) return img
        }
        return ''
      }

      if (typeof value === 'object') {
        const keys = [
          'url',
          'imageUrl',
          'avatarUrl',
          'coverUrl',
          'photoUrl',
          'petImageUrl',
          'petAvatarUrl',
          'petPhotoUrl'
        ]

        for (let i = 0; i < keys.length; i += 1) {
          const img = pickImage(value[keys[i]])
          if (img) return img
        }
      }

      return ''
    }

    const candidates = [
      item.petImageUrl,
      item.petAvatarUrl,
      item.petCoverUrl,
      item.petPhotoUrl,
      item.coverImageUrl,
      item.avatarUrl,
      item.imageUrl,
      item.petImage,
      item.petAvatar,
      item.petCover,
      item.petPhoto,
      item.coverImage,
      item.petImages,
      item.petImageUrls,
      item.pets,
      item.petList
    ]

    for (let i = 0; i < candidates.length; i += 1) {
      const img = pickImage(candidates[i])
      if (img) return resolveUploadedMediaUrl(img) || img
    }

    return ''
  },

  getOrderStatusTagClass(item, displayText) {
    const t = displayText || ''

    if (t === '今日完成' || t === '今日已完成') return 'tag-today-done'
    if (t === '今日服务中') return 'tag-today-serving'
    if (t === '进行中') return 'tag-in-progress'
    if (t === '待托托师上门') return 'tag-wait-arrival'
    if (t === '待接单' || t.indexOf('等待') !== -1) return 'tag-pending'
    if (t === '已取消' || item.orderStatus === 'CANCELLED') return 'tag-muted'
    if (t === '已完成' || item.orderStatus === 'COMPLETED') return 'tag-muted'
    if (t === '需平台协助' || item.orderStatus === 'EXCEPTION') return 'tag-muted'

    return 'tag-default'
  },

  applyFilter() {
    const { orders, currentTab, todayFilterOn } = this.data

    const todayOrderCount = orders.filter(
      item => item.hasServiceToday && item.orderStatus !== 'CANCELLED'
    ).length

    let filteredOrders = []
    if (todayFilterOn) {
      filteredOrders = orders
        .filter(item => item.hasServiceToday && item.orderStatus !== 'CANCELLED')
        .sort((a, b) => this.getSortableTime(b) - this.getSortableTime(a))
    } else if (currentTab === 'ALL') {
      filteredOrders = [...orders].sort((a, b) => this.getSortableTime(b) - this.getSortableTime(a))
    } else {
      filteredOrders = orders
        .filter(item => item.sectionKey === currentTab)
        .sort((a, b) => this.getSortableTime(b) - this.getSortableTime(a))
    }

    const sectionDefs =
      currentTab === 'ALL' && !todayFilterOn
        ? ORDER_SECTIONS
        : !todayFilterOn && currentTab !== 'ALL'
          ? ORDER_SECTIONS.filter(item => item.key === currentTab)
          : []

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

    this.setData({ filteredOrders, filteredSections, todayOrderCount })
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
      currentTab: key,
      todayFilterOn: false
    }, () => {
      this.applyFilter()
    })
  },

  toggleTodayStrip() {
    const on = !this.data.todayFilterOn
    if (on) {
      const prev = this.data.currentTab || 'ALL'
      this.setData(
        {
          tabBeforeTodayFilter: prev,
          todayFilterOn: true,
          currentTab: 'ALL',
          collapsedSections: {}
        },
        () => {
          this.applyFilter()
        }
      )
    } else {
      const back = this.data.tabBeforeTodayFilter || 'ALL'
      this.setData(
        {
          todayFilterOn: false,
          currentTab: back
        },
        () => {
          this.applyFilter()
        }
      )
    }
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

    const date = new Date(String(dateStr).replace(/-/g, '/'))
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

  getOrderListBadge(item) {
    if (item.todayServiceLabel) return this.normalizeOrderBadgeText(item.todayServiceLabel)
    return this.getListOrderStatusFallback(item)
  },

  normalizeOrderBadgeText(text) {
    const t = String(text || '')

    if (t === '今日已完成' || t === '今日服务已完成') return '今日完成'

    return t
  },

  getListOrderStatusFallback(item) {
    const s = item.orderStatus || ''

    if (s === 'CANCELLED') return '已取消'
    if (s === 'COMPLETED') return '已完成'
    if (s === 'EXCEPTION') return '需平台协助'
    if (s === 'WAIT_TAKING') return '待接单'
    if (isInProgressOrderStatus(s)) return '进行中'

    return '处理中'
  },

  formatNextService(item, displayText) {
    const badgeText = this.normalizeOrderBadgeText(displayText || item.todayServiceLabel || '')

    if (badgeText !== '今日完成') {
      return ''
    }

    const nextDate = this.getNextFutureServiceDate(item)
    if (!nextDate) {
      return ''
    }

    return `下次服务时间：${this.formatServiceDate(nextDate)}`
  },

  getNextFutureServiceDate(item) {
    const todayKey = this.getTodayKey()
    const dates = []

    const pushDate = (value) => {
      if (!value) return

      if (typeof value === 'string') {
        const key = this.normalizeDateKey(value)
        if (key) dates.push(key)
        return
      }

      if (Array.isArray(value)) {
        value.forEach(pushDate)
        return
      }

      if (typeof value === 'object') {
        const keys = [
          'serviceDate',
          'date',
          'startDate',
          'visitDate',
          'nextServiceDate',
          'nextPendingServiceDate'
        ]

        keys.forEach(key => {
          if (value[key]) pushDate(value[key])
        })
      }
    }

    pushDate(item.nextPendingServiceDate)
    pushDate(item.nextServiceDate)
    pushDate(item.nextServiceTime)
    pushDate(item.nextServiceDateTime)
    pushDate(item.nextVisitDate)
    pushDate(item.serviceDates)
    pushDate(item.serviceDateList)
    pushDate(item.schedules)
    pushDate(item.serviceSchedules)

    const futureDates = dates
      .filter(date => date && date > todayKey)
      .sort((a, b) => (a > b ? 1 : -1))

    return futureDates[0] || ''
  },

  normalizeDateKey(value) {
    if (!value) return ''
    return String(value).replace(/\//g, '-').slice(0, 10)
  },

  getTodayKey() {
    const t = new Date()
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`
  },

  isServiceDateTodayOrBefore(dateStr) {
    const key = String(dateStr).slice(0, 10)
    return key <= this.getTodayKey()
  },

  formatServiceMeta(item) {
    const count = Number(item.serviceDateCount || 0)
    const duration = Number(item.serviceDurationMinutes || 0)
    const parts = []

    if (count > 0) parts.push(`共${count}次服务`)
    if (duration > 0) parts.push(`${duration}分钟/次`)

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

  getProgressPercent(item) {
    const completed = Number(item.completedServiceCount || 0)
    const total = Number(item.serviceDateCount || 0)

    if (!total) return 0

    return Math.min(100, Math.round((completed / total) * 100))
  },

  getSectionKey(status) {
    if (isInProgressOrderStatus(status)) return 'IN_PROGRESS'
    return status || 'WAIT_TAKING'
  },

  getPrimaryActionText(status) {
    const sectionKey = this.getSectionKey(status)
    const map = {
      WAIT_TAKING: '查看详情',
      IN_PROGRESS: '查看进度',
      COMPLETED: '查看详情',
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
      IN_PROGRESS: '补充备注',
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

  goBack() {
    const pages = getCurrentPages ? getCurrentPages() : []

    if (pages.length > 1) {
      wx.navigateBack({
        delta: 1
      })
    }
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

    if (sectionKey === 'IN_PROGRESS') {
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