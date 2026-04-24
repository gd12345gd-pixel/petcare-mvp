const { request } = require('../../../utils/request')

Page({
  data: {
    statusBarHeight: 20,
    navBarHeight: 44,
    navTotalHeight: 64,

    defaultPetImage: 'https://dummyimage.com/200x200/f3f4f6/b3b7c0.png&text=PET',

    pets: [],
    selectedPetIds: [],

    selectedAddress: null,

    selectedDates: [],
    selectedDateSummary: '',

    showDatePopup: false,
    calendarMonthText: '',
    calendarDays: [],
    tempSelectedDates: [],
    tempSelectedDateSummary: '',

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
    showCustomDuration: false,
    durationQuickOptions: [
      { value: 30, label: '30分钟', active: false },
      { value: 40, label: '40分钟', active: true },
      { value: 60, label: '60分钟', active: false },
      { value: 90, label: '90分钟', active: false },
      { value: 999, label: '自定义', active: false }
    ],

    suggestedUnitPrice: '59.00',
    lastSuggestedUnitPrice: '59.00',
    unitPrice: '59.00',
    unitPriceDisplay: '59.00',
    unitPriceTouched: false,

    totalPriceDisplay: '0.00',
    serviceCount: 0,

    remark: '',
    submitting: false
  },

  onLoad() {
    const systemInfo = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()
    const statusBarHeight = systemInfo.statusBarHeight || 20
    const navBarHeight = 44

    this.setData({
      statusBarHeight,
      navBarHeight,
      navTotalHeight: statusBarHeight + navBarHeight
    })

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

    const suggestedUnitPrice = price.toFixed(2)

    if (!this.data.unitPriceTouched) {
      this.setData({
        suggestedUnitPrice,
        lastSuggestedUnitPrice: suggestedUnitPrice,
        unitPrice: suggestedUnitPrice
      }, () => {
        this.syncComputedData()
      })
      return
    }

    this.setData({
      suggestedUnitPrice,
      lastSuggestedUnitPrice: suggestedUnitPrice
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
      unitPriceDisplay: unitPriceNum.toFixed(2),
      totalPriceDisplay: totalPrice.toFixed(2),
      selectedDateSummary: this.formatSelectedDates(this.data.selectedDates)
    })
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
          wx.showToast({
            title: '下单成功',
            icon: 'success'
          })

          const orderId = res && (res.id || (res.data && res.data.id))

          wx.removeStorageSync('selectedServiceAddress')

          setTimeout(() => {
            if (orderId) {
              wx.navigateTo({
                url: `/pages/order/detail/index?id=${orderId}`
              })
            } else {
              wx.redirectTo({
                url: '/pages/order/list/index'
              })
            }
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
