const { request, BASE_URL } = require('../../utils/request')

Page({
  data: {
    orderId: null,
    orderNo: '',
    serviceDate: '',
    timeSlot: '',
    type: 'FEEDING',
    typeOptions: [
      { label: '喂食', value: 'FEEDING' },
      { label: '清理猫砂', value: 'CLEANING' },
      { label: '互动玩耍', value: 'PLAY' },
      { label: '其他', value: 'OTHER' }
    ],
    imageUrl: '',
    videoUrl: '',
    description: '',
    serviceStarted: false,
    submitting: false,
    uploadingImage: false,
    uploadingVideo: false
  },

  onLoad(options) {
    const orderId = options.orderId ? Number(options.orderId) : null
    const orderNo = options.orderNo || ''
    const serviceDate = options.serviceDate || ''
    const timeSlot = options.timeSlot || ''

    this.setData({
      orderId,
      orderNo,
      serviceDate,
      timeSlot
    })
  },

  chooseType(e) {
    const value = e.currentTarget.dataset.value
    this.setData({ type: value })
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field
    this.setData({
      [field]: e.detail.value
    })
  },

  chooseImage() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath
        this.uploadImage(tempFilePath)
      }
    })
  },

  uploadImage(filePath) {
    this.setData({ uploadingImage: true })
    wx.showLoading({ title: '上传图片中' })

    wx.uploadFile({
      url: `${BASE_URL}/api/files/upload-image`,
      filePath,
      name: 'file',
      success: (res) => {
        try {
          const data = JSON.parse(res.data)
          if (data.code === 0) {
            this.setData({
              imageUrl: data.data.url
            })
            wx.showToast({
              title: '图片上传成功',
              icon: 'success'
            })
          } else {
            wx.showToast({
              title: data.message || '上传失败',
              icon: 'none'
            })
          }
        } catch (e) {
          wx.showToast({
            title: '上传返回解析失败',
            icon: 'none'
          })
        }
      },
      fail: (err) => {
        console.error('upload image fail:', err)
        wx.showToast({
          title: '图片上传失败',
          icon: 'none'
        })
      },
      complete: () => {
        wx.hideLoading()
        this.setData({ uploadingImage: false })
      }
    })
  },

  chooseVideo() {
    wx.chooseVideo({
      sourceType: ['album', 'camera'],
      maxDuration: 30,
      camera: 'back',
      compressed: true,
      success: (res) => {
        const tempFilePath = res.tempFilePath
        this.uploadVideo(tempFilePath)
      }
    })
  },

  uploadVideo(filePath) {
    this.setData({ uploadingVideo: true })
    wx.showLoading({ title: '上传视频中' })

    wx.uploadFile({
      url: `${BASE_URL}/api/files/upload-video`,
      filePath,
      name: 'file',
      success: (res) => {
        try {
          const data = JSON.parse(res.data)
          if (data.code === 0) {
            this.setData({
              videoUrl: data.data.url
            })
            wx.showToast({
              title: '视频上传成功',
              icon: 'success'
            })
          } else {
            wx.showToast({
              title: data.message || '上传失败',
              icon: 'none'
            })
          }
        } catch (e) {
          wx.showToast({
            title: '上传返回解析失败',
            icon: 'none'
          })
        }
      },
      fail: (err) => {
        console.error('upload video fail:', err)
        wx.showToast({
          title: '视频上传失败',
          icon: 'none'
        })
      },
      complete: () => {
        wx.hideLoading()
        this.setData({ uploadingVideo: false })
      }
    })
  },

  previewImage() {
    if (!this.data.imageUrl) return
    wx.previewImage({
      urls: [this.data.imageUrl]
    })
  },

  removeImage() {
    this.setData({
      imageUrl: ''
    })
  },

  removeVideo() {
    this.setData({
      videoUrl: ''
    })
  },

  startService() {
    const { orderId } = this.data
    if (!orderId) {
      wx.showToast({ title: '缺少订单ID', icon: 'none' })
      return
    }

    wx.showLoading({ title: '开始中' })
    request('/api/service-records/start', 'POST', { orderId })
      .then(() => {
        wx.hideLoading()
        this.setData({ serviceStarted: true })
        wx.showToast({ title: '已开始服务', icon: 'success' })
      })
      .catch(() => {
        wx.hideLoading()
      })
  },

  submitRecord() {
    const {
      orderId,
      type,
      imageUrl,
      videoUrl,
      description,
      submitting,
      uploadingImage,
      uploadingVideo
    } = this.data

    if (submitting) return

    if (uploadingImage || uploadingVideo) {
      wx.showToast({ title: '文件上传中，请稍候', icon: 'none' })
      return
    }

    if (!orderId) {
      wx.showToast({ title: '缺少订单ID', icon: 'none' })
      return
    }

    if (!imageUrl && !videoUrl) {
      wx.showToast({ title: '请至少上传图片或视频', icon: 'none' })
      return
    }

    this.setData({ submitting: true })
    wx.showLoading({ title: '提交中' })

    request('/api/service-records', 'POST', {
      orderId,
      type,
      imageUrl,
      videoUrl,
      description
    })
      .then(() => {
        wx.hideLoading()
        this.setData({
          description: '',
          imageUrl: '',
          videoUrl: '',
          submitting: false
        })
        wx.showToast({ title: '记录已上传', icon: 'success' })
      })
      .catch(() => {
        wx.hideLoading()
        this.setData({ submitting: false })
      })
  },

  completeService() {
    const { orderId } = this.data
    if (!orderId) {
      wx.showToast({ title: '缺少订单ID', icon: 'none' })
      return
    }

    wx.showModal({
      title: '确认结束服务',
      content: '结束后订单状态将变为已完成',
      success: (res) => {
        if (!res.confirm) return

        wx.showLoading({ title: '提交中' })
        request('/api/service-records/complete', 'POST', { orderId })
          .then(() => {
            wx.hideLoading()
            wx.showToast({ title: '服务已完成', icon: 'success' })
            setTimeout(() => {
              wx.redirectTo({
                url: `/pages/service-record-detail/index?orderId=${orderId}&orderNo=${this.data.orderNo}&serviceDate=${this.data.serviceDate}&timeSlot=${this.data.timeSlot}`
              })
            }, 600)
          })
          .catch(() => {
            wx.hideLoading()
          })
      }
    })
  }
})