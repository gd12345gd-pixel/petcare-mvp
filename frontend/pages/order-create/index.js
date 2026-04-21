const { request } = require('../../utils/request')

Page({
  data: {
    pets: [],
    selectedPetId: null,

    selectedAddress: null,

    submitting: false,

    form: {
      serviceFee: '',
      description: '',
      specialRequirement: ''
    },

    showTimePopup: false,
    calendarMonthText: '',
    calendarDays: [],
    selectedDates: [],
    selectedTimeSummary: '',
    timeSlots: [
      { label: '时间不限', value: '不限', selected: false, recommend: true },
      { label: '08:00-10:00', value: '08:00-10:00', selected: false, recommend: false },
      { label: '10:00-12:00', value: '10:00-12:00', selected: false, recommend: false },
      { label: '12:00-14:00', value: '12:00-14:00', selected: false, recommend: false },
      { label: '14:00-16:00', value: '14:00-16:00', selected: false, recommend: false },
      { label: '16:00-18:00', value: '16:00-18:00', selected: false, recommend: false },
      { label: '18:00-20:00', value: '18:00-20:00', selected: false, recommend: true },
      { label: '20:00-22:00', value: '20:00-22:00', selected: false, recommend: false }
    ]
  },

  onLoad() {
    this.buildCalendar()
    this.loadPetList()
  },

  onShow() {
    const selectedAddress = wx.getStorageSync('selectedServiceAddress')
    if (selectedAddress) {
      this.setData({
        selectedAddress
      })
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

  onInput(e) {
    const field = e.currentTarget.dataset.field
    const value = e.detail.value
    this.setData({
      [`form.${field}`]: value
    })
  },

  getSelectedPet() {
    return this.data.pets.find(item => item.id === this.data.selectedPetId) || null
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

  goAddPet() {
    wx.navigateTo({
      url: '/pages/pet-edit/index'
    })
  },

  goChooseAddress() {
    wx.navigateTo({
      url: '/pages/address-list/index?from=orderCreate'
    })
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

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      days.push({
        id: dateStr,
        day: d,
        date: dateStr,
        selected: this.data.selectedDates.includes(dateStr)
      })
    }

    this.setData({
      calendarMonthText: `${month}月 ${year}`,
      calendarDays: days
    })
  },

  openTimePopup() {
    this.buildCalendar()
    this.setData({
      showTimePopup: true
    })
  },

  closeTimePopup() {
    this.setData({
      showTimePopup: false
    })
  },

  toggleDateSelect(e) {
    const date = e.currentTarget.dataset.date
    if (!date) return

    let selectedDates = [...this.data.selectedDates]
    if (selectedDates.includes(date)) {
      selectedDates = selectedDates.filter(item => item !== date)
    } else {
      selectedDates.push(date)
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
      selectedDates,
      calendarDays
    })
  },

  toggleTimeSlot(e) {
    const value = e.currentTarget.dataset.value
    let timeSlots = [...this.data.timeSlots]

    if (value === '不限') {
      timeSlots = timeSlots.map(item => ({
        ...item,
        selected: item.value === '不限' ? !item.selected : false
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
    }

    this.setData({
      timeSlots
    })
  },

  formatSelectedDates(dates) {
    return [...dates]
      .sort()
      .map(date => {
        const [, month, day] = date.split('-')
        return `${Number(month)}/${Number(day)}`
      })
      .join('、')
  },

  confirmTimeSelection() {
    const selectedSlots = this.data.timeSlots.filter(item => item.selected)

    if (!this.data.selectedDates.length) {
      wx.showToast({
        title: '请至少选择一个日期',
        icon: 'none'
      })
      return
    }

    if (!selectedSlots.length) {
      wx.showToast({
        title: '请至少选择一个时间段',
        icon: 'none'
      })
      return
    }

    const dateText = this.formatSelectedDates(this.data.selectedDates)
    const slotText = selectedSlots.map(item => item.label).join('、')

    this.setData({
      showTimePopup: false,
      selectedTimeSummary: `${dateText} · ${slotText}`
    })
  },

  validateForm() {
    const selectedPet = this.getSelectedPet()
    const { form, selectedAddress, selectedDates, timeSlots } = this.data
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
      wx.showToast({ title: '请选择服务日期', icon: 'none' })
      return false
    }
    if (!selectedSlots.length) {
      wx.showToast({ title: '请选择时间段', icon: 'none' })
      return false
    }
    if (!form.serviceFee) {
      wx.showToast({ title: '请输入服务费用', icon: 'none' })
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
    const { form, selectedDates, timeSlots } = this.data
    const selectedSlots = timeSlots.filter(item => item.selected).map(item => item.value)

    this.setData({ submitting: true })
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

      serviceDates: selectedDates,
      timeSlots: selectedSlots,
      serviceFee: form.serviceFee,

      remark: form.specialRequirement,
specialRequirement: form.specialRequirement
    }).then(() => {
      wx.hideLoading()
      wx.showToast({
        title: '提交成功',
        icon: 'success'
      })
      wx.removeStorageSync('selectedServiceAddress')
      setTimeout(() => {
        wx.navigateBack()
      }, 800)
    }).catch(() => {
      wx.hideLoading()
    }).finally(() => {
      this.setData({ submitting: false })
    })
  }
})