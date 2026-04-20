const { request } = require('../../utils/request')

Page({
  data: {
    userId: 1,
    from: '',
    addressList: [],
    selectedAddressId: null
  },

  onLoad(options) {
    const currentUser = wx.getStorageSync('currentUser') || { id: 1 }
    const selectedAddress = wx.getStorageSync('selectedServiceAddress')

    this.setData({
      userId: currentUser.id,
      from: options.from || '',
      selectedAddressId: selectedAddress ? selectedAddress.id : null
    })
  },

  onShow() {
    this.loadAddressList()
  },

  navigateBack() {
    const pages = getCurrentPages()

    if (pages.length > 1) {
      wx.navigateBack({
        delta: 1,
        fail: () => {
          if (this.data.from === 'orderCreate') {
            wx.reLaunch({
              url: '/pages/order-create/index'
            })
          } else {
            wx.switchTab({
              url: '/pages/profile/index'
            })
          }
        }
      })
    } else {
      if (this.data.from === 'orderCreate') {
        wx.reLaunch({
          url: '/pages/order-create/index'
        })
      } else {
        wx.switchTab({
          url: '/pages/profile/index'
        })
      }
    }
  },

  loadAddressList() {
    request(`/api/address/list?userId=${this.data.userId}`, 'GET')
      .then((list) => {
        this.setData({
          addressList: list || []
        })
      })
      .catch(() => {})
  },

  chooseAddress(e) {
    const item = e.currentTarget.dataset.item
    if (!item) return

    wx.setStorageSync('selectedServiceAddress', item)

    wx.showToast({
      title: '已选择地址',
      icon: 'success'
    })

    setTimeout(() => {
      this.navigateBack()
    }, 400)
  },

  addAddress() {
    wx.navigateTo({
      url: '/pages/address-edit/index'
    })
  },

  editAddress(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/address-edit/index?id=${id}`
    })
  },

  setDefault(e) {
    const id = e.currentTarget.dataset.id

    request('/api/address/set-default', 'POST', {
      id,
      userId: this.data.userId
    }).then(() => {
      wx.showToast({
        title: '默认地址已更新',
        icon: 'success'
      })
      this.loadAddressList()
    })
  },

  deleteAddress(e) {
    const id = e.currentTarget.dataset.id

    wx.showModal({
      title: '提示',
      content: '确认删除这个地址吗？',
      success: (res) => {
        if (!res.confirm) return

        request('/api/address/delete', 'POST', {
          id,
          userId: this.data.userId
        }).then(() => {
          wx.showToast({
            title: '删除成功',
            icon: 'success'
          })
          this.loadAddressList()
        })
      }
    })
  }
})