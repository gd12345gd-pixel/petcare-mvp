const {
  request
} = require('../../utils/request');
Page({
  data: {
    id: null,
    service: null,
    records: [],
    reviews: []
  },
  onLoad(options) {
    this.setData({
      id: options.id
    });
    this.loadDetail(options.id);
  },
  async loadDetail(id) {
    const data = await request(`/api/services/${id}`);
    this.setData({
      service: data.service,
      records: data.records || [],
      reviews: data.reviews || []
    });
  },
  goOrder() {
    wx.navigateTo({
      url: `/pages/order/create/index?serviceId=${this.data.id}`
    });
  },
  goTestUpload() {
    wx.navigateTo({
      url: '/pages/service-record-upload/index?orderId=1&orderNo=PC202603300001&serviceDate=2026-03-30&timeSlot=09:30-10:00'
    })
  }
});