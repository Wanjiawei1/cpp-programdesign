// pages/address/address.js
const { addressAPI } = require('../../utils/api.js')

Page({
  data: {
    addressList: [],
    loading: false,
    isSelectMode: false // 是否为选择地址模式
  },

  onLoad: function(options) {
    this.setData({ isSelectMode: options.select === 'true' })
    this.loadAddressList()
  },

  onShow: function() {
    this.loadAddressList()
  },

  // 加载地址列表
  loadAddressList: function() {
    this.setData({ loading: true })
    
    addressAPI.getList().then(res => {
      this.setData({ 
        addressList: res.data,
        loading: false 
      })
    }).catch(err => {
      this.setData({ loading: false })
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      })
    })
  },

  // 选择地址
  selectAddress: function(e) {
    if (this.data.isSelectMode) {
      const address = e.currentTarget.dataset.address
      
      // 设置为默认地址
      addressAPI.setDefault(address).then(() => {
        wx.navigateBack()
      })
    }
  },

  // 选择地址（选择模式下）
  selectAddress: function(e) {
    if (this.data.selectMode) {
      const address = e.currentTarget.dataset.address
      // 将选中的地址传递给上一个页面
      const pages = getCurrentPages()
      const prevPage = pages[pages.length - 2]
      if (prevPage) {
        prevPage.setData({ selectedAddress: address })
      }
      wx.navigateBack()
    }
  },

  // 编辑地址
  editAddress: function(e) {
    const address = e.currentTarget.dataset.address
    wx.navigateTo({
      url: `/pages/address/edit/edit?id=${address.id}`
    })
  },

  // 设置默认地址
  setDefault: function(e) {
    const addressId = e.currentTarget.dataset.id
    wx.showLoading({ title: '设置中...' })
    
    api.addressAPI.setDefault(addressId).then(res => {
      wx.hideLoading()
      if (res.code === 1) {
        wx.showToast({
          title: '设置成功',
          success: () => {
            this.loadAddressList()
          }
        })
      } else {
        wx.showToast({
          title: res.msg || '设置失败',
          icon: 'error'
        })
      }
    }).catch(err => {
      wx.hideLoading()
      wx.showToast({
        title: '网络错误',
        icon: 'error'
      })
    })
  },

  // 删除地址
  deleteAddress: function(e) {
    const id = e.currentTarget.dataset.id
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个地址吗？',
      success: (res) => {
        if (res.confirm) {
          addressAPI.delete(id).then(() => {
            wx.showToast({
              title: '删除成功',
              icon: 'success'
            })
            this.loadAddressList()
          }).catch(err => {
            wx.showToast({
              title: '删除失败',
              icon: 'none'
            })
          })
        }
      }
    })
  },

  // 新增地址
  addAddress: function() {
    wx.navigateTo({
      url: '/pages/address/edit/edit'
    })
  }
})
