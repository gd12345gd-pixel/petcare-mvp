const { request } = require('../../utils/request')
const { ensureLogin } = require('../../utils/auth')

Page({
  data: {
    loading: true,
    loadError: '',
    notifications: [],
    unreadCount: 0
  },

  onLoad() {
    if (!ensureLogin().id) return
    this.loadNotifications()
  },

  onShow() {
    if (ensureLogin().id) {
      this.loadNotifications()
    }
  },

  loadNotifications() {
    this.setData({ loading: true, loadError: '' })
    Promise.all([
      request('/api/notifications', 'GET', {}, { silent: true }),
      request('/api/notifications/unread-count', 'GET', {}, { silent: true })
    ]).then(([list, unread]) => {
      this.setData({
        notifications: (list || []).map(item => this.formatNotification(item)),
        unreadCount: unread && unread.count ? unread.count : 0
      })
    }).catch((err) => {
      console.error('load notifications error', err)
      this.setData({
        notifications: [],
        unreadCount: 0,
        loadError: '消息服务暂不可用，请稍后再试'
      })
    }).finally(() => {
      this.setData({ loading: false })
    })
  },

  formatNotification(item) {
    return {
      ...item,
      typeText: this.getTypeText(item.noticeType),
      createdAtText: this.formatTime(item.createdAt)
    }
  },

  getTypeText(type) {
    const map = {
      SYSTEM: '系统',
      ORDER: '订单',
      SITTER: '接单师',
      FEEDBACK: '反馈'
    }
    return map[type] || '通知'
  },

  formatTime(value) {
    if (!value) return ''
    const text = String(value).replace('T', ' ')
    return text.length >= 16 ? text.slice(0, 16) : text
  },

  openNotification(e) {
    const id = e.currentTarget.dataset.id
    const item = this.data.notifications.find(notification => notification.id === id)
    if (!item) return

    const markRead = item.readFlag
      ? Promise.resolve(item)
      : request(`/api/notifications/${item.id}/read`, 'POST', {}, { silent: true })

    markRead.then(() => {
      if (item.targetUrl) {
        wx.navigateTo({
          url: item.targetUrl,
          fail: () => wx.switchTab({ url: item.targetUrl })
        })
        return
      }
      this.loadNotifications()
    })
  },

  markAllRead() {
    if (!this.data.unreadCount) return
    request('/api/notifications/read-all', 'POST', {}, { silent: true }).then(() => {
      wx.showToast({
        title: '已全部已读',
        icon: 'success'
      })
      this.loadNotifications()
    }).catch(() => {
      wx.showToast({
        title: '消息服务暂不可用',
        icon: 'none'
      })
    })
  }
})
