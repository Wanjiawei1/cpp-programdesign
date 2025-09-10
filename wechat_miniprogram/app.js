// app.js
App({
  globalData: {
    baseUrl: 'http://localhost:8080/user',
    token: '',
    userInfo: null,
    cartCount: 0
  },

  onLaunch() {
    // 小程序启动时执行
    console.log('小程序启动')
    
    // 检查登录状态
    const token = wx.getStorageSync('token')
    if (token) {
      this.globalData.token = token
    }
  },

  onShow() {
    // 小程序显示时执行
    this.updateCartCount()
  },

  // 更新购物车数量
  updateCartCount() {
    if (!this.globalData.token) {
      // 清空购物车徽章
      wx.removeTabBarBadge({
        index: 2
      })
      return
    }
    
    wx.request({
      url: `${this.globalData.baseUrl}/shoppingCart/list`,
      method: 'GET',
      header: {
        'authentication': this.globalData.token
      },
      success: (res) => {
        if (res.data.code === 1) {
          let count = 0
          res.data.data.forEach(item => {
            count += item.number
          })
          this.globalData.cartCount = count
          
          // 更新购物车tabbar badge
          if (count > 0) {
            wx.setTabBarBadge({
              index: 2,
              text: count.toString()
            })
          } else {
            wx.removeTabBarBadge({
              index: 2
            })
          }
        }
      },
      fail: (err) => {
        console.log('获取购物车失败:', err)
        // 如果请求失败，清空徽章
        wx.removeTabBarBadge({
          index: 2
        })
      }
    })
  },

  // 检查登录状态
  checkLogin() {
    return new Promise((resolve, reject) => {
      if (this.globalData.token) {
        resolve(true)
      } else {
        // 跳转到登录页
        wx.navigateTo({
          url: '/pages/login/login'
        })
        reject(false)
      }
    })
  }
})
