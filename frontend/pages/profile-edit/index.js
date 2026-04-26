const { request, BASE_URL, resolveUploadedMediaUrl } = require('../../utils/request')
const { ensureLogin, getCurrentUser, getToken } = require('../../utils/auth')

Page({
  data: {
    saving: false,
    uploading: false,
    form: {
      avatarUrl: '',
      nickname: '',
      phone: ''
    }
  },

  onLoad() {
    const user = ensureLogin()
    if (!user.id) return
    this.setData({
      form: {
        avatarUrl: resolveUploadedMediaUrl(user.avatarUrl || '') || '',
        nickname: user.nickname || '',
        phone: user.phone || ''
      }
    })
  },

  navigateBack() {
    const pages = getCurrentPages()
    if (pages.length > 1) {
      wx.navigateBack({ delta: 1 })
      return
    }
    wx.switchTab({ url: '/pages/profile/index' })
  },

  onChooseAvatar(e) {
    const avatarUrl = e.detail && e.detail.avatarUrl
    if (!avatarUrl) return
    this.uploadAvatar(avatarUrl)
  },

  uploadAvatar(filePath) {
    const token = getToken()
    if (!token) return

    this.setData({ uploading: true })
    wx.uploadFile({
      url: `${BASE_URL}/api/files/upload-image`,
      filePath,
      name: 'file',
      header: { Authorization: `Bearer ${token}` },
      success: (res) => {
        try {
          const data = JSON.parse(res.data || '{}')
          if (data.code === 0 && data.data && data.data.url) {
            this.setData({ 'form.avatarUrl': resolveUploadedMediaUrl(data.data.url) })
            return
          }
          wx.showToast({ title: data.message || '头像上传失败', icon: 'none' })
        } catch (err) {
          wx.showToast({ title: '头像上传失败', icon: 'none' })
        }
      },
      fail: () => {
        wx.showToast({ title: '头像上传失败', icon: 'none' })
      },
      complete: () => {
        this.setData({ uploading: false })
      }
    })
  },

  onNicknameInput(e) {
    this.setData({ 'form.nickname': e.detail.value })
  },

  onPhoneInput(e) {
    this.setData({ 'form.phone': e.detail.value })
  },

  saveProfile() {
    if (this.data.saving) return
    const form = this.data.form
    if (!form.nickname) {
      wx.showToast({ title: '请填写昵称', icon: 'none' })
      return
    }

    this.setData({ saving: true })
    request('/api/auth/profile', 'POST', form)
      .then((user) => {
        wx.setStorageSync('currentUser', user)
        wx.showToast({ title: '已保存', icon: 'success' })
        setTimeout(() => this.navigateBack(), 500)
      })
      .finally(() => {
        this.setData({ saving: false })
      })
  }
})
