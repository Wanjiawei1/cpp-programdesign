// pages/profile/profile.js
const app = getApp()
const api = require('../../utils/api')

Page({
  data: {
    userInfo: null,
    recentOrders: []
  },

  onLoad: function() {
    this.loadUserInfo()
    this.loadRecentOrders()
  },

  onShow: function() {
    this.loadUserInfo()
    this.loadRecentOrders()
  },

  // 加载用户信息
  loadUserInfo: function() {
    const userInfo = wx.getStorageSync('userInfo')
    this.setData({ userInfo })
  },

  // 加载最近订单
  loadRecentOrders: function() {
    if (!app.globalData.token) {
      this.setData({ recentOrders: [] })
      return;
    }
    
    api.orderAPI.getHistoryOrders(1, 3, null).then(res => {
      if (res.code === 1 && res.data && res.data.records) {
        const orders = res.data.records.map(order => {
          let statusText = ''
          let statusClass = ''
          switch (order.status) {
            case 1: 
              statusText = '待付款'; 
              statusClass = 'status-pending';
              break;
            case 2: 
              statusText = '待接单'; 
              statusClass = 'status-waiting';
              break;
            case 3: 
              statusText = '已接单'; 
              statusClass = 'status-confirmed';
              break;
            case 4: 
              statusText = '派送中'; 
              statusClass = 'status-delivering';
              break;
            case 5: 
              statusText = '已完成'; 
              statusClass = 'status-completed';
              break;
            case 6: 
              statusText = '已取消'; 
              statusClass = 'status-cancelled';
              break;
            default: 
              statusText = '未知状态';
              statusClass = 'status-unknown';
          }
          
          return {
            ...order,
            statusText,
            statusClass,
            totalNumber: order.orderDetails ? order.orderDetails.reduce((sum, item) => sum + item.number, 0) : 0
          }
        })
        this.setData({ recentOrders: orders })
      }
    }).catch(err => {
      console.log('加载最近订单失败:', err)
      // 如果加载失败，清空订单列表
      this.setData({ recentOrders: [] })
    })
  },

  // 跳转地址管理
  goToAddress: function() {
    this.checkLogin(() => {
      wx.navigateTo({ url: '/pages/address/address' })
    })
  },

  // 跳转订单列表
  goToOrders: function() {
    wx.switchTab({ url: '/pages/order/order' })
  },

  // 联系客服
  contactService: function() {
    wx.showModal({
      title: '联系客服',
      content: '电话：400-123-4567\n邮箱：service@zjut.edu.cn',
      showCancel: false
    })
  },

  // 检查登录状态
  checkLogin: function(callback) {
    if (app.globalData.token) {
      callback && callback()
    } else {
      this.goToLogin()
    }
  },

  // 去登录
  goToLogin: function() {
    wx.navigateTo({ url: '/pages/login/login' })
  },

  // 再来一单
  reorder: function(e) {
    const orderId = e.currentTarget.dataset.id
    wx.showLoading({ title: '处理中...' })
    
    api.orderAPI.repetition(orderId).then(res => {
      wx.hideLoading()
      if (res.code === 1) {
        wx.showToast({
          title: '已添加到购物车',
          success: () => {
            app.updateCartCount()
            wx.switchTab({ url: '/pages/cart/cart' })
          }
        })
      } else {
        wx.showToast({
          title: res.msg || '操作失败',
          icon: 'error'
        })
      }
    }).catch(err => {
      wx.hideLoading()
      wx.showToast({
        title: '操作失败',
        icon: 'error'
      })
    })
  },

  // 退出登录
  logout: function() {
    wx.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          // 清空本地存储
          wx.clearStorageSync()
          app.globalData.token = ''
          app.globalData.userInfo = null
          app.globalData.cartCount = 0
          
          this.setData({ 
            userInfo: null,
            recentOrders: []
          })
          
          wx.showToast({
            title: '已退出登录',
            icon: 'success'
          })
        }
      }
    })
  }
})
