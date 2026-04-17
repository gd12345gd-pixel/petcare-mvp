const { request, BASE_URL } = require('../../utils/request')

Page({
  data: {
    pets: [],
    selectedPetId: null,

    selectedAddress: null,

    showPetPopup: false,
    newPet: {
      name: '',
      type: '狗狗',
      breed: '',
      imageUrl: ''
    },
    newPetTypeOptions: ['狗狗', '猫咪', '其他'],
    newPetTypeIndex: 0,

    uploadingPetImage: false,
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
  },

  navigateBack() {
    wx.navigateBack()
  },

  noop() {},

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

  loadPetList() {
    const currentUser = wx.getStorageSync('currentUser') || { id: 1 }

    request(`/api/pet/list?userId=${currentUser.id}`, 'GET')
      .then((list) => {
        const pets = list || []
        this.setData({
          pets,
          selectedPetId: pets.length ? pets[0].id : null
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

  goChooseAddress() {
    wx.navigateTo({
      url: '/pages/address-list/index?from=orderCreate'
    })
  },

  openAddPetPopup() {
    this.setData({
      showPetPopup: true,
      newPet: {
        name: '',
        type: '狗狗',
        breed: '',
        imageUrl: ''
      },
      newPetTypeIndex: 0
    })
  },

  closeAddPetPopup() {
    this.setData({
      showPetPopup: false
    })
  },

  onNewPetInput(e) {
    const field = e.currentTarget.dataset.field
    const value = e.detail.value
    this.setData({
      [`newPet.${field}`]: value
    })
  },

  chooseNewPetType(e) {
    const index = Number(e.currentTarget.dataset.index)
    const type = this.data.newPetTypeOptions[index]
    this.setData({
      newPetTypeIndex: index,
      'newPet.type': type
    })
  },

  chooseNewPetImage() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      success: (res) => {
        const tempPath = res.tempFiles[0].tempFilePath
        this.uploadNewPetImage(tempPath)
      }
    })
  },

  uploadNewPetImage(filePath) {
    this.setData({ uploadingPetImage: true })
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
              'newPet.imageUrl': data.data.url
            })
            wx.showToast({
              title: '上传成功',
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
            title: '图片解析失败',
            icon: 'none'
          })
        }
      },
      fail: () => {
        wx.showToast({
          title: '图片上传失败',
          icon: 'none'
        })
      },
      complete: () => {
        this.setData({ uploadingPetImage: false })
        wx.hideLoading()
      }
    })
  },

  saveNewPet() {
    const { newPet } = this.data
    const currentUser = wx.getStorageSync('currentUser') || { id: 1 }

    if (!newPet.name) {
      wx.showToast({ title: '请输入宠物名字', icon: 'none' })
      return
    }
    if (!newPet.imageUrl) {
      wx.showToast({ title: '请上传宠物照片', icon: 'none' })
      return
    }

    request('/api/pet/create', 'POST', {
      userId: currentUser.id,
      name: newPet.name,
      type: newPet.type,
      breed: newPet.breed,
      imageUrl: newPet.imageUrl
    }).then((data) => {
      this.setData({
        showPetPopup: false
      })

      wx.showToast({
        title: '新增宠物成功',
        icon: 'success'
      })

      this.loadPetList()

      if (data && data.id) {
        this.setData({
          selectedPetId: data.id
        })
      }
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
    if (!form.description) {
      wx.showToast({ title: '请填写详细描述', icon: 'none' })
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

    request('/api/order-create/submit', 'POST', {
      userId: currentUser.id,

      petId: selectedPet.id,
      petName: selectedPet.name,
      petType: selectedPet.type,
      petBreed: selectedPet.breed,
      petImageUrl: selectedPet.imageUrl,

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

      description: form.description,
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