const { request } = require('../../utils/request')
const { QQMAP_KEY } = require('../../utils/qqmap-config')

Page({
  data: {
    userId: 1,
    id: null,
    isEdit: false,
    tagOptions: ['家', '公司', '学校'],

    form: {
      contactName: '',
      contactPhone: '',
      gender: '',
      province: '',
      city: '',
      district: '',
      regionText: '',
      addressName: '',
      addressText: '',
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
            gender: '',
            province: data.province || '',
            city: data.city || '',
            district: data.district || '',
            regionText: `${data.province || ''} ${data.city || ''} ${data.district || ''}`.trim(),
            addressName: data.detailAddress || data.fullAddress || '',
            addressText: `${data.province || ''}${data.city || ''}${data.district || ''}`,
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

  pasteAddress() {
    wx.getClipboardData({
      success: (res) => {
        const text = (res.data || '').trim()
        if (!text) {
          wx.showToast({ title: '剪贴板没有地址信息', icon: 'none' })
          return
        }
        this.parseClipboardAddress(text)
      }
    })
  },

  parseClipboardAddress(text) {
    const phoneMatch = text.match(/1[3-9]\d{9}/)
    const phone = phoneMatch ? phoneMatch[0] : ''
    const textWithoutPhone = phone ? text.replace(phone, ' ') : text
    const compact = textWithoutPhone.replace(/\s+/g, ' ').trim()
    const parts = compact.split(/[，,；;]+/).map(item => item.trim()).filter(Boolean)
    const detail = parts[0] || compact

    this.setData({
      'form.contactPhone': phone || this.data.form.contactPhone,
      'form.detailAddress': detail || this.data.form.detailAddress,
      'form.addressName': detail || this.data.form.addressName
    })

    wx.showToast({ title: '已识别地址信息', icon: 'success' })
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
        const name = res.name || ''
        const address = res.address || ''

        this.setData({
          'form.latitude': latitude,
          'form.longitude': longitude,
          'form.addressName': name || address,
          'form.addressText': address
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
            'form.regionText': `${ac.province || ''} ${ac.city || ''} ${ac.district || ''}`.trim(),
            'form.addressText': data.result.address || this.data.form.addressText
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

  chooseGender(e) {
    const gender = e.currentTarget.dataset.gender || ''
    this.setData({ 'form.gender': gender })
  },

  chooseTag(e) {
    const tag = e.currentTarget.dataset.tag || ''
    this.setData({ 'form.tagName': tag })
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
      wx.showToast({ title: '请选择地址', icon: 'none' })
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

    const detailAddress = form.detailAddress || form.addressName

    const payload = {
      userId,
      contactName: form.contactName,
      contactPhone: form.contactPhone,
      province: form.province,
      city: form.city,
      district: form.district,
      detailAddress,
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
