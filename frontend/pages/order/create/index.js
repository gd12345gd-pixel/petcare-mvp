const { request } = require('../../../utils/request')

Page({
  data: {
    defaultPetImage: 'https://dummyimage.com/200x200/f3f4f6/b3b7c0.png&text=PET',

    pets: [],
    selectedPetId: null,

    selectedAddress: null,

    selectedDates: [],
    dateOptions: [],

    timeSlots: [
      { label: '时间不限', value: '不限', selected: false },
      { label: '08:00-10:00', value: '08:00-10:00', selected: false },
      { label: '10:00-12:00', value: '10:00-12:00', selected: false },
      { label: '12:00-14:00', value: '12:00-14:00', selected: false },
      { label: '14:00-16:00', value: '14:00-16:00', selected: false },
      { label: '16:00-18:00', value: '16:00-18:00', selected: false },
      { label: '18:00-20:00', value: '18:00-20:00', selected: false },
      { label: '20:00-22:00', value: '20:00-22:00', selected: false }
    ],

    durationMinutes: 40,
    durationQuickOptions: [
      { value: 30, label: '30分钟', active: false },
      { value: 40, label: '40分钟', active: true },
      { value: 60, label: '60分钟', active: false },
      { value: 90, label: '90分钟', active: false },
      { value: 999, label: '自定义', active: false }
    ],

    suggestedUnitPrice: '59.00',
    unitPrice: '59.00',
    unitPriceDisplay: '59.00',
    totalPriceDisplay: '0.00',
    serviceCount: 0,
    showDatePopup: false,
    calendarMonthText: '',
    calendarDays: [],
    tempSelectedDates: [],
    selectedDateSummary: '',
    tempSelectedDateSummary: '',
    showCustomDuration: false,
    remark: '',
    submitting: false
  },
  buildCalendar() {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1
  
    const daysInMonth = new Date(year, month, 0).getDate()
    const firstDay = new Date(year, month - 1, 1).getDay()
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
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      days.push({
        id: dateStr,
        day: d,
        date: dateStr,
        selected: tempSelectedDates.includes(dateStr)
      })
    }
  
    this.setData({
      calendarMonthText: `${month}月 ${year}`,
      calendarDays: days
    })
  },
  
  openDatePopup() {
    const tempSelectedDates = [...this.data.selectedDates]
    this.setData({
      showDatePopup: true,
      tempSelectedDates,
      tempSelectedDateSummary: this.formatSelectedDates(tempSelectedDates)
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
  
    const selectedDates = [...this.data.tempSelectedDates].sort()
  
    this.setData({
      selectedDates,
      selectedDateSummary: this.formatSelectedDates(selectedDates),
      showDatePopup: false
    }, () => {
      this.syncComputedData()
    })
  },
  
  formatSelectedDates(dates) {
    if (!dates || !dates.length) return ''
    return [...dates]
      .sort()
      .map(date => {
        const [, month, day] = date.split('-')
        return `${Number(month)}/${Number(day)}`
      })
      .join('、')
  },
  onLoad() {
    this.buildCalendar()
    this.loadPetList()
    this.syncDurationQuickOptions()
    this.calculateSuggestedPrice()
    this.syncComputedData()
  },
  onShow() {
    const selectedAddress = wx.getStorageSync('selectedServiceAddress')
    if (selectedAddress) {
      this.setData({ selectedAddress })
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
          wx.switchTab({
            url: '/pages/home/index'
          })
        }
      })
    } else {
      wx.switchTab({
        url: '/pages/home/index'
      })
    }
  },

  goChooseAddress() {
    wx.navigateTo({
      url: '/pages/address-list/index?from=orderCreate'
    })
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
        const pets = list || []

        let selectedPetId = null
        if (preferPetId && pets.some(item => item.id === preferPetId)) {
          selectedPetId = preferPetId
        } else if (this.data.selectedPetId && pets.some(item => item.id === this.data.selectedPetId)) {
          selectedPetId = this.data.selectedPetId
        } else if (pets.length) {
          selectedPetId = pets[0].id
        }

        this.setData({
          pets,
          selectedPetId
        })
      })
      .catch(() => {})
  },

  selectPet(e) {
    const id = Number(e.currentTarget.dataset.id)
    this.setData({
      selectedPetId: id
    })
  },

  buildDateOptions() {
    const now = new Date()
    const options = []

    for (let i = 0; i < 14; i++) {
      const date = new Date(now)
      date.setDate(now.getDate() + i)

      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const weekdayMap = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

      options.push({
        date: `${year}-${month}-${day}`,
        label: `${month}/${day}`,
        weekday: weekdayMap[date.getDay()],
        selected: i < 3
      })
    }

    const selectedDates = options.filter(item => item.selected).map(item => item.date)

    this.setData({
      dateOptions: options,
      selectedDates
    })
  },

  toggleDate(e) {
    const date = e.currentTarget.dataset.date
    if (!date) return

    const dateOptions = this.data.dateOptions.map(item => {
      if (item.date === date) {
        return {
          ...item,
          selected: !item.selected
        }
      }
      return item
    })

    const selectedDates = dateOptions.filter(item => item.selected).map(item => item.date)

    this.setData({
      dateOptions,
      selectedDates
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

    this.setData({ timeSlots })
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

  chooseDuration(e) {
    const value = Number(e.currentTarget.dataset.value)
    this.setData({
      durationMinutes: value
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
    const petCount = this.data.pets.length ? 1 : 0
    let price = 49

    if (this.data.durationMinutes >= 40) price += 10
    if (this.data.durationMinutes >= 60) price += 10
    if (this.data.durationMinutes >= 90) price += 10
    if (petCount > 1) price += 10

    const suggestedUnitPrice = price.toFixed(2)

    this.setData({
      suggestedUnitPrice
    }, () => {
      if (!this.data.unitPrice || Number(this.data.unitPrice) === 0) {
        this.setData({
          unitPrice: suggestedUnitPrice
        }, () => this.syncComputedData())
      } else {
        this.syncComputedData()
      }
    })
  },

  onUnitPriceInput(e) {
    this.setData({
      unitPrice: e.detail.value
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
      unitPriceDisplay: unitPriceNum.toFixed(2),
      totalPriceDisplay: totalPrice.toFixed(2),
      selectedDateSummary: this.formatSelectedDates(this.data.selectedDates)
    })
  },

  getSelectedPet() {
    return this.data.pets.find(item => item.id === this.data.selectedPetId) || null
  },

  validateForm() {
    const selectedPet = this.getSelectedPet()
    const { selectedAddress, selectedDates, timeSlots, unitPrice } = this.data
    const selectedSlots = timeSlots.filter(item => item.selected)

    if (!selectedAddress) {
      wx.showToast({ title: '请选择服务地址', icon: 'none' })
      return false
    }

    if (!selectedPet) {
      wx.showToast({ title: '请选择宠物', icon: 'none' })
      return false
    }

    if (!selectedDates.length) {
      wx.showToast({ title: '请至少选择一个服务日期', icon: 'none' })
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
    const selectedPet = this.getSelectedPet()
    const selectedAddress = this.data.selectedAddress
    const selectedSlots = this.data.timeSlots.filter(item => item.selected).map(item => item.value)

    this.setData({ submitting: true })

    wx.showModal({
      title: '确认下单',
      content: '当前暂未开通线上支付，确认后将直接提交订单，并进入待接单状态。',
      confirmText: '确认下单',
      cancelText: '取消',
      success: (res) => {
        if (!res.confirm) {
          this.setData({ submitting: false })
          return
        }

        wx.showLoading({ title: '提交中' })

        request('/api/orders/createOrder', 'POST', {
          userId: currentUser.id,

          petId: selectedPet.id,
          petName: selectedPet.name,
          petType: selectedPet.type,
          petBreed: selectedPet.breed,
          petImageUrl: selectedPet.avatarUrl || selectedPet.imageUrl,

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
        }).then(() => {
          wx.hideLoading()
          wx.showToast({
            title: '下单成功',
            icon: 'success'
          })
          wx.removeStorageSync('selectedServiceAddress')
          setTimeout(() => {
            wx.navigateTo({
              url: '/pages/order/detail/index'
            })
          }, 800)
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
  }
})