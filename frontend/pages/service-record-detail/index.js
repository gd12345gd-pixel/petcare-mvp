const { request } = require('../../utils/request')

Page({
  data: {
    statusBarHeight: 20,
    navBarHeight: 44,
    navTotalHeight: 64,

    id: null,
    loading: true,
    detail: null,

    serviceItemTextMap: {
      FEED: '已喂食',
      WATER: '已换水',
      CLEAN: '已清理排泄区',
      WALK_PLAY: '已遛狗/陪玩',
      CHECK: '已观察宠物状态',
      OTHER: '其他服务'
    },

    petObservationTextMap: {
      NORMAL: '状态正常',
      APPETITE_NORMAL: '食欲正常',
      WATER_NORMAL: '饮水正常',
      EMOTION_STABLE: '情绪稳定',
      EXCRETION_NORMAL: '排泄正常',
      ENERGY_GOOD: '精神不错',
      RESTED: '已休息',
      ABNORMAL: '有异常情况'
    },

    scheduleStatusTextMap: {
      PENDING: '待开始',
      SERVING: '服务中',
      RECORDED: '已提交记录',
      DONE: '已完成',
      CANCELLED: '已取消'
    },

    orderStatusTextMap: {
      WAIT_TAKING: '待接单',
      TAKEN: '已接单',
      PART_SERVING: '服务中',
      PART_COMPLETED: '部分完成',
      COMPLETED: '已完成',
      CANCELLED: '已取消'
    }
  },

  onLoad(options) {
    const systemInfo = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()
    const statusBarHeight = systemInfo.statusBarHeight || 20
    const navBarHeight = 44
    const id = options.id

    this.setData({
      statusBarHeight,
      navBarHeight,
      navTotalHeight: statusBarHeight + navBarHeight,
      id: id || null
    })

    if (!id) {
      wx.showToast({
        title: '缺少记录ID',
        icon: 'none'
      })
      setTimeout(() => {
        this.navigateBack()
      }, 800)
      return
    }

    this.loadDetail()
  },

  navigateBack() {
    const pages = getCurrentPages()
    if (pages.length > 1) {
      wx.navigateBack({ delta: 1 })
      return
    }
    wx.switchTab({
      url: '/pages/order/list/index'
    })
  },

  async loadDetail() {
    this.setData({ loading: true })

    try {
      const res = await request(`/api/service-record/detail?id=${this.data.id}`, 'GET')
      this.setData({
        detail: this.formatDetail(res || {}),
        loading: false
      })
    } catch (err) {
      console.error('loadDetail error', err)
      this.setData({ loading: false })
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      })
    }
  },

  formatDetail(raw) {
    const serviceItems = (raw.serviceItems || []).map(code => ({
      code,
      text: this.data.serviceItemTextMap[code] || code
    }))

    const petObservations = (raw.petObservations || []).map(code => ({
      code,
      text: this.data.petObservationTextMap[code] || code,
      isAbnormal: code === 'ABNORMAL'
    }))

    const pets = (raw.pets || []).map(pet => ({
      id: pet.petId,
      name: pet.petName || '未命名宠物',
      initial: (pet.petName || '宠').slice(0, 1),
      type: pet.petType || '',
      breed: pet.petBreed || '',
      avatar: pet.petImageUrl || '',
      gender: this.formatPetGender(pet.petGender),
      age: this.formatPetAge(pet.petAge),
      remark: pet.petRemark || ''
    }))

    const images = (raw.images || []).map(url => ({ url }))
    const videos = (raw.videos || []).map(url => ({ url }))
    const submittedAtText = this.formatDateTime(raw.submittedAt)
    const startTimeText = this.formatDateTime(raw.startTime)
    const finishTimeText = this.formatDateTime(raw.finishTime)
    const startLocationText = raw.startLocationText || '未记录'
    const finishLocationText = raw.finishLocationText || '未记录'
    const serviceDateText = this.formatDate(raw.serviceDate)
    const timeSlotsText = this.formatTimeSlots(raw.timeSlots)
    const serviceDurationText = this.formatDuration(raw.serviceDurationMinutes)
    const actualDurationText = this.formatSettlementDuration(raw.actualServiceDurationMinutes)

    return {
      id: raw.id,
      orderId: raw.orderId,
      scheduleId: raw.scheduleId,
      sitterId: raw.sitterId,
      orderNo: raw.orderNo || '--',
      orderStatusText: this.formatOrderStatus(raw.orderStatus),
      scheduleStatusText: this.formatScheduleStatus(raw.scheduleStatus),
      serviceContactName: raw.serviceContactName || '--',
      serviceContactPhone: raw.serviceContactPhone || '--',
      serviceFullAddress: raw.serviceFullAddress || '--',
      petCountText: this.formatCount(raw.petCount, '只'),
      serviceDateCountText: this.formatCount(raw.serviceDateCount, '天'),
      orderRemark: raw.orderRemark || '',
      specialRequirement: raw.specialRequirement || '',
      remark: raw.remark || '暂无备注',
      abnormalDesc: raw.abnormalDesc || '',
      serviceDateText,
      timeSlotsText,
      serviceDurationText,
      actualDurationText,
      submittedAtText,
      startTimeText,
      finishTimeText,
      startDistanceText: this.formatDistance(raw.startDistanceMeters),
      finishDistanceText: this.formatDistance(raw.finishDistanceMeters),
      startLocationText,
      finishLocationText,
      summaryItems: [
        { label: '服务日期', value: serviceDateText },
        { label: '预约时段', value: timeSlotsText },
        { label: '预计时长', value: serviceDurationText },
        { label: '实际结算时长', value: actualDurationText },
        { label: '服务宠物', value: this.formatCount(raw.petCount || pets.length, '只') }
      ],
      timeline: [
        {
          key: 'start',
          title: '开始服务打卡',
          time: startTimeText,
          distance: this.formatDistance(raw.startDistanceMeters),
          location: startLocationText,
          done: !!raw.startTime
        },
        {
          key: 'submit',
          title: '提交服务记录',
          time: submittedAtText,
          isSubmit: true,
          done: !!raw.submittedAt
        },
        {
          key: 'finish',
          title: '结束服务打卡',
          time: finishTimeText,
          distance: this.formatDistance(raw.finishDistanceMeters),
          location: finishLocationText,
          duration: actualDurationText,
          done: !!raw.finishTime
        }
      ],
      pets,
      serviceItems,
      petObservations,
      images,
      videos,
      hasPets: pets.length > 0,
      hasImages: images.length > 0,
      hasVideos: videos.length > 0,
      hasAbnormal: !!raw.abnormalDesc,
      hasOrderNote: !!raw.orderRemark || !!raw.specialRequirement
    }
  },

  formatDate(value) {
    if (!value) return '--'
    return String(value).replace(/\//g, '-')
  },

  formatDateTime(value) {
    if (!value) return '--'
    const text = String(value).replace('T', ' ')
    return text.length >= 16 ? text.slice(0, 16) : text
  },

  formatTimeSlots(value) {
    if (!value || !value.length) return '--'
    return value.join('、')
  },

  formatDuration(value) {
    const minutes = Number(value)
    if (!minutes) return '--'
    if (minutes < 60) return `${minutes}分钟`
    const hours = Math.floor(minutes / 60)
    const remain = minutes % 60
    return remain ? `${hours}小时${remain}分钟` : `${hours}小时`
  },

  formatSettlementDuration(value) {
    const minutes = Number(value)
    if (!minutes && minutes !== 0) return '--'
    if (Number.isNaN(minutes)) return '--'
    return `${Math.max(0, Math.round(minutes))}分钟`
  },

  formatCount(value, unit) {
    const num = Number(value)
    if (!num) return '--'
    return `${num}${unit}`
  },

  formatScheduleStatus(value) {
    if (!value) return '--'
    return this.data.scheduleStatusTextMap[value] || value
  },

  formatOrderStatus(value) {
    if (!value) return '--'
    return this.data.orderStatusTextMap[value] || value
  },

  formatDistance(value) {
    if (value === null || value === undefined || value === '') return '未记录'
    const meters = Number(value)
    if (Number.isNaN(meters)) return '未记录'
    if (meters >= 1000) return `${(meters / 1000).toFixed(2)}km`
    return `${Math.round(meters)}m`
  },

  formatCoordinate(latitude, longitude) {
    if (latitude === null || latitude === undefined || longitude === null || longitude === undefined) {
      return '未记录'
    }
    const lat = Number(latitude)
    const lng = Number(longitude)
    if (Number.isNaN(lat) || Number.isNaN(lng)) return '未记录'
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`
  },

  formatPetAge(value) {
    if (!value) return ''
    const text = String(value)
    return text.includes('岁') ? text : `${text}岁`
  },

  formatPetGender(value) {
    if (value === 'MALE') return '公'
    if (value === 'FEMALE') return '母'
    return value || ''
  },

  previewImage(e) {
    const index = Number(e.currentTarget.dataset.index)
    const detail = this.data.detail
    if (!detail || !detail.images || !detail.images.length) return

    const urls = detail.images.map(item => item.url)
    wx.previewImage({
      current: urls[index],
      urls
    })
  }
})
