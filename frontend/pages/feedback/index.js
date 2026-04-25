const { request } = require('../../utils/request')
const { ensureLogin, getCurrentUser } = require('../../utils/auth')

Page({
  data: {
    submitting: false,
    typeIndex: 0,
    typeOptions: [
      { value: 'ORDER', label: '订单问题' },
      { value: 'SITTER', label: '接单师/服务问题' },
      { value: 'PAYMENT', label: '支付/退款问题' },
      { value: 'PRODUCT', label: '功能建议' },
      { value: 'OTHER', label: '其他问题' }
    ],
    form: {
      content: '',
      contactPhone: '',
      orderNo: ''
    }
  },

  onLoad() {
    const user = ensureLogin()
    if (!user.id) return
    const currentUser = getCurrentUser() || {}
    this.setData({
      'form.contactPhone': currentUser.phone || ''
    })
  },

  onTypeChange(e) {
    this.setData({
      typeIndex: Number(e.detail.value || 0)
    })
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field
    if (!field) return
    this.setData({
      [`form.${field}`]: e.detail.value
    })
  },

  submitFeedback() {
    if (this.data.submitting) return
    const form = this.data.form
    if (!form.content || form.content.trim().length < 5) {
      wx.showToast({
        title: '请至少填写5个字的问题描述',
        icon: 'none'
      })
      return
    }

    const type = this.data.typeOptions[this.data.typeIndex] || this.data.typeOptions[0]
    this.setData({ submitting: true })
    request('/api/feedback', 'POST', {
      feedbackType: type.value,
      content: form.content,
      contactPhone: form.contactPhone,
      orderNo: form.orderNo
    }).then(() => {
      wx.showToast({
        title: '反馈已提交',
        icon: 'success'
      })
      setTimeout(() => {
        wx.navigateBack({
          delta: 1,
          fail: () => wx.switchTab({ url: '/pages/profile/index' })
        })
      }, 600)
    }).finally(() => {
      this.setData({ submitting: false })
    })
  }
})
