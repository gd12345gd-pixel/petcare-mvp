const { request, BASE_URL } = require('../../utils/request')

Page({
  data: {
    statusBarHeight: 20,
    navBarHeight: 44,
    navTotalHeight: 64,

    orderId: null,
    scheduleId: null,

    loading: true,
    submitting: false,

    baseInfo: {
      serviceDateText: '',
      timeSlotsText: '',
      petsText: '',
      addressText: ''
    },

    serviceItemOptions: [
      { key: 'FEED', label: '已喂食', checked: false },
      { key: 'WATER', label: '已换水', checked: false },
      { key: 'CLEAN', label: '已清理排泄区', checked: false },
      { key: 'WALK_PLAY', label: '已遛狗/陪玩', checked: false },
      { key: 'CHECK', label: '已观察宠物状态', checked: false },
      { key: 'OTHER', label: '其他服务', checked: false }
    ],

    petObservationOptions: [
      { key: 'NORMAL', label: '状态正常', checked: false },
      { key: 'APPETITE_NORMAL', label: '食欲正常', checked: false },
      { key: 'WATER_NORMAL', label: '饮水正常', checked: false },
      { key: 'EMOTION_STABLE', label: '情绪稳定', checked: false },
      { key: 'EXCRETION_NORMAL', label: '排泄正常', checked: false },
      { key: 'ENERGY_GOOD', label: '精神不错', checked: false },
      { key: 'RESTED', label: '已休息', checked: false },
      { key: 'ABNORMAL', label: '有异常情况', checked: false }
    ],

    abnormalDesc: '',
    remark: '',
    hasAbnormal: false,
    formTip: '',
    formTipVisible: false,

    imageList: [],
    videoList: []
  },

  onLoad(options) {
    const systemInfo = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()
    const statusBarHeight = systemInfo.statusBarHeight || 20
    const navBarHeight = 44

    const orderId = options.orderId
    const scheduleId = options.scheduleId

    this.setData({
      statusBarHeight,
      navBarHeight,
      navTotalHeight: statusBarHeight + navBarHeight,
      orderId: orderId || null,
      scheduleId: scheduleId || null
    })

    if (!orderId || !scheduleId) {
      wx.showToast({
        title: '缺少服务参数',
        icon: 'none'
      })
      setTimeout(() => {
        this.navigateBack()
      }, 1000)
      return
    }

    this.loadFormInfo()
  },

  navigateBack() {
    const pages = getCurrentPages()
    if (pages.length > 1) {
      wx.navigateBack({ delta: 1 })
      return
    }
    wx.switchTab({
      url: '/pages/sitter/index'
    })
  },

  async loadFormInfo() {
    const currentUser = wx.getStorageSync('currentUser') || { id: 1 }

    this.setData({ loading: true })

    try {
      const res = await request(
        `/api/sitter/orders/detail?id=${this.data.orderId}&sitterId=${currentUser.id}`,
        'GET'
      )

      const raw = res || {}
      const serviceDates = raw.serviceDates || []
      const targetSchedule =
        serviceDates.find(item => String(item.scheduleId || item.id) === String(this.data.scheduleId)) || {}

      const pets = raw.pets || []
      const petsText = pets.map(item => item.petName || '未命名宠物').join('、') || '未获取到宠物信息'

      this.setData({
        baseInfo: {
          serviceDateText: this.formatDateFull(targetSchedule.serviceDate),
          timeSlotsText: this.formatTimeSlots(targetSchedule.timeSlots || []),
          petsText,
          addressText: raw.serviceFullAddress || '未获取到服务地址'
        },
        loading: false
      })
    } catch (err) {
      console.error('loadFormInfo error', err)
      this.setData({ loading: false })
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      })
    }
  },

  formatDateFull(dateStr) {
    if (!dateStr) return '--/-- --'
    const date = new Date(String(dateStr).replace(/-/g, '/'))
    if (Number.isNaN(date.getTime())) return '--/-- --'
    const weekMap = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${month}/${day} ${weekMap[date.getDay()]}`
  },

  formatTimeSlots(list) {
    if (!list || !list.length) return '不限'
    return list.join('、')
  },

  toggleServiceItem(e) {
    const key = e.currentTarget.dataset.key
    const next = this.data.serviceItemOptions.map(item => {
      if (item.key === key) {
        return { ...item, checked: !item.checked }
      }
      return item
    })
    this.setData({ serviceItemOptions: next })
  },

  toggleObservationItem(e) {
    const key = e.currentTarget.dataset.key
    const next = this.data.petObservationOptions.map(item => {
      if (item.key === key) {
        return { ...item, checked: !item.checked }
      }
      return item
    })
    const hasAbnormal = next.some(item => item.key === 'ABNORMAL' && item.checked)
    this.setData({
      petObservationOptions: next,
      hasAbnormal,
      abnormalDesc: hasAbnormal ? this.data.abnormalDesc : ''
    })
  },

  onInputAbnormalDesc(e) {
    this.setData({
      abnormalDesc: e.detail.value || ''
    })
  },

  onInputRemark(e) {
    this.setData({
      remark: e.detail.value || ''
    })
  },

  getSelectedServiceItems() {
    return this.data.serviceItemOptions.filter(item => item.checked).map(item => item.key)
  },

  getSelectedObservationItems() {
    return this.data.petObservationOptions.filter(item => item.checked).map(item => item.key)
  },

  hasAbnormalSelected() {
    return this.getSelectedObservationItems().includes('ABNORMAL')
  },

  showFormTip(message) {
    if (this.formTipTimer) {
      clearTimeout(this.formTipTimer)
    }

    this.setData({
      formTip: message,
      formTipVisible: true
    })

    this.formTipTimer = setTimeout(() => {
      this.setData({
        formTipVisible: false
      })
    }, 3200)
  },

  chooseImages() {
    const remain = 9 - this.data.imageList.length
    if (remain <= 0) {
      wx.showToast({
        title: '最多上传9张图片',
        icon: 'none'
      })
      return
    }

    wx.chooseMedia({
      count: remain,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: async (res) => {
        const files = res.tempFiles || []
        if (!files.length) return

        wx.showLoading({ title: '上传图片中' })
        try {
          const uploaded = []
          for (let i = 0; i < files.length; i++) {
            const result = await this.uploadFile(files[i].tempFilePath, 'image')
            uploaded.push({
              url: result.url,
              thumbUrl: result.url
            })
          }

          this.setData({
            imageList: [...this.data.imageList, ...uploaded]
          })
          wx.hideLoading()
        } catch (err) {
          console.error('chooseImages error', err)
          wx.hideLoading()
          wx.showToast({
            title: '图片上传失败',
            icon: 'none'
          })
        }
      }
    })
  },

  chooseVideos() {
    const remain = 3 - this.data.videoList.length
    if (remain <= 0) {
      wx.showToast({
        title: '最多上传3个视频',
        icon: 'none'
      })
      return
    }

    wx.chooseMedia({
      count: remain,
      mediaType: ['video'],
      sourceType: ['album', 'camera'],
      maxDuration: 30,
      success: async (res) => {
        const files = res.tempFiles || []
        if (!files.length) return

        wx.showLoading({ title: '上传视频中' })
        try {
          const uploaded = []
          for (let i = 0; i < files.length; i++) {
            const item = files[i]
            const result = await this.uploadFile(item.tempFilePath, 'video')
            uploaded.push({
              url: result.url,
              thumbUrl: item.thumbTempFilePath || '',
              duration: item.duration || 0
            })
          }

          this.setData({
            videoList: [...this.data.videoList, ...uploaded]
          })
          wx.hideLoading()
        } catch (err) {
          console.error('chooseVideos error', err)
          wx.hideLoading()
          wx.showToast({
            title: '视频上传失败',
            icon: 'none'
          })
        }
      }
    })
  },

  uploadFile(filePath, mediaType) {
    const token = wx.getStorageSync('token') || ''

    return new Promise((resolve, reject) => {
      wx.uploadFile({
        url: `${BASE_URL}${mediaType === 'video' ? '/api/files/upload-video' : '/api/files/upload-image'}`,
        filePath,
        name: 'file',
        formData: { mediaType },
        header: token
          ? { Authorization: `Bearer ${token}` }
          : {},
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
    const index = Number(e.currentTarget.dataset.index)
    const urls = this.data.imageList.map(item => item.url)
    wx.previewImage({
      current: urls[index],
      urls
    })
  },

  removeImage(e) {
    const index = Number(e.currentTarget.dataset.index)
    const list = [...this.data.imageList]
    list.splice(index, 1)
    this.setData({ imageList: list })
  },

  removeVideo(e) {
    const index = Number(e.currentTarget.dataset.index)
    const list = [...this.data.videoList]
    list.splice(index, 1)
    this.setData({ videoList: list })
  },

  validateForm() {
    const serviceItems = this.getSelectedServiceItems()
    const observations = this.getSelectedObservationItems()
    const hasAbnormal = observations.includes('ABNORMAL')

    if (!serviceItems.length) {
      wx.showToast({
        title: '请至少选择1项服务项目',
        icon: 'none'
      })
      return false
    }

    if (!observations.length) {
      wx.showToast({
        title: '请至少选择1项宠物观察情况',
        icon: 'none'
      })
      return false
    }

    if (this.data.videoList.length < 1) {
      wx.showToast({
        title: '请至少上传1个服务视频',
        icon: 'none'
      })
      return false
    }

    if (hasAbnormal && !String(this.data.abnormalDesc || '').trim()) {
      wx.showToast({
        title: '请填写异常情况',
        icon: 'none'
      })
      return false
    }

    return true
  },

  async submitRecord() {
    if (this.data.submitting) return
    if (!this.validateForm()) return

    const currentUser = wx.getStorageSync('currentUser') || { id: 1 }

    const payload = {
      orderId: Number(this.data.orderId),
      scheduleId: Number(this.data.scheduleId),
      sitterId: Number(currentUser.id),
      serviceItems: this.getSelectedServiceItems(),
      petObservations: this.getSelectedObservationItems(),
      abnormalDesc: String(this.data.abnormalDesc || '').trim(),
      images: this.data.imageList.map(item => item.url),
      videos: this.data.videoList.map(item => item.url),
      remark: String(this.data.remark || '').trim()
    }

    this.setData({ submitting: true })
    wx.showLoading({ title: '提交中' })

    try {
      await request('/api/service-record/create', 'POST', payload)
      wx.hideLoading()
      wx.showToast({
        title: '提交成功',
        icon: 'success'
      })

      setTimeout(() => {
        wx.navigateBack({ delta: 1 })
      }, 700)
    } catch (err) {
      console.error('submitRecord error', err)
      wx.hideLoading()
      wx.showToast({
        title: '提交失败',
        icon: 'none'
      })
    } finally {
      this.setData({ submitting: false })
    }
  },

  validateForm() {
    const serviceItems = this.getSelectedServiceItems()
    const observations = this.getSelectedObservationItems()
    const hasAbnormal = observations.includes('ABNORMAL')

    if (!serviceItems.length) {
      this.showFormTip('请至少选择 1 项服务项目')
      return false
    }

    if (!observations.length) {
      this.showFormTip('请至少选择 1 项宠物观察情况')
      return false
    }

    if (hasAbnormal && !String(this.data.abnormalDesc || '').trim()) {
      this.showFormTip('已选择有异常情况，请填写异常说明')
      return false
    }

    if (this.data.videoList.length < 1) {
      this.showFormTip('请至少上传 1 个服务视频')
      return false
    }

    return true
  },

  goReportException() {
    wx.showToast({
      title: '异常上报页后续接入',
      icon: 'none'
    })
  }
})
