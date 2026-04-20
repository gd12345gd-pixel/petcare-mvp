const { request } = require('../../utils/request')
const { QQMAP_KEY } = require('../../utils/qqmap-config')

Page({
  data: {
    userId: 1,
    id: null,
    isEdit: false,

    form: {
      contactName: '',
      contactPhone: '',
      province: '',
      city: '',
      district: '',
      regionText: '',
      detailAddress: '',
      latitude: null,
      longitude: null,
      tagName: '',
      isDefault: 0
    }
  },

  onLoad(options) {
    const currentUser = wx.getStorageSync('currentUser') || { id: 1 }
    const id = options.id ? Number(options.id) : null

    this.setData({
      userId: currentUser.id,
      id,
      isEdit: !!id
    })

    if (id) {
      this.loadDetail(id)
    }
  },

  navigateBack() {
    const pages = getCurrentPages()

    if (pages.length > 1) {
      wx.navigateBack({
        delta: 1,
        fail: () => {
          wx.reLaunch({
            url: '/pages/address-list/index'
          })
        }
      })
    } else {
      wx.reLaunch({
        url: '/pages/address-list/index'
      })
    }
  },

  loadDetail(id) {
    request(`/api/address/detail?id=${id}`, 'GET')
      .then((data) => {
        this.setData({
          form: {
            contactName: data.contactName || '',
            contactPhone: data.contactPhone || '',
            province: data.province || '',
            city: data.city || '',
            district: data.district || '',
            regionText: `${data.province || ''} ${data.city || ''} ${data.district || ''}`.trim(),
            detailAddress: data.detailAddress || '',
            latitude: data.latitude || null,
            longitude: data.longitude || null,
            tagName: data.tagName || '',
            isDefault: data.isDefault || 0
          }
        })
      })
      .catch(() => {})
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field
    const value = e.detail.value
    this.setData({
      [`form.${field}`]: value
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
      fail: () => {
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
            title: '地区解析失败',
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

  switchDefault(e) {
    this.setData({
      'form.isDefault': e.detail.value ? 1 : 0
    })
  },

  validateForm() {
    const { form } = this.data

    if (!form.contactName) {
      wx.showToast({ title: '请输入联系人', icon: 'none' })
      return false
    }
    if (!form.contactPhone) {
      wx.showToast({ title: '请输入联系电话', icon: 'none' })
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

    return true
  },

  saveAddress() {
    if (!this.validateForm()) return

    const { form, userId, isEdit, id } = this.data

    const payload = {
      userId,
      contactName: form.contactName,
      contactPhone: form.contactPhone,
      province: form.province,
      city: form.city,
      district: form.district,
      detailAddress: form.detailAddress,
      latitude: form.latitude,
      longitude: form.longitude,
      tagName: form.tagName,
      isDefault: form.isDefault
    }

    if (isEdit) {
      payload.id = id
    }

    request(isEdit ? '/api/address/update' : '/api/address/create', 'POST', payload)
      .then(() => {
        wx.showToast({
          title: isEdit ? '修改成功' : '新增成功',
          icon: 'success'
        })
        setTimeout(() => {
          this.navigateBack()
        }, 500)
      })
      .catch(() => {})
  }
})