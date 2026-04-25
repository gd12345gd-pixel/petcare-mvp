Page({
  data: {
    activeCategory: 'ORDER',
    categories: [
      { key: 'ORDER', label: '下单' },
      { key: 'SERVICE', label: '服务' },
      { key: 'SITTER', label: '接单师' },
      { key: 'REFUND', label: '退款' }
    ],
    faqs: [
      {
        id: 1,
        category: 'ORDER',
        question: '如何预约上门照护服务？',
        answer: '在首页选择服务后进入下单页，填写服务地址、宠物档案、上门日期、时间段、服务时长和预算，确认后提交订单。'
      },
      {
        id: 2,
        category: 'ORDER',
        question: '提交订单后多久会有人接单？',
        answer: '订单提交后会进入待接单状态，附近符合条件的托托师可以接单。建议填写清晰备注并设置合理服务费，能提升接单效率。'
      },
      {
        id: 3,
        category: 'ORDER',
        question: '可以修改服务时间或地址吗？',
        answer: '当前 MVP 版本暂不支持直接修改已提交订单。若信息填写错误，建议尽早取消后重新下单，或联系微信客服协助处理。'
      },
      {
        id: 4,
        category: 'SERVICE',
        question: '服务过程中会上传哪些记录？',
        answer: '托托师需要按服务日程上传图片、视频或文字记录，包括喂食换水、清洁、遛狗陪伴、宠物状态观察等内容。'
      },
      {
        id: 5,
        category: 'SERVICE',
        question: '如何查看服务记录？',
        answer: '进入“订单”页，打开订单详情，在对应服务日期下点击“查看记录”即可查看托托师提交的服务照片、视频和备注。'
      },
      {
        id: 6,
        category: 'SERVICE',
        question: '托托师未按时上门怎么办？',
        answer: '请优先通过订单详情联系微信客服，也可以在“问题反馈”中提交订单号和情况说明，平台会根据记录核实处理。'
      },
      {
        id: 7,
        category: 'SITTER',
        question: '如何成为托托师？',
        answer: '在“我的”页点击“成为托托师”，按流程填写基础资料、服务能力和实名认证资料。审核通过并缴纳押金后即可接单。'
      },
      {
        id: 8,
        category: 'SITTER',
        question: '接单师审核需要多久？',
        answer: '平台通常会在 1-2 个工作日内完成资料审核。审核结果可在“成为托托师”页面查看。'
      },
      {
        id: 9,
        category: 'SITTER',
        question: '为什么审核通过后还不能接单？',
        answer: '接单权限需要同时满足：审核通过、押金已缴纳、信誉分不低于 70。若押金未缴纳，需要先完成押金缴纳。'
      },
      {
        id: 10,
        category: 'REFUND',
        question: '订单可以取消吗？',
        answer: '待接单订单可以在订单详情里取消。已接单或服务中的订单暂需联系客服处理，以免影响托托师排班和服务记录。'
      },
      {
        id: 11,
        category: 'REFUND',
        question: '托托师押金什么时候可以退？',
        answer: '无未完成订单时可以申请退还押金。接单后押金会锁定，完成所有订单后可再次申请退还。'
      },
      {
        id: 12,
        category: 'REFUND',
        question: '临时取消或未履约会影响押金吗？',
        answer: '会。平台会根据取消时间、服务状态和履约情况扣减信誉分，严重情况可能扣除部分或全部押金。'
      }
    ],
    displayedFaqs: [],
    openMap: {}
  },

  onLoad(options) {
    const category = options && options.category ? options.category : 'ORDER'
    this.setData({ activeCategory: category }, () => this.filterFaqs())
  },

  filterFaqs() {
    const displayedFaqs = this.data.faqs.filter(item => item.category === this.data.activeCategory)
    this.setData({ displayedFaqs })
  },

  switchCategory(e) {
    const key = e.currentTarget.dataset.key
    if (!key || key === this.data.activeCategory) return
    this.setData({
      activeCategory: key,
      openMap: {}
    }, () => this.filterFaqs())
  },

  toggleFaq(e) {
    const id = e.currentTarget.dataset.id
    if (!id) return
    this.setData({
      [`openMap.${id}`]: !this.data.openMap[id]
    })
  },

  goFeedback() {
    wx.navigateTo({
      url: '/pages/feedback/index'
    })
  }
})
