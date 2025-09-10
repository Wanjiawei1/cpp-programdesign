// pages/cart/cart.js
const { cartAPI } = require('../../utils/api.js')
const app = getApp()

Page({
  data: {
    cartItems: [],
    totalCount: 0,
    totalAmount: 0,
    minDeliveryAmount: 20, // 起送金额
    diffAmountText: '', // 差额文本
    totalAmountText: '¥0.00', // 格式化的总价
    loading: false
  },

  onLoad: function () {
    this.loadCartData()
  },

  onShow: function () {
    this.loadCartData()
  },

  onPullDownRefresh: function () {
    this.loadCartData().then(() => {
      wx.stopPullDownRefresh()
    })
  },

  // 加载购物车数据
  loadCartData: function () {
    // 检查登录状态
    if (!app.globalData.token) {
      this.setData({
        cartItems: [],
        totalCount: 0,
        totalAmount: 0,
        diffAmountText: `还差¥${this.data.minDeliveryAmount.toFixed(2)}起送`,
        totalAmountText: '¥0.00'
      })
      return Promise.resolve()
    }

    this.setData({ loading: true })

    return cartAPI.getList().then(res => {
      const cartItems = res.data
      let totalCount = 0
      let totalAmount = 0

      cartItems.forEach(item => {
        totalCount += item.number
        totalAmount += item.amount * item.number  // 单价 × 数量 = 总价
      })

      // 计算差额文本和格式化总价
      const diffAmount = this.data.minDeliveryAmount - totalAmount
      const diffAmountText = diffAmount > 0 ? `还差¥${diffAmount.toFixed(2)}起送` : '去结算'
      const totalAmountText = `¥${totalAmount.toFixed(2)}`

      this.setData({
        cartItems,
        totalCount,
        totalAmount,
        diffAmountText,
        totalAmountText,
        loading: false
      })

      // 更新全局购物车数量
      app.globalData.cartCount = totalCount

    }).catch(err => {
      console.error('获取购物车失败:', err)
      this.setData({ 
        loading: false,
        cartItems: [],
        totalCount: 0,
        totalAmount: 0,
        diffAmountText: `还差¥${this.data.minDeliveryAmount.toFixed(2)}起送`,
        totalAmountText: '¥0.00'
      })
    })
  },

  // 增加商品数量
  addItem: function (e) {
    const item = e.currentTarget.dataset.item
    const cartData = {
      dishId: item.dishId,
      setmealId: item.setmealId,
      dishFlavor: item.dishFlavor || '',
      number: 1,
      amount: item.amount / item.number // 单价
    }

    cartAPI.add(cartData).then(res => {
      wx.showToast({
        title: '已添加',
        icon: 'success',
        duration: 1000
      })
      this.loadCartData()
    }).catch(err => {
      wx.showToast({
        title: '操作失败',
        icon: 'none'
      })
    })
  },

  // 减少商品数量
  minusItem: function (e) {
    const item = e.currentTarget.dataset.item
    const cartData = {
      dishId: item.dishId,
      setmealId: item.setmealId,
      dishFlavor: item.dishFlavor || '',
      number: 1,
      amount: item.amount / item.number // 单价
    }

    cartAPI.sub(cartData).then(res => {
      wx.showToast({
        title: '已移除',
        icon: 'success',
        duration: 1000
      })
      this.loadCartData()
    }).catch(err => {
      wx.showToast({
        title: '操作失败',
        icon: 'none'
      })
    })
  },

  // 清空购物车
  clearCart: function () {
    wx.showModal({
      title: '确认清空',
      content: '确定要清空购物车吗？',
      success: (res) => {
        if (res.confirm) {
          cartAPI.clean().then(() => {
            wx.showToast({
              title: '已清空购物车',
              icon: 'success'
            })
      this.setData({
        cartItems: [],
        totalCount: 0,
        totalAmount: 0,
        diffAmountText: `还差¥${this.data.minDeliveryAmount.toFixed(2)}起送`,
        totalAmountText: '¥0.00'
      })
            // 更新全局购物车数量
            app.globalData.cartCount = 0
          }).catch(err => {
            wx.showToast({
              title: '清空失败',
              icon: 'none'
            })
          })
        }
      }
    })
  },

  // 去点餐
  goShopping: function () {
    wx.switchTab({
      url: '/pages/menu/menu'
    })
  },

  // 去结算
  checkout: function () {
    // 检查是否满足起送金额
    if (this.data.totalAmount < this.data.minDeliveryAmount) {
      wx.showToast({
        title: `还差¥${(this.data.minDeliveryAmount - this.data.totalAmount).toFixed(2)}起送`,
        icon: 'none',
        duration: 2000
      })
      return
    }

    // 检查购物车是否为空
    if (this.data.cartItems.length === 0) {
      wx.showToast({
        title: '购物车为空',
        icon: 'none'
      })
      return
    }

    // 跳转到订单确认页
    wx.navigateTo({
      url: '/pages/order/confirm/confirm'
    })
  }
})
