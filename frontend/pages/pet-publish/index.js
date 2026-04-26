const { ensureLogin, getToken } = require('../../utils/auth')
const { request, BASE_URL, resolveUploadedMediaUrl } = require('../../utils/request')
const { QQMAP_KEY } = require('../../utils/qqmap-config')

Page({
  data: {
    activeType: 'lost',
    form: {
      petName: '',
      breed: '',
      imageUrl: '',
      province: '',
      city: '',
      district: '',
      regionText: '',
      location: '',
      latitude: null,
      longitude: null,
      time: '',
      contact: '',
      reward: '',
      tempCare: false,
      desc: ''
    },
    timeDate: '',
    timeClock: '',
    uploading: false,
    submitting: false
  },

  onLoad(options = {}) {
    if (options.type === 'found' || options.type === 'lost') {
      this.setData({ activeType: options.type })
    }
  },

  switchType(e) {
    this.setData({
      activeType: e.currentTarget.dataset.type || 'lost'
    })
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field
    this.setData({
      [`form.${field}`]: e.detail.value
    })
  },

  chooseImage() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      success: (res) => {
        const tempPath = res.tempFiles && res.tempFiles[0] && res.tempFiles[0].tempFilePath
        if (tempPath) {
          this.uploadImage(tempPath)
        }
      }
    })
  },

  uploadImage(filePath) {
    this.setData({ uploading: true })
    wx.showLoading({ title: '上传中' })

    wx.uploadFile({
      url: `${BASE_URL}/api/files/upload-image`,
      filePath,
      name: 'file',
      header: getToken() ? { Authorization: `Bearer ${getToken()}` } : {},
      success: (res) => {
        try {
          const data = JSON.parse(res.data || '{}')
          if (data.code === 0 && data.data && data.data.url) {
            this.setData({
              'form.imageUrl': resolveUploadedMediaUrl(data.data.url)
            })
            wx.showToast({ title: '上传成功', icon: 'success' })
          } else {
            wx.showToast({
              title: data.message || '上传失败',
              icon: 'none'
            })
          }
        } catch (err) {
          wx.showToast({ title: '上传失败', icon: 'none' })
        }
      },
      fail: () => {
        wx.showToast({ title: '上传失败', icon: 'none' })
      },
      complete: () => {
        this.setData({ uploading: false })
        wx.hideLoading()
      }
    })
  },

  chooseLocation() {
    wx.chooseLocation({
      success: (res) => {
        const latitude = res.latitude
        const longitude = res.longitude
        this.setData({
          'form.latitude': latitude,
          'form.longitude': longitude,
          'form.location': res.address || res.name || ''
        })
        this.reverseGeocode(latitude, longitude)
      },
      fail: (err) => {
        console.error('chooseLocation fail:', err)
        wx.showToast({ title: '请选择地点', icon: 'none' })
      }
    })
  },

  onDateChange(e) {
    this.setData({ timeDate: e.detail.value }, () => {
      this.syncTimeText()
    })
  },

  onClockChange(e) {
    this.setData({ timeClock: e.detail.value }, () => {
      this.syncTimeText()
    })
  },

  syncTimeText() {
    if (!this.data.timeDate || !this.data.timeClock) return
    this.setData({
      'form.time': `${this.data.timeDate} ${this.data.timeClock}:00`
    })
  },

  reverseGeocode(latitude, longitude) {
    wx.request({
      url: 'https://apis.map.qq.com/ws/geocoder/v1/',
      method: 'GET',
      data: {
        location: `${latitude},${longitude}`,
        key: QQMAP_KEY
      },
      success: (res) => {
        const data = res.data
        if (data && data.status === 0 && data.result) {
          const ac = data.result.address_component || {}
          this.setData({
            'form.province': ac.province || '',
            'form.city': ac.city || '',
            'form.district': ac.district || '',
            'form.regionText': `${ac.province || ''} ${ac.city || ''} ${ac.district || ''}`.trim()
          })
        }
      }
    })
  },

  toggleTempCare() {
    this.setData({
      'form.tempCare': !this.data.form.tempCare
    })
  },

  validateForm() {
    const { form, activeType } = this.data

    if (activeType === 'lost' && !form.petName) {
      wx.showToast({ title: '请填写宠物名称', icon: 'none' })
      return false
    }
    if (!form.imageUrl) {
      wx.showToast({ title: '请上传宠物照片', icon: 'none' })
      return false
    }
    if (!form.location) {
      wx.showToast({ title: '请选择地点', icon: 'none' })
      return false
    }
    if (!form.time) {
      wx.showToast({ title: '请选择时间', icon: 'none' })
      return false
    }
    if (!form.contact) {
      wx.showToast({ title: '请填写联系方式', icon: 'none' })
      return false
    }

    return true
  },

  submitPublish() {
    if (!this.validateForm() || this.data.submitting) return

    const currentUser = ensureLogin()
    const { form, activeType } = this.data
    const isLost = activeType === 'lost'
    const api = isLost ? '/api/pet-community/lost' : '/api/pet-community/found'
    const payload = {
      userId: currentUser.id,
      petName: form.petName,
      breed: form.breed,
      imageUrl: form.imageUrl,
      contact: form.contact,
      description: form.desc,
      latitude: form.latitude,
      longitude: form.longitude,
      district: form.district
    }

    if (isLost) {
      payload.lostLocation = form.location
      payload.lostTime = form.time
      payload.rewardAmount = form.reward
    } else {
      payload.foundLocation = form.location
      payload.foundTime = form.time
      payload.tempCare = form.tempCare
    }

    this.setData({ submitting: true })
    wx.showLoading({ title: '发布中' })

    request(api, 'POST', payload).then(() => {
      wx.hideLoading()
      wx.showToast({ title: '发布成功', icon: 'success' })
      setTimeout(() => {
        wx.navigateBack()
      }, 800)
    }).catch(() => {
      wx.hideLoading()
    }).finally(() => {
      this.setData({ submitting: false })
    })
  }
})
