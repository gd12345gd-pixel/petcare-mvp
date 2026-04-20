Page({
  data: {},

  goMyPets() {
    wx.navigateTo({
      url: '/pages/pet-list/index'
    })
  },
  goAddressList() {
    wx.navigateTo({
      url: '/pages/address-list/index?from=profile'
    })
  },
  goMyOrders() {
    wx.navigateTo({
      url: '/pages/orders/index'
    })
  }
})