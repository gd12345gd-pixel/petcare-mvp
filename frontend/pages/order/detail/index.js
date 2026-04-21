Page({
  data: {
    order: {
      orderNo: 'MH202604210001',
      unitPrice: '59.00',
      suggestedUnitPrice: '59.00',
      serviceCount: 3,
      totalPrice: '177.00',
      timeSlotText: '09:00-12:00、15:00-18:00',
      durationMinutes: 40,
      address: {
        contactName: '张女士',
        phone: '138 **** 1234',
        fullText: '望京小区1号楼2单元1202'
      },
      pets: [
        { id: 1, name: '布丁', typeText: '猫咪', ageText: '1岁', weightText: '4kg' },
        { id: 2, name: '糖糖', typeText: '狗狗', ageText: '3岁', weightText: '8kg' }
      ],
      remark: '猫粮在柜子第二层，胆子小，先轻声叫它名字，吃完后补充净水。',
      scheduleList: [
        { date: '2026-04-20', displayDate: '04/20 周六', timeSlotText: '09:00-12:00、15:00-18:00', statusText: '待服务' },
        { date: '2026-04-21', displayDate: '04/21 周日', timeSlotText: '09:00-12:00、15:00-18:00', statusText: '待服务' },
        { date: '2026-04-22', displayDate: '04/22 周一', timeSlotText: '09:00-12:00、15:00-18:00', statusText: '待服务' }
      ]
    }
  },

  goBack() {
    wx.navigateBack({ delta: 1 })
  }
})