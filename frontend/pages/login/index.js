const { request, BASE_URL } = require('../../utils/request')
const { getToken } = require('../../utils/auth')

Page({
  data: {
    step: 'login',
    loading: false,
    saving: false,
    uploading: false,
    returnUrl: '',
    agreementChecked: false,
    profileForm: {
      avatarUrl: '',
      nickname: '',
      phone: ''
    }
  },

  onLoad(options) {
    this.setData({
      returnUrl: options && options.returnUrl ? decodeURIComponent(options.returnUrl) : ''
    })
  },

  handleWechatLogin() {
    if (this.data.loading) return
    if (!this.data.agreementChecked) {
      wx.showToast({ title: '请先阅读并同意用户协议', icon: 'none' })
      return
    }

    this.setData({ loading: true })

    wx.login({
      success: (loginRes) => {
        if (!loginRes.code) {
          wx.showToast({ title: '获取登录 code 失败', icon: 'none' })
          this.setData({ loading: false })
          return
        }

        request('/api/auth/wechat-login', 'POST', {
          code: loginRes.code,
          deviceInfo: this.getDeviceInfo()
        }).then((data) => {
          wx.setStorageSync('token', data.token)
          wx.setStorageSync('currentUser', data.user)

          if (data.user && data.user.profileCompleted) {
            this.setData({ loading: false })
            this.goBackAfterLogin()
            return
          }

          this.setData({
            loading: false,
            step: 'profile',
            profileForm: {
              avatarUrl: data.user.avatarUrl || '',
              nickname: data.user.nickname && data.user.nickname !== '微信用户' ? data.user.nickname : '',
              phone: data.user.phone || ''
            }
          })
        }).catch(() => {
          this.setData({ loading: false })
        })
      },
      fail: () => {
        wx.showToast({ title: '微信登录失败', icon: 'none' })
        this.setData({ loading: false })
      }
    })
  },

  toggleAgreement() {
    this.setData({
      agreementChecked: !this.data.agreementChecked
    })
  },

  openAgreement(e) {
    const type = e.currentTarget.dataset.type || 'user'
    wx.navigateTo({
      url: `/pages/agreement/index?type=${type}`
    })
  },

  getDeviceInfo() {
    const info = wx.getSystemInfoSync ? wx.getSystemInfoSync() : {}
    return {
      brand: info.brand || '',
      model: info.model || '',
      system: info.system || '',
      platform: info.platform || '',
      sdkVersion: info.SDKVersion || '',
      appVersion: info.version || '',
      rawDeviceInfo: JSON.stringify({
        brand: info.brand,
        model: info.model,
        system: info.system,
        platform: info.platform,
        SDKVersion: info.SDKVersion,
        version: info.version,
        language: info.language
      })
    }
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
            this.setData({
              'profileForm.avatarUrl': data.data.url
            })
          } else {
            wx.showToast({ title: data.message || '头像上传失败', icon: 'none' })
          }
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
    this.setData({
      'profileForm.nickname': e.detail.value
    })
  },

  onPhoneInput(e) {
    this.setData({
      'profileForm.phone': e.detail.value
    })
  },

  saveProfile() {
    if (this.data.saving) return
    const form = this.data.profileForm

    if (!form.nickname) {
      wx.showToast({ title: '请填写昵称', icon: 'none' })
      return
    }

    this.setData({ saving: true })
    request('/api/auth/profile', 'POST', form)
      .then((user) => {
        wx.setStorageSync('currentUser', user)
        wx.showToast({ title: '已保存', icon: 'success' })
        setTimeout(() => this.goBackAfterLogin(), 400)
      })
      .finally(() => {
        this.setData({ saving: false })
      })
  },

  skipProfile() {
    this.goBackAfterLogin()
  },

  goBackAfterLogin() {
    const returnUrl = this.data.returnUrl
    if (returnUrl) {
      wx.redirectTo({
        url: returnUrl,
        fail: () => {
          wx.switchTab({
            url: returnUrl,
            fail: () => wx.switchTab({ url: '/pages/home/index' })
          })
        }
      })
      return
    }

    wx.switchTab({
      url: '/pages/home/index'
    })
  },

  goGuest() {
    wx.switchTab({
      url: '/pages/home/index'
    })
  }
})
