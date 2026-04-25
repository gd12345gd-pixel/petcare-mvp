const { request } = require('../../../utils/request')

Page({
  data: {
    statusBarHeight: 20,
    navBarHeight: 44,
    navTotalHeight: 64,
    isReschedule: false,
    rescheduleOrderId: null,
    pageTitle: '下单预约',
    heroBadge: '预约上门喂养',
    heroTitle: '下单预约',
    heroDesc: '填写毛孩子的照护信息，我们会尽快为你确认服务',
    submitText: '确认下单',
    bottomDesc: '提交后进入待接单',

    defaultPetImage: 'https://dummyimage.com/200x200/f3f4f6/b3b7c0.png&text=PET',

    pets: [],
    selectedPetIds: [],

    selectedAddress: null,

    selectedDates: [],
    selectedDateSummary: '',

    showDatePopup: false,
    calendarMonthText: '',
    calendarDays: [],
    calendarMonthOffset: 0,
    canSwitchPrevMonth: false,
    canSwitchNextMonth: true,
    tempSelectedDates: [],
    tempSelectedDateSummary: '',

    timeSlots: [
      { label: '时间不限', value: '不限', selected: true },
      { label: '08:00-10:00', value: '08:00-10:00', selected: false },
      { label: '10:00-12:00', value: '10:00-12:00', selected: false },
      { label: '12:00-14:00', value: '12:00-14:00', selected: false },
      { label: '14:00-16:00', value: '14:00-16:00', selected: false },
      { label: '16:00-18:00', value: '16:00-18:00', selected: false },
      { label: '18:00-20:00', value: '18:00-20:00', selected: false },
      { label: '20:00-22:00', value: '20:00-22:00', selected: false }
    ],

    durationMinutes: 40,
    showCustomDuration: false,
    durationQuickOptions: [
      { value: 30, label: '30分钟', active: false },
      { value: 40, label: '40分钟', active: true },
      { value: 60, label: '60分钟', active: false },
      { value: 90, label: '90分钟', active: false },
      { value: 999, label: '自定义', active: false }
    ],

    suggestedUnitPrice: '59',
    lastSuggestedUnitPrice: '59',
    unitPrice: '59',
    unitPriceDisplay: '59',
    unitPriceTouched: false,

    totalPriceDisplay: '0',
    serviceCount: 0,

    remark: '',
    submitting: false
  },

  onLoad(options = {}) {
    const systemInfo = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()
    const statusBarHeight = systemInfo.statusBarHeight || 20
    const navBarHeight = 44
    const isReschedule = options.mode === 'reschedule' && !!options.id

    this.setData({
      statusBarHeight,
      navBarHeight,
      navTotalHeight: statusBarHeight + navBarHeight,
      isReschedule,
      rescheduleOrderId: isReschedule ? options.id : null,
      pageTitle: isReschedule ? '修改预约' : '下单预约',
      heroBadge: isReschedule ? '待接单订单可修改' : '预约上门喂养',
      heroTitle: isReschedule ? '修改预约' : '下单预约',
      heroDesc: isReschedule ? '修改后将生成新的待接单订单，并重新匹配托托师' : '填写毛孩子的照护信息，我们会尽快为你确认服务',
      submitText: isReschedule ? '确认修改' : '确认下单',
      bottomDesc: isReschedule ? '修改后重新进入待接单' : '提交后进入待接单'
    })

    this.buildCalendar()
    this.loadPetList()
    this.syncDurationQuickOptions()
    this.calculateSuggestedPrice()
    this.syncComputedData()

    if (isReschedule) {
      this.loadRescheduleOrder(options.id)
    }
  },

  onShow() {
    const selectedAddress = wx.getStorageSync('selectedServiceAddress')
    if (selectedAddress) {
      this.setData({ selectedAddress })
    } else if (!this.data.selectedAddress) {
      this.loadDefaultAddress()
    }

    const latestPetId = wx.getStorageSync('latestPetId')
    this.loadPetList(latestPetId)

    if (latestPetId) {
      wx.removeStorageSync('latestPetId')
    }
  },

  navigateBack() {
    const pages = getCurrentPages()
    if (pages.length > 1) {
      wx.navigateBack({
        delta: 1,
        fail: () => {
          wx.redirectTo({
            url: '/pages/order/list/index'
          })
        }
      })
      return
    }

    wx.redirectTo({
      url: '/pages/order/list/index'
    })
  },

  goChooseAddress() {
    wx.navigateTo({
      url: '/pages/address-list/index?from=orderCreate'
    })
  },

  loadRescheduleOrder(orderId) {
    wx.showLoading({ title: '加载中' })
    request(`/api/orders/detail?id=${orderId}`, 'GET')
      .then((raw) => {
        if (!raw || !raw.canReschedule) {
          wx.showToast({
            title: '当前订单不可修改',
            icon: 'none'
          })
          return
        }

        const serviceDates = (raw.serviceDates || [])
          .map(item => this.normalizeServiceDateValue(item))
          .filter(Boolean)
        const timeSlotValues = this.normalizeTimeSlotValues(
          raw.timeSlots && raw.timeSlots.length
            ? raw.timeSlots
            : (raw.serviceDates || []).reduce((list, item) => list.concat(item.timeSlots || []), [])
        )
        const timeSlotSet = new Set(timeSlotValues.map(item => this.normalizeTimeSlotText(item)))
        const selectedPetIds = (raw.pets || []).map(item => item.petId).filter(Boolean)
        const selectedAddress = {
          id: raw.addressId,
          contactName: raw.serviceContactName,
          contactPhone: raw.serviceContactPhone,
          fullAddress: raw.serviceFullAddress,
          detailAddress: raw.serviceFullAddress
        }
        const timeSlots = this.data.timeSlots.map(item => ({
          ...item,
          selected: timeSlotSet.has(this.normalizeTimeSlotText(item.value))
        }))

        this.setData({
          selectedAddress,
          selectedPetIds,
          selectedDates: serviceDates,
          selectedDateSummary: this.formatSelectedDates(serviceDates),
          tempSelectedDates: serviceDates,
          tempSelectedDateSummary: this.formatSelectedDates(serviceDates),
          timeSlots,
          durationMinutes: raw.serviceDurationMinutes || 40,
          remark: raw.remark || ''
        }, () => {
          this.syncPetSelectedState()
          this.syncDurationQuickOptions()
          this.calculateSuggestedPrice()
          this.buildCalendar()
        })
      })
      .catch((err) => {
        console.error('加载改约订单失败', err)
      })
      .finally(() => {
        wx.hideLoading()
      })
  },

  normalizeServiceDateValue(item) {
    if (!item) return ''
    const rawDate = typeof item === 'string'
      ? item
      : (item.serviceDate || item.date || item.serviceDateText || '')
    if (!rawDate) return ''

    const text = String(rawDate).trim()
    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text
    if (/^\d{4}\/\d{1,2}\/\d{1,2}$/.test(text)) {
      const [year, month, day] = text.split('/')
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    }

    const date = new Date(text.replace(/-/g, '/'))
    if (Number.isNaN(date.getTime())) return ''
    return this.formatDateKey(date)
  },

  normalizeTimeSlotValues(value) {
    if (!value) return []
    if (Array.isArray(value)) {
      return value.flatMap(item => this.normalizeTimeSlotValues(item))
    }
    return String(value)
      .split(/[、,，]/)
      .map(item => item.trim())
      .filter(Boolean)
  },

  normalizeTimeSlotText(value) {
    return String(value || '').replace(/\s/g, '')
  },

  loadDefaultAddress() {
    const currentUser = wx.getStorageSync('currentUser') || { id: 1 }
    request(`/api/address/list?userId=${currentUser.id}`, 'GET', {}, { silent: true })
      .then((list) => {
        const addresses = list || []
        if (!addresses.length || this.data.selectedAddress) return
        const defaultAddress = addresses.find(item => item.isDefault === 1)
        if (defaultAddress) {
          this.setData({ selectedAddress: defaultAddress })
        }
      })
      .catch(() => {})
  },

  goAddPet() {
    wx.navigateTo({
      url: '/pages/pet-edit/index'
    })
  },

  loadPetList(preferPetId) {
    const currentUser = wx.getStorageSync('currentUser') || { id: 1 }

    request(`/api/pet/list?userId=${currentUser.id}`, 'GET')
      .then((list) => {
        let pets = list || []
        let selectedPetIds = [...(this.data.selectedPetIds || [])]

        if (preferPetId && pets.some(item => item.id === preferPetId)) {
          if (!selectedPetIds.includes(preferPetId)) {
            selectedPetIds.push(preferPetId)
          }
        }

        selectedPetIds = selectedPetIds.filter(id => pets.some(item => item.id === id))

        if (!selectedPetIds.length && pets.length) {
          selectedPetIds = [pets[0].id]
        }

        pets = pets.map(item => ({
          ...item,
          selected: selectedPetIds.includes(item.id)
        }))

        this.setData({
          pets,
          selectedPetIds
        }, () => {
          this.calculateSuggestedPrice()
          this.syncComputedData()
        })
      })
      .catch(() => {})
  },

  syncPetSelectedState() {
    const pets = (this.data.pets || []).map(item => ({
      ...item,
      selected: (this.data.selectedPetIds || []).includes(item.id)
    }))
    this.setData({ pets })
  },

  selectPet(e) {
    const id = Number(e.currentTarget.dataset.id)
    let selectedPetIds = [...this.data.selectedPetIds]

    if (selectedPetIds.includes(id)) {
      selectedPetIds = selectedPetIds.filter(item => item !== id)
    } else {
      selectedPetIds.push(id)
    }

    this.setData({
      selectedPetIds
    }, () => {
      this.syncPetSelectedState()
      this.calculateSuggestedPrice()
      this.syncComputedData()
    })
  },

  getSelectedPets() {
    return this.data.pets.filter(item => this.data.selectedPetIds.includes(item.id))
  },

  getPrimaryPet() {
    const selectedPets = this.getSelectedPets()
    return selectedPets.length ? selectedPets[0] : null
  },

  formatSelectedDates(dates) {
    if (!dates || !dates.length) return ''

    const list = [...dates]
      .sort()
      .map(date => {
        const [, month, day] = date.split('-')
        return `${Number(month)}/${Number(day)}`
      })

    if (list.length <= 3) {
      return list.join('、')
    }

    return `${list.slice(0, 3).join('、')} 等${list.length}天`
  },

  buildCalendar() {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const maxDate = new Date(today)
    maxDate.setMonth(maxDate.getMonth() + 1)
    maxDate.setHours(0, 0, 0, 0)

    const maxOffset = (maxDate.getFullYear() - today.getFullYear()) * 12 + maxDate.getMonth() - today.getMonth()
    const monthOffset = Math.min(Math.max(this.data.calendarMonthOffset || 0, 0), maxOffset)
    const displayMonth = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1)
    const year = displayMonth.getFullYear()
    const month = displayMonth.getMonth() + 1
    const daysInMonth = new Date(year, month, 0).getDate()

    const firstDay = displayMonth.getDay()
    const days = []

    for (let i = 0; i < firstDay; i++) {
      days.push({
        empty: true,
        id: `empty-${i}`
      })
    }

    const tempSelectedDates = this.data.tempSelectedDates.length
      ? this.data.tempSelectedDates
      : this.data.selectedDates

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month - 1, d)
      const dateStr = this.formatDateKey(date)
      const disabled = date < today || date > maxDate
      days.push({
        id: dateStr,
        day: d,
        date: dateStr,
        disabled,
        selected: !disabled && tempSelectedDates.includes(dateStr)
      })
    }

    this.setData({
      calendarMonthOffset: monthOffset,
      calendarMonthText: `${year}年${month}月`,
      calendarDays: days,
      canSwitchPrevMonth: monthOffset > 0,
      canSwitchNextMonth: monthOffset < maxOffset
    })
  },

  openDatePopup() {
    const tempSelectedDates = [...this.data.selectedDates]
    this.setData({
      showDatePopup: true,
      calendarMonthOffset: 0,
      tempSelectedDates,
      tempSelectedDateSummary: this.formatSelectedDates(tempSelectedDates)
    }, () => {
      this.buildCalendar()
    })
  },

  switchCalendarMonth(e) {
    const direction = Number(e.currentTarget.dataset.direction || 0)
    if (!direction) return
    this.setData({
      calendarMonthOffset: this.data.calendarMonthOffset + direction
    }, () => {
      this.buildCalendar()
    })
  },

  closeDatePopup() {
    this.setData({
      showDatePopup: false
    })
  },

  toggleCalendarDate(e) {
    const date = e.currentTarget.dataset.date
    if (!date) return
    const target = this.data.calendarDays.find(item => item.date === date)
    if (!target || target.disabled) return

    let tempSelectedDates = [...this.data.tempSelectedDates]

    if (tempSelectedDates.includes(date)) {
      tempSelectedDates = tempSelectedDates.filter(item => item !== date)
    } else {
      tempSelectedDates.push(date)
    }

    const calendarDays = this.data.calendarDays.map(item => {
      if (item.date === date) {
        return {
          ...item,
          selected: !item.selected
        }
      }
      return item
    })

    this.setData({
      tempSelectedDates,
      tempSelectedDateSummary: this.formatSelectedDates(tempSelectedDates),
      calendarDays
    })
  },

  confirmDateSelection() {
    if (!this.data.tempSelectedDates.length) {
      wx.showToast({
        title: '请至少选择一个日期',
        icon: 'none'
      })
      return
    }

    const selectedDates = [...this.data.tempSelectedDates]
      .filter(date => this.isSelectableDateKey(date))
      .sort()

    if (!selectedDates.length) {
      wx.showToast({
        title: '请选择未来一个月内的日期',
        icon: 'none'
      })
      return
    }

    this.setData({
      selectedDates,
      selectedDateSummary: this.formatSelectedDates(selectedDates),
      showDatePopup: false
    }, () => {
      this.syncComputedData()
    })
  },

  toggleTimeSlot(e) {
    const value = e.currentTarget.dataset.value
    let timeSlots = [...this.data.timeSlots]

    if (value === '不限') {
      const anytimeSelected = timeSlots.find(item => item.value === '不限')?.selected
      timeSlots = timeSlots.map(item => ({
        ...item,
        selected: item.value === '不限' ? !anytimeSelected : false
      }))
    } else {
      timeSlots = timeSlots.map(item => {
        if (item.value === '不限') {
          return {
            ...item,
            selected: false
          }
        }
        if (item.value === value) {
          return {
            ...item,
            selected: !item.selected
          }
        }
        return item
      })

      const hasSelectedNormal = timeSlots.some(item => item.value !== '不限' && item.selected)
      if (!hasSelectedNormal) {
        timeSlots = timeSlots.map(item => ({
          ...item,
          selected: item.value === '不限'
        }))
      }
    }

    this.setData({ timeSlots }, () => {
      this.calculateSuggestedPrice()
    })
  },

  chooseDuration(e) {
    const value = Number(e.currentTarget.dataset.value)

    if (value === 999) {
      this.setData({
        showCustomDuration: true
      }, () => {
        this.syncDurationQuickOptions()
      })
      return
    }

    this.setData({
      durationMinutes: value,
      showCustomDuration: false
    }, () => {
      this.syncDurationQuickOptions()
      this.calculateSuggestedPrice()
    })
  },

  decreaseDuration() {
    const next = Math.max(10, this.data.durationMinutes - 10)
    this.setData({
      durationMinutes: next,
      showCustomDuration: true
    }, () => {
      this.syncDurationQuickOptions()
      this.calculateSuggestedPrice()
    })
  },

  increaseDuration() {
    const next = this.data.durationMinutes + 10
    this.setData({
      durationMinutes: next,
      showCustomDuration: true
    }, () => {
      this.syncDurationQuickOptions()
      this.calculateSuggestedPrice()
    })
  },

  syncDurationQuickOptions() {
    const durationQuickOptions = this.data.durationQuickOptions.map(item => {
      if (item.value === 999) {
        return {
          ...item,
          active: this.data.showCustomDuration
        }
      }
      return {
        ...item,
        active: !this.data.showCustomDuration && item.value === this.data.durationMinutes
      }
    })

    this.setData({ durationQuickOptions })
  },

  calculateSuggestedPrice() {
    const selectedPets = this.getSelectedPets()
    const petCount = selectedPets.length

    let price = 49

    if (this.data.durationMinutes >= 40) price += 10
    if (this.data.durationMinutes >= 60) price += 10
    if (this.data.durationMinutes >= 90) price += 10

    if (petCount > 1) {
      price += (petCount - 1) * 10
    }

    const selectedSlots = (this.data.timeSlots || []).filter(item => item.selected).map(item => item.value)
    const concreteSlotCount = selectedSlots.filter(item => item !== '不限').length
    if (concreteSlotCount > 1) {
      price += (concreteSlotCount - 1) * 5
    }
    if (selectedSlots.some(item => String(item).indexOf('20:00') === 0)) {
      price += 10
    }

    const suggestedUnitPrice = String(Math.round(price))

    this.setData({
      suggestedUnitPrice,
      lastSuggestedUnitPrice: suggestedUnitPrice,
      unitPrice: suggestedUnitPrice,
      unitPriceTouched: false
    }, () => {
      this.syncComputedData()
    })
  },

  onUnitPriceInput(e) {
    this.setData({
      unitPrice: e.detail.value,
      unitPriceTouched: true
    }, () => {
      this.syncComputedData()
    })
  },

  syncUnitPriceToSuggested() {
    this.setData({
      unitPrice: this.data.suggestedUnitPrice,
      unitPriceTouched: false
    }, () => {
      this.syncComputedData()
    })
  },

  onRemarkInput(e) {
    this.setData({
      remark: e.detail.value
    })
  },

  syncComputedData() {
    const serviceCount = this.data.selectedDates.length
    const unitPriceNum = Number(this.data.unitPrice || 0)
    const totalPrice = unitPriceNum * serviceCount

    this.setData({
      serviceCount,
      unitPriceDisplay: String(Math.round(unitPriceNum)),
      totalPriceDisplay: String(Math.round(totalPrice)),
      selectedDateSummary: this.formatSelectedDates(this.data.selectedDates)
    })
  },

  formatDateKey(date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  },

  isSelectableDateKey(dateKey) {
    if (!dateKey) return false
    const date = new Date(`${dateKey}T00:00:00`)
    if (Number.isNaN(date.getTime())) return false

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const maxDate = new Date(today)
    maxDate.setMonth(maxDate.getMonth() + 1)

    return date >= today && date <= maxDate
  },

  validateForm() {
    const selectedPets = this.getSelectedPets()
    const { selectedAddress, selectedDates, timeSlots, unitPrice } = this.data
    const selectedSlots = timeSlots.filter(item => item.selected)

    if (!selectedAddress) {
      wx.showToast({ title: '请选择服务地址', icon: 'none' })
      return false
    }

    if (!selectedPets.length) {
      wx.showToast({ title: '请至少选择一只宠物', icon: 'none' })
      return false
    }

    if (!selectedDates.length) {
      wx.showToast({ title: '请至少选择一个服务日期', icon: 'none' })
      return false
    }

    if (selectedDates.some(date => !this.isSelectableDateKey(date))) {
      wx.showToast({ title: '服务日期仅支持今天起未来一个月', icon: 'none' })
      return false
    }

    if (!selectedSlots.length) {
      wx.showToast({ title: '请选择上门时间段', icon: 'none' })
      return false
    }

    if (!unitPrice || Number(unitPrice) <= 0) {
      wx.showToast({ title: '请填写有效的单次价格', icon: 'none' })
      return false
    }

    return true
  },

  submitOrder() {
    if (!this.validateForm()) return
    if (this.data.submitting) return

    const currentUser = wx.getStorageSync('currentUser') || { id: 1 }
    const selectedPets = this.getSelectedPets()
    const primaryPet = this.getPrimaryPet()
    const selectedAddress = this.data.selectedAddress
    const selectedSlots = this.data.timeSlots.filter(item => item.selected).map(item => item.value)

    this.setData({ submitting: true })

    const isReschedule = this.data.isReschedule
    const requestUrl = isReschedule
      ? `/api/orders/${this.data.rescheduleOrderId}/reschedule`
      : '/api/orders/createOrder'

    wx.showModal({
      title: isReschedule ? '确认修改预约？' : '确认下单',
      content: isReschedule
        ? '修改后订单将重新进入待接单状态，价格可能发生变化。'
        : '当前暂未开通线上支付，确认后将直接提交订单，并进入待接单状态。',
      confirmText: isReschedule ? '确认修改' : '确认下单',
      cancelText: '取消',
      success: (res) => {
        if (!res.confirm) {
          this.setData({ submitting: false })
          return
        }

        wx.showLoading({ title: '提交中' })

        request(requestUrl, 'POST', {
          userId: currentUser.id,

          petId: primaryPet ? primaryPet.id : null,
          petIds: selectedPets.map(item => item.id),
          petName: primaryPet ? primaryPet.name : '',
          petType: primaryPet ? primaryPet.type : '',
          petBreed: primaryPet ? primaryPet.breed : '',
          petImageUrl: primaryPet ? (primaryPet.avatarUrl || primaryPet.imageUrl) : '',
          petCount: selectedPets.length,

          addressId: selectedAddress.id,
          serviceContactName: selectedAddress.contactName,
          serviceContactPhone: selectedAddress.contactPhone,
          serviceProvince: selectedAddress.province,
          serviceCity: selectedAddress.city,
          serviceDistrict: selectedAddress.district,
          serviceDetailAddress: selectedAddress.detailAddress,
          serviceLatitude: selectedAddress.latitude,
          serviceLongitude: selectedAddress.longitude,

          serviceDates: this.data.selectedDates,
          timeSlots: selectedSlots,
          serviceDurationMinutes: this.data.durationMinutes,

          suggestedUnitPrice: this.data.suggestedUnitPrice,
          serviceFee: this.data.unitPrice,
          totalPrice: this.data.totalPriceDisplay,

          remark: this.data.remark,
          specialRequirement: this.data.remark,

          orderStatus: 'WAIT_TAKING',
          payStatus: 'UNPAID'
        }).then((res) => {
          wx.hideLoading()
          const orderId = isReschedule
            ? (res && (res.newOrderId || (res.data && res.data.newOrderId)))
            : (res && (res.id || (res.data && res.data.id)))

          wx.removeStorageSync('selectedServiceAddress')

          const goDetail = () => {
            if (orderId) {
              wx.navigateTo({
                url: `/pages/order/detail/index?id=${orderId}`
              })
            } else {
              wx.redirectTo({
                url: '/pages/order/list/index'
              })
            }
          }

          if (isReschedule) {
            this.showRescheduleResult(res, goDetail)
            return
          }

          wx.showToast({
            title: '下单成功',
            icon: 'success'
          })

          setTimeout(goDetail, 800)
        }).catch(() => {
          wx.hideLoading()
        }).finally(() => {
          this.setData({ submitting: false })
        })
      },
      fail: () => {
        this.setData({ submitting: false })
      }
    })
  },

  showRescheduleResult(res, next) {
    const diff = Math.round(Number(res && res.priceDiff || 0))
    if (res && res.priceChangeType === 'INCREASE' && diff > 0) {
      wx.showModal({
        title: '需要补差价',
        content: `本次修改增加费用 ¥${diff}`,
        confirmText: '去支付',
        showCancel: false,
        success: () => next()
      })
      return
    }

    if (res && res.priceChangeType === 'DECREASE' && diff > 0) {
      wx.showModal({
        title: '修改成功',
        content: `已更新预约，正在为你重新匹配接单师。已为你退回 ¥${diff}`,
        confirmText: '知道了',
        showCancel: false,
        success: () => next()
      })
      return
    }

    wx.showToast({
      title: '已更新预约',
      icon: 'success'
    })
    setTimeout(next, 800)
  }
})
