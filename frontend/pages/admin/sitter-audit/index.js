const { request } = require('../../../utils/request')
const { ensureLogin } = require('../../../utils/auth')

Page({
  data: {
    loading: true,
    list: [],
    selected: null,
    rejectReason: '',
    currentStatus: 'PENDING',
    statusTabs: [
      { key: 'PENDING', label: '待审核' },
      { key: 'APPROVED', label: '已通过' },
      { key: 'REJECTED', label: '已拒绝' }
    ]
  },

  onLoad() {
    if (!ensureLogin().id) return
    this.loadList()
  },

  loadList() {
    this.setData({ loading: true })
    request(`/api/admin/sitters?auditStatus=${this.data.currentStatus}`, 'GET')
      .then((list) => {
        this.setData({
          list: list || [],
          selected: null,
          rejectReason: ''
        })
      })
      .finally(() => {
        this.setData({ loading: false })
      })
  },

  switchStatus(e) {
    const key = e.currentTarget.dataset.key
    if (!key || key === this.data.currentStatus) return
    this.setData({ currentStatus: key }, () => this.loadList())
  },

  selectItem(e) {
    const id = Number(e.currentTarget.dataset.id)
    const selected = this.data.list.find(item => item.id === id)
    this.setData({
      selected,
      rejectReason: selected && selected.rejectReason ? selected.rejectReason : ''
    })
  },

  previewImage(e) {
    const url = e.currentTarget.dataset.url
    if (!url) return
    wx.previewImage({
      urls: [url],
      current: url
    })
  },

  onRejectReasonInput(e) {
    this.setData({ rejectReason: e.detail.value })
  },

  approve() {
    const selected = this.data.selected
    if (!selected) return
    wx.showModal({
      title: '确认通过',
      content: `确认通过 ${selected.realName || '该用户'} 的接单师申请？`,
      success: (res) => {
        if (!res.confirm) return
        request(`/api/admin/sitters/${selected.id}/approve`, 'POST').then(() => {
          wx.showToast({ title: '已通过', icon: 'success' })
          this.loadList()
        })
      }
    })
  },

  reject() {
    const selected = this.data.selected
    if (!selected) return
    if (!this.data.rejectReason) {
      wx.showToast({ title: '请填写拒绝原因', icon: 'none' })
      return
    }
    wx.showModal({
      title: '确认拒绝',
      content: `确认拒绝 ${selected.realName || '该用户'} 的接单师申请？`,
      success: (res) => {
        if (!res.confirm) return
        request(`/api/admin/sitters/${selected.id}/reject`, 'POST', {
          rejectReason: this.data.rejectReason
        }).then(() => {
          wx.showToast({ title: '已拒绝', icon: 'success' })
          this.loadList()
        })
      }
    })
  }
})
