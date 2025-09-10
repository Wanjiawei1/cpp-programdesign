// pages/order/confirm/confirm.js
const { cartAPI, orderAPI, addressAPI } = require('../../../utils/api.js')
const app = getApp()

Page({
  data: {
    cartItems: [],
    totalAmount: 0,
    totalAmountText: '¥0.00',
    finalAmountText: '¥3.00', // 实付金额（含配送费）
    selectedAddress: null,
    remark: '',
    payMethod: 1 // 1-微信支付
  },

  onLoad: function() {
    this.loadCartItems()
    this.loadDefaultAddress()
  },

  onShow: function() {
    this.loadDefaultAddress()
  },

  // 加载购物车商品
  loadCartItems: function() {
    cartAPI.getList().then(res => {
      const cartItems = res.data.map(item => ({
        ...item,
        totalPrice: (item.amount * item.number).toFixed(2)  // 预计算总价
      }))
      const totalAmount = cartItems.reduce((sum, item) => sum + (item.amount * item.number), 0)  // 单价 × 数量
      const totalAmountText = `¥${totalAmount.toFixed(2)}`
      const finalAmountText = `¥${(totalAmount + 3).toFixed(2)}`
      this.setData({ 
        cartItems, 
        totalAmount, 
        totalAmountText,
        finalAmountText
      })
    })
  },

  // 加载默认地址
  loadDefaultAddress: function() {
    addressAPI.getDefault().then(res => {
      this.setData({ selectedAddress: res.data })
    }).catch(() => {
      // 没有默认地址，获取地址列表的第一个
      addressAPI.getList().then(res => {
        if (res.data.length > 0) {
          this.setData({ selectedAddress: res.data[0] })
        }
      })
    })
  },

  // 选择收货地址
  selectAddress: function() {
    wx.navigateTo({
      url: '/pages/address/address?select=true'
    })
  },

  // 备注输入
  onRemarkInput: function(e) {
    this.setData({ remark: e.detail.value })
  },

  // 选择支付方式
  selectPayment: function() {
    wx.showActionSheet({
      itemList: ['微信支付', '支付宝'],
      success: (res) => {
        this.setData({ payMethod: res.tapIndex + 1 })
      }
    })
  },

  // 提交订单
  submitOrder: function() {
    if (!this.data.selectedAddress) {
      wx.showToast({
        title: '请选择收货地址',
        icon: 'none'
      })
      return
    }

    if (this.data.cartItems.length === 0) {
      wx.showToast({
        title: '购物车为空',
        icon: 'none'
      })
      return
    }

    wx.showLoading({ title: '提交中...' })

    const orderData = {
      addressBookId: this.data.selectedAddress.id,
      payMethod: this.data.payMethod,
      remark: this.data.remark || '',
      estimatedDeliveryTime: null, // 尽快送达
      deliveryStatus: 1, // 立即送出
      tablewareNumber: 0, // 修改：不能为null，使用0
      tablewareStatus: 0,
      packAmount: 0,
      amount: this.data.totalAmount // 修改：直接使用数字，让后端处理BigDecimal转换
    }

    orderAPI.submit(orderData).then(res => {
      console.log('订单提交成功响应:', res)
      wx.hideLoading()
      
      // 清空购物车
      app.globalData.cartCount = 0
      
      wx.showToast({
        title: '订单提交成功',
        icon: 'success'
      })
      
      // 跳转到订单列表页面
      console.log('准备跳转到订单页面...')
      setTimeout(() => {
        console.log('执行跳转...')
        wx.switchTab({
          url: '/pages/order/order',
          success: () => {
            console.log('跳转成功')
          },
          fail: (err) => {
            console.error('跳转失败:', err)
          }
        })
      }, 1500)
      
    }).catch(err => {
      console.error('订单提交失败:', err)
      wx.hideLoading()
      wx.showToast({
        title: err.msg || '提交失败',
        icon: 'none'
      })
    })
  }
})
