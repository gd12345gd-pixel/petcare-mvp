const { request, BASE_URL } = require('../../utils/request')
const { QQMAP_KEY } = require('../../utils/qqmap-config')

Page({
  data: {
    petTypeOptions: ['狗狗', '猫咪', '其他'],
    petTypeIndex: 0,

    form: {
      petName: '',
      petType: '狗狗',
      imageUrl: '',

      province: '',
      city: '',
      district: '',
      regionText: '',
      latitude: null,
      longitude: null,
      detailAddress: '',

      startDate: '',
      endDate: '',
      serviceFee: '',

      description: '',
      specialRequirement: ''
    },

    uploading: false,
    submitting: false
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field
    const value = e.detail.value
    this.setData({
      [`form.${field}`]: value
    })
  },

  choosePetType(e) {
    const index = Number(e.currentTarget.dataset.index)
    const type = this.data.petTypeOptions[index]
    this.setData({
      petTypeIndex: index,
      'form.petType': type
    })
  },

  chooseImage() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      success: (res) => {
        const tempPath = res.tempFiles[0].tempFilePath
        this.uploadImage(tempPath)
      }
    })
  },

  uploadImage(filePath) {
    this.setData({ uploading: true })
    wx.showLoading({ title: '上传图片中' })

    wx.uploadFile({
      url: `${BASE_URL}/api/files/upload-image`,
      filePath,
      name: 'file',
      success: (res) => {
        try {
          const data = JSON.parse(res.data)
          if (data.code === 0) {
            this.setData({
              'form.imageUrl': data.data.url
            })
            wx.showToast({
              title: '图片上传成功',
              icon: 'success'
            })
          } else {
            wx.showToast({
              title: data.message || '图片上传失败',
              icon: 'none'
            })
          }
        } catch (e) {
          wx.showToast({
            title: '上传返回解析失败',
            icon: 'none'
          })
        }
      },
      fail: () => {
        wx.showToast({
          title: '图片上传失败',
          icon: 'none'
        })
      },
      complete: () => {
        this.setData({ uploading: false })
        wx.hideLoading()
      }
    })
  },

  chooseRegionByMap() {
    wx.chooseLocation({
      success: (res) => {
        const latitude = res.latitude
        const longitude = res.longitude
        this.setData({
          'form.latitude': latitude,
          'form.longitude': longitude
        })
        this.reverseGeocode(latitude, longitude)
      },
      fail: (err) => {
        console.error('chooseLocation fail:', err)
        wx.showToast({
          title: '请选择地图位置',
          icon: 'none'
        })
      }
    })
  },

  reverseGeocode(latitude, longitude) {
    wx.showLoading({ title: '解析地区中' })

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
        } else {
          wx.showToast({
            title: (data && data.message) || '地区解析失败',
            icon: 'none'
          })
        }
      },
      fail: () => {
        wx.showToast({
          title: '地区解析失败',
          icon: 'none'
        })
      },
      complete: () => {
        wx.hideLoading()
      }
    })
  },

  bindStartDateChange(e) {
    this.setData({
      'form.startDate': e.detail.value
    })
  },

  bindEndDateChange(e) {
    this.setData({
      'form.endDate': e.detail.value
    })
  },

  validateForm() {
    const { form } = this.data

    if (!form.petName) {
      wx.showToast({ title: '请输入宠物名字', icon: 'none' })
      return false
    }
    if (!form.imageUrl) {
      wx.showToast({ title: '请上传宠物照片', icon: 'none' })
      return false
    }
    if (!form.regionText) {
      wx.showToast({ title: '请选择所在地区', icon: 'none' })
      return false
    }
    if (!form.detailAddress) {
      wx.showToast({ title: '请输入详细地址', icon: 'none' })
      return false
    }
    if (!form.startDate) {
      wx.showToast({ title: '请选择开始日期', icon: 'none' })
      return false
    }
    if (!form.endDate) {
      wx.showToast({ title: '请选择结束日期', icon: 'none' })
      return false
    }
    if (!form.serviceFee) {
      wx.showToast({ title: '请输入服务费用', icon: 'none' })
      return false
    }
    if (!form.description) {
      wx.showToast({ title: '请填写详细描述', icon: 'none' })
      return false
    }

    return true
  },

  submitPublish() {
    if (!this.validateForm()) return
    if (this.data.submitting) return

    const currentUser = wx.getStorageSync('currentUser') || { id: 1 }
    const { form } = this.data

    this.setData({ submitting: true })
    wx.showLoading({ title: '提交中' })

    request('/api/demand/publish', 'POST', {
      userId: currentUser.id,
      petName: form.petName,
      petType: form.petType,
      imageUrl: form.imageUrl,

      province: form.province,
      city: form.city,
      district: form.district,
      latitude: form.latitude,
      longitude: form.longitude,
      detailAddress: form.detailAddress,

      startDate: form.startDate,
      endDate: form.endDate,
      serviceFee: form.serviceFee,

      description: form.description,
    }).then(() => {
      wx.hideLoading()
      wx.showToast({
        title: '发布成功',
        icon: 'success'
      })
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