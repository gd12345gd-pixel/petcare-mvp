const { request } = require('../../utils/request')

Page({
  data: {
    id: null,
    type: 'lost', // lost / found
    detail: {},
    comments: [],
    commentText: '',
    loading: false
  },

  onLoad(options) {
    const type = options.type || 'lost'
    const id = Number(options.id || 1)

    this.setData({
      type,
      id
    })

    this.loadDetail()
    this.loadComments()
  },

  onShow() {
    if (this.data.id) {
      this.loadComments()
    }
  },

  loadDetail() {
    const { type, id } = this.data
    this.setData({ loading: true })

    const api = type === 'lost'
    ? `/api/pet-community/lost/detail/${id}`
    : `/api/pet-community/found/detail/${id}`

    request(api, 'GET')
      .then((data) => {
        this.setData({
          detail: data || {},
          loading: false
        })
      })
      .catch(() => {
        this.setData({ loading: false })
      })
  },

  loadComments() {
    const { type, id } = this.data
    const targetType = type === 'lost' ? 'LOST' : 'FOUND'

    request(`/api/pet-community/comments?targetType=${targetType}&targetId=${id}`, 'GET')
      .then((data) => {
        this.setData({
          comments: data || []
        })
      })
  },

  onInputComment(e) {
    this.setData({
      commentText: e.detail.value
    })
  },

  sendComment() {
    const { commentText, id, type } = this.data
    const currentUser = wx.getStorageSync('currentUser') || { id: 1 }

    if (!commentText.trim()) {
      wx.showToast({ title: '请输入评论内容', icon: 'none' })
      return
    }

    request('/api/pet-community/comments', 'POST', {
      userId: currentUser.id,
      targetId: id,
      targetType: type === 'lost' ? 'LOST' : 'FOUND',
      content: commentText
    }).then(() => {
      wx.showToast({
        title: '评论成功',
        icon: 'success'
      })
      this.setData({
        commentText: ''
      })
      this.loadComments()
    })
  },

  callPhone() {
    const phone = this.data.detail.contact
    if (!phone) {
      wx.showToast({ title: '暂无联系方式', icon: 'none' })
      return
    }

    wx.makePhoneCall({
      phoneNumber: phone
    })
  },
  openLocation() {
    const { detail } = this.data
  
    if (!detail.latitude || !detail.longitude) {
      wx.showToast({
        title: '暂无位置信息',
        icon: 'none'
      })
      return
    }
  
    wx.openLocation({
      latitude: Number(detail.latitude),
      longitude: Number(detail.longitude),
      name: detail.location,
      address: detail.location,
      scale: 18
    })
  },
  goService() {
    wx.switchTab({
      url: '/pages/home/index'
    })
  }
})
