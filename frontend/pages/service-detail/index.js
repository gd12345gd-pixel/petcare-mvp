const { ensureLogin } = require('../../utils/auth')

Page({
  data: {
    activeTab: 'detail',
    careItems: [
      '按备注给宠物放粮、罐头或零食',
      '更换饮用水，清洁食具',
      '清理猫砂、尿垫或狗狗活动区',
      '观察宠物精神、饮食和排便状态',
      '服务结束后上传图片/视频和服务报告'
    ],
    flowItems: [
      { title: '专属沟通', desc: '下单后平台根据地址、时间和宠物情况分配托托师，必要时客服会协助确认。' },
      { title: '上门前确认', desc: '托托师会核对宠物数量、上门地址、门禁和钥匙等信息。' },
      { title: '照护执行', desc: '按订单备注完成喂食、换水、清洁、遛狗、陪伴等服务。' },
      { title: '过程记录', desc: '服务中可上传图片或视频，服务完成后形成可查看的服务记录。' },
      { title: '报告回传', desc: '反馈宠物状态、环境状态和异常情况，方便主人安心追踪。' }
    ],
    notices: [
      '请提前填写真实地址、联系人、宠物档案和服务备注，便于托托师准确上门。',
      '如需喂药、特殊清洁或额外照护，请在备注中写清楚，平台会尽量协助确认。',
      '服务开始前可在订单详情查看进度；取消或修改时间请尽早处理，避免影响托托师排班。',
      '请确认宠物健康状态稳定，无攻击性或严重传染性疾病等不适合上门照护的情况。'
    ]
  },

  switchTab(e) {
    const tab = e.currentTarget.dataset.tab
    if (!tab || tab === this.data.activeTab) return
    this.setData({ activeTab: tab })
  },

  goOrder() {
    if (!ensureLogin().id) return
    wx.navigateTo({
      url: '/pages/order/create/index'
    })
  }
})
