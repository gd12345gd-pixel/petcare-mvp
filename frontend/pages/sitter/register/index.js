const { BASE_URL, request } = require('../../../utils/request')
const { ensureLogin, getToken } = require('../../../utils/auth')

const defaultForm = {
  realName: '',
  phone: '',
  gender: '',
  age: '',
  city: '',
  serviceArea: '',
  petTypes: 'BOTH',
  experience: 'NONE',
  hasPetExperience: true,
  availableTimes: ['ALL_DAY'],
  introduction: '',
  idCardNo: '',
  idCardFrontUrl: '',
  idCardBackUrl: '',
  certificateUrl: ''
}

Page({
  data: {
    loading: true,
    submitting: false,
    step: 'intro',
    profile: null,
    rules: null,
    form: { ...defaultForm },
    mode: 'apply',
    sitterAgreementChecked: false,
    depositRuleChecked: false,
    petTypeOptions: [
      { value: 'CAT', label: '猫', checked: false },
      { value: 'DOG', label: '狗', checked: false },
      { value: 'BOTH', label: '猫狗都可以', checked: true }
    ],
    experienceOptions: [
      { value: 'NONE', label: '无经验', checked: true },
      { value: 'LESS_THAN_1_YEAR', label: '1年以内', checked: false },
      { value: '1_TO_3_YEARS', label: '1-3年', checked: false },
      { value: 'OVER_3_YEARS', label: '3年以上', checked: false }
    ],
    timeOptions: [
      { value: 'MORNING', label: '上午', checked: false },
      { value: 'AFTERNOON', label: '下午', checked: false },
      { value: 'EVENING', label: '晚上', checked: false },
      { value: 'ALL_DAY', label: '全天', checked: true }
    ]
  },

  onLoad() {
    if (!ensureLogin().id) return
    this.loadData()
  },

  navigateBack() {
    const pages = getCurrentPages()
    if (pages.length > 1) {
      wx.navigateBack({ delta: 1 })
      return
    }
    wx.switchTab({ url: '/pages/profile/index' })
  },

  loadData() {
    this.setData({ loading: true })
    Promise.all([
      request('/api/sitter/me', 'GET'),
      request('/api/sitter/rules', 'GET')
    ]).then(([profile, rules]) => {
      this.setData({
        profile,
        rules,
        step: this.resolveStep(profile),
        form: this.buildForm(profile),
        mode: profile && profile.auditStatus === 'REJECTED' ? 'resubmit' : 'apply'
      }, () => this.refreshOptions())
    }).finally(() => {
      this.setData({ loading: false })
    })
  },

  resolveStep(profile) {
    if (!profile || !profile.auditStatus || profile.auditStatus === 'NOT_SUBMITTED') return 'intro'
    if (profile.auditStatus === 'PENDING') return 'pending'
    if (profile.auditStatus === 'REJECTED') return 'rejected'
    if (profile.canAcceptOrder) return 'ready'
    return 'approved'
  },

  buildForm(profile) {
    if (!profile || !profile.id) return { ...defaultForm }
    return {
      ...defaultForm,
      realName: profile.realName || '',
      phone: profile.phone || '',
      gender: profile.gender || '',
      age: profile.age || '',
      city: profile.city || '',
      serviceArea: profile.serviceArea || '',
      petTypes: profile.petTypes || 'BOTH',
      experience: profile.experience || 'NONE',
      hasPetExperience: profile.hasPetExperience !== false,
      availableTimes: profile.availableTimes ? profile.availableTimes.split(',') : ['ALL_DAY'],
      introduction: profile.introduction || '',
      idCardNo: '',
      idCardFrontUrl: profile.idCardFrontUrl || '',
      idCardBackUrl: profile.idCardBackUrl || '',
      certificateUrl: profile.certificateUrl || ''
    }
  },

  startApply() {
    this.setData({ step: 'basic' })
  },

  resubmit() {
    this.setData({
      mode: 'resubmit',
      step: 'basic',
      form: this.buildForm(this.data.profile)
    })
  },

  nextAbility() {
    const { realName, phone, serviceArea } = this.data.form
    if (!realName || !phone || !serviceArea) {
      wx.showToast({ title: '请填写必填基础信息', icon: 'none' })
      return
    }
    this.setData({ step: 'ability' })
  },

  nextIdentity() {
    if (!this.data.form.introduction) {
      wx.showToast({ title: '请填写个人简介', icon: 'none' })
      return
    }
    this.setData({ step: 'identity' })
  },

  backBasic() {
    this.setData({ step: 'basic' })
  },

  backAbility() {
    this.setData({ step: 'ability' })
  },

  goDeposit() {
    this.setData({ step: 'deposit' })
  },

  goOrders() {
    wx.switchTab({ url: '/pages/sitter/index' })
  },

  goWorkbench() {
    wx.navigateTo({ url: '/pages/sitter/workbench/index' })
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field
    if (!field) return
    this.setData({
      [`form.${field}`]: e.detail.value
    })
  },

  toggleSitterAgreement() {
    this.setData({
      sitterAgreementChecked: !this.data.sitterAgreementChecked
    })
  },

  toggleDepositRule() {
    this.setData({
      depositRuleChecked: !this.data.depositRuleChecked
    })
  },

  openAgreement(e) {
    const type = e.currentTarget.dataset.type || 'sitter'
    wx.navigateTo({
      url: `/pages/agreement/index?type=${type}`
    })
  },

  onPetTypeChange(e) {
    this.setData({ 'form.petTypes': e.detail.value }, () => this.refreshOptions())
  },

  onExperienceChange(e) {
    this.setData({ 'form.experience': e.detail.value }, () => this.refreshOptions())
  },

  onHasPetChange(e) {
    this.setData({ 'form.hasPetExperience': e.detail.value === 'true' })
  },

  onTimesChange(e) {
    this.setData({ 'form.availableTimes': e.detail.value }, () => this.refreshOptions())
  },

  refreshOptions() {
    const form = this.data.form
    const selectedTimes = form.availableTimes || []
    this.setData({
      petTypeOptions: this.data.petTypeOptions.map(item => ({
        ...item,
        checked: item.value === form.petTypes
      })),
      experienceOptions: this.data.experienceOptions.map(item => ({
        ...item,
        checked: item.value === form.experience
      })),
      timeOptions: this.data.timeOptions.map(item => ({
        ...item,
        checked: selectedTimes.indexOf(item.value) > -1
      }))
    })
  },

  uploadImage(e) {
    const field = e.currentTarget.dataset.field
    if (!field) return

    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const file = res.tempFiles && res.tempFiles[0]
        if (!file || !file.tempFilePath) return
        wx.showLoading({ title: '上传中' })
        wx.uploadFile({
          url: `${BASE_URL}/api/files/upload-image`,
          filePath: file.tempFilePath,
          name: 'file',
          header: {
            Authorization: `Bearer ${getToken()}`
          },
          success: (uploadRes) => {
            const data = JSON.parse(uploadRes.data || '{}')
            if (data.code === 0 && data.data && data.data.url) {
              this.setData({ [`form.${field}`]: data.data.url })
              wx.showToast({ title: '上传成功', icon: 'success' })
              return
            }
            wx.showToast({ title: data.message || '上传失败', icon: 'none' })
          },
          fail: () => {
            wx.showToast({ title: '上传失败', icon: 'none' })
          },
          complete: () => {
            wx.hideLoading()
          }
        })
      }
    })
  },

  submitApply() {
    const form = this.data.form
    if (!this.data.sitterAgreementChecked) {
      wx.showToast({ title: '请先阅读并同意接单师服务协议', icon: 'none' })
      return
    }
    if (!form.idCardNo || !form.idCardFrontUrl || !form.idCardBackUrl) {
      wx.showToast({ title: '请补全实名资料', icon: 'none' })
      return
    }

    this.setData({ submitting: true })
    const payload = {
      ...form,
      age: form.age ? Number(form.age) : null,
      availableTimes: (form.availableTimes || []).join(',')
    }
    const method = this.data.mode === 'resubmit' ? 'PUT' : 'POST'
    request('/api/sitter/apply', method, payload).then((profile) => {
      this.setData({
        profile,
        step: 'pending'
      })
      wx.showToast({ title: '已提交审核', icon: 'success' })
    }).finally(() => {
      this.setData({ submitting: false })
    })
  },

  payDeposit() {
    if (!this.data.depositRuleChecked) {
      wx.showToast({ title: '请先阅读并同意押金规则', icon: 'none' })
      return
    }
    wx.showModal({
      title: '确认缴纳押金',
      content: '第一版为模拟支付，确认后押金状态将变为已缴纳。',
      success: (res) => {
        if (!res.confirm) return
        request('/api/sitter/deposit/pay', 'POST').then((profile) => {
          this.setData({
            profile,
            step: 'ready'
          })
          wx.showToast({ title: '缴纳成功', icon: 'success' })
        })
      }
    })
  }
})
