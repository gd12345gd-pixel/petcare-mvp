Page({
  data: {},

  goMyPets() {
    wx.navigateTo({
      url: '/pages/pet-list/index'
    })
  },

  goMyOrders() {
    wx.navigateTo({
      url: '/pages/orders/index'
    })
  }
})