const { request, BASE_URL } = require('../../utils/request')
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
    uploading: false,
    submitting: false
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
    wx.showLoading({ title: 'Uploading' })

    wx.uploadFile({
      url: `${BASE_URL}/api/files/upload-image`,
      filePath,
      name: 'file',
      success: (res) => {
        try {
          const data = JSON.parse(res.data || '{}')
          if (data.code === 0 && data.data && data.data.url) {
            this.setData({
              'form.imageUrl': data.data.url
            })
            wx.showToast({ title: 'Uploaded', icon: 'success' })
          } else {
            wx.showToast({
              title: data.message || 'Upload failed',
              icon: 'none'
            })
          }
        } catch (err) {
          wx.showToast({ title: 'Upload failed', icon: 'none' })
        }
      },
      fail: () => {
        wx.showToast({ title: 'Upload failed', icon: 'none' })
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
        wx.showToast({ title: 'Choose location', icon: 'none' })
      }
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
      wx.showToast({ title: 'Pet name required', icon: 'none' })
      return false
    }
    if (!form.imageUrl) {
      wx.showToast({ title: 'Photo required', icon: 'none' })
      return false
    }
    if (!form.location) {
      wx.showToast({ title: 'Location required', icon: 'none' })
      return false
    }
    if (!form.time) {
      wx.showToast({ title: 'Time required', icon: 'none' })
      return false
    }
    if (!form.contact) {
      wx.showToast({ title: 'Contact required', icon: 'none' })
      return false
    }

    return true
  },

  submitPublish() {
    if (!this.validateForm() || this.data.submitting) return

    const currentUser = wx.getStorageSync('currentUser') || { id: 1 }
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
    wx.showLoading({ title: 'Submitting' })

    request(api, 'POST', payload).then(() => {
      wx.hideLoading()
      wx.showToast({ title: 'Published', icon: 'success' })
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
