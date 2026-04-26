const { request, BASE_URL, resolveUploadedMediaUrl } = require('../../../utils/request')

Page({
  data: {
    statusBarHeight: 20,
    navBarHeight: 44,
    navTotalHeight: 64,
    orderId: null,
    orderStatus: '',
    content: '',
    imageList: [],
    submitting: false
  },

  onLoad(options) {
    const systemInfo = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()
    const statusBarHeight = systemInfo.statusBarHeight || 20
    const navBarHeight = 44

    this.setData({
      statusBarHeight,
      navBarHeight,
      navTotalHeight: statusBarHeight + navBarHeight,
      orderId: options.id || null,
      orderStatus: options.status || ''
    })
  },

  navigateBack() {
    wx.navigateBack({ delta: 1 })
  },

  onContentInput(e) {
    const value = e.detail.value || ''
    this.setData({ content: value.slice(0, 100) })
  },

  chooseImages() {
    const remain = 3 - this.data.imageList.length
    if (remain <= 0) {
      wx.showToast({ title: '最多上传3张图片', icon: 'none' })
      return
    }

    wx.chooseMedia({
      count: remain,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: async (res) => {
        wx.showLoading({ title: '上传中' })
        try {
          const uploaded = []
          for (const file of res.tempFiles || []) {
            const result = await this.uploadImage(file.tempFilePath)
            uploaded.push({ url: resolveUploadedMediaUrl(result.url) })
          }
          this.setData({
            imageList: this.data.imageList.concat(uploaded).slice(0, 3)
          })
        } catch (err) {
          console.error('upload remark image error', err)
          wx.showToast({ title: '图片上传失败', icon: 'none' })
        } finally {
          wx.hideLoading()
        }
      }
    })
  },

  uploadImage(filePath) {
    const token = wx.getStorageSync('token') || ''
    return new Promise((resolve, reject) => {
      wx.uploadFile({
        url: `${BASE_URL}/api/files/upload-image`,
        filePath,
        name: 'file',
        header: token ? { Authorization: `Bearer ${token}` } : {},
        success: (res) => {
          try {
            const data = JSON.parse(res.data || '{}')
            const finalData = data.data || data
            if (res.statusCode >= 200 && res.statusCode < 300 && finalData.url) {
              resolve(finalData)
              return
            }
            reject(data)
          } catch (err) {
            reject(err)
          }
        },
        fail: reject
      })
    })
  },

  previewImage(e) {
    const index = Number(e.currentTarget.dataset.index || 0)
    const urls = this.data.imageList.map(item => item.url)
    wx.previewImage({
      current: urls[index],
      urls
    })
  },

  removeImage(e) {
    const index = Number(e.currentTarget.dataset.index)
    const imageList = [...this.data.imageList]
    imageList.splice(index, 1)
    this.setData({ imageList })
  },

  validateForm() {
    const content = (this.data.content || '').trim()
    if (!this.data.orderId) {
      wx.showToast({ title: '订单信息异常', icon: 'none' })
      return false
    }
    if (!content) {
      wx.showToast({ title: '请填写补充说明', icon: 'none' })
      return false
    }
    if (content.length > 100) {
      wx.showToast({ title: '补充说明最多100字', icon: 'none' })
      return false
    }
    if (this.data.imageList.length > 3) {
      wx.showToast({ title: '图片最多3张', icon: 'none' })
      return false
    }
    if (['COMPLETED', 'CANCELLED'].includes(this.data.orderStatus)) {
      wx.showToast({ title: '当前订单不可补充备注', icon: 'none' })
      return false
    }
    return true
  },

  submitRemark() {
    if (!this.validateForm() || this.data.submitting) return

    const doSubmit = () => {
      this.setData({ submitting: true })
      wx.showLoading({ title: '提交中' })
      request('/api/order/remark/add', 'POST', {
        orderId: this.data.orderId,
        content: this.data.content.trim(),
        imageUrls: this.data.imageList.map(item => item.url)
      }).then(() => {
        wx.hideLoading()
        wx.showToast({ title: '补充说明已提交', icon: 'success' })
        setTimeout(() => {
          wx.navigateBack({ delta: 1 })
        }, 700)
      }).catch(() => {
        wx.hideLoading()
      }).finally(() => {
        this.setData({ submitting: false })
      })
    }

    if (['SERVING', 'PART_SERVING', 'PART_COMPLETED'].includes(this.data.orderStatus)) {
      wx.showModal({
        title: '温馨提示',
        content: '当前订单已开始服务，建议同时联系接单师确认是否已看到补充说明。',
        confirmText: '继续提交',
        cancelText: '再想想',
        success: (res) => {
          if (res.confirm) doSubmit()
        }
      })
      return
    }

    doSubmit()
  }
})
