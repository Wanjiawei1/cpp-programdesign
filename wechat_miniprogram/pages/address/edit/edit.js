// pages/address/edit/edit.js
const { addressAPI } = require('../../../utils/api.js')

Page({
  data: {
    isEdit: false,
    addressData: {
      consignee: '',
      phone: '',
      provinceName: '',
      cityName: '',
      districtName: '',
      detail: '',
      isDefault: 0
    },
    region: ['', '', ''],
    canSave: false
  },

  onLoad: function(options) {
    if (options.id) {
      this.setData({ isEdit: true })
      this.loadAddressDetail(options.id)
    }
    this.checkCanSave()
  },

  // 加载地址详情
  loadAddressDetail: function(id) {
    addressAPI.getById(id).then(res => {
      const addressData = res.data
      this.setData({ 
        addressData,
        region: [addressData.provinceName, addressData.cityName, addressData.districtName]
      })
      this.checkCanSave()
    })
  },

  // 字段输入
  onFieldInput: function(e) {
    const field = e.currentTarget.dataset.field
    const value = e.detail.value
    
    this.setData({
      [`addressData.${field}`]: value
    })
    this.checkCanSave()
  },

  // 选择地区
  selectRegion: function() {
    wx.showModal({
      title: '选择地区',
      content: '请使用地区选择器选择省市区',
      showCancel: false,
      success: () => {
        // 触发地区选择器
        this.selectComponent('picker').openPicker()
      }
    })
  },

  // 地区选择变化
  onRegionChange: function(e) {
    const region = e.detail.value
    this.setData({
      region,
      'addressData.provinceName': region[0],
      'addressData.cityName': region[1],
      'addressData.districtName': region[2]
    })
    this.checkCanSave()
  },

  // 默认地址开关
  onDefaultChange: function(e) {
    this.setData({
      'addressData.isDefault': e.detail.value ? 1 : 0
    })
  },

  // 检查是否可保存
  checkCanSave: function() {
    const { consignee, phone, provinceName, cityName, districtName, detail } = this.data.addressData
    const canSave = consignee && phone && provinceName && cityName && districtName && detail
    this.setData({ canSave })
  },

  // 保存地址
  saveAddress: function() {
    if (!this.data.canSave) {
      wx.showToast({
        title: '请完善地址信息',
        icon: 'none'
      })
      return
    }

    // 验证手机号
    const phoneReg = /^1[3-9]\d{9}$/
    if (!phoneReg.test(this.data.addressData.phone)) {
      wx.showToast({
        title: '手机号格式不正确',
        icon: 'none'
      })
      return
    }

    wx.showLoading({ title: '保存中...' })

    const apiCall = this.data.isEdit ? 
      addressAPI.update(this.data.addressData) : 
      addressAPI.add(this.data.addressData)

    apiCall.then(() => {
      wx.hideLoading()
      wx.showToast({
        title: '保存成功',
        icon: 'success'
      })
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
    }).catch(err => {
      wx.hideLoading()
      wx.showToast({
        title: err.msg || '保存失败',
        icon: 'none'
      })
    })
  }
})
