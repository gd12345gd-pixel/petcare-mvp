const {
  request
} = require('../../utils/request');
const { ensureLogin } = require('../../utils/auth')
Page({
  data: {
    orders: [],
    records: [],
    recordPopup: false,
    statusTextMap: {
      PENDING: '待确认',
      CONFIRMED: '已确认',
      IN_SERVICE: '服务中',
      COMPLETED: '已完成',
      CANCELED: '已取消'
    }
  },
  onShow() {
    this.loadOrders();
  },
  async loadOrders() {
    const currentUser = ensureLogin()
    if (!currentUser.id) return
    const orders = await request(`/api/orders/list?userId=${currentUser.id}`);
    this.setData({
      orders
    });
  },
  async viewRecords(e) {
    const records = await request(`/api/service-record/listByOrder?orderId=${e.currentTarget.dataset.id}`);
    this.setData({
      records,
      recordPopup: true
    });
  },
  closePopup() {
    this.setData({
      recordPopup: false
    });
  },
  goRecordDetail(e) {
    const item = e.currentTarget.dataset.item
    const orderId = item.id
    const orderNo = item.orderNo || ''
    const serviceDate = item.serviceDate || ''
    const timeSlot = item.timeSlot || ''
  
    wx.navigateTo({
      url: `/pages/service-record-detail/index?orderId=${orderId}&orderNo=${orderNo}&serviceDate=${serviceDate}&timeSlot=${timeSlot}`
    })
  },
  noop() {}
});
