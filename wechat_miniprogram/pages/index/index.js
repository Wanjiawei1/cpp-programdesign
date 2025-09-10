// pages/index/index.js
const { categoryAPI, dishAPI, shopAPI, cartAPI } = require('../../utils/api.js')
const app = getApp()

Page({
  data: {
    shopStatus: 1,
    categories: [],
    currentCategory: null,
    dishList: [],
    cartItems: [],
    cartCount: 0,
    totalPrice: 0,
    totalPriceText: '0.00',
    minDeliveryAmount: 20,
    deliveryDifference: 0,
    deliveryDifferenceText: '20.00',
    canCheckout: false,
    checkoutText: '￥20.00起送',
    selectedDish: null,
    showDetailPop: false,
    showCartPop: false,
    loading: false
  },

  onLoad: function () {
    this.loadData()
  },

  onShow: function () {
    this.loadCartData()
  },

  // 加载页面数据
  loadData: function () {
    this.loadShopStatus()
    this.loadCategories()
  },

  // 加载店铺状态
  loadShopStatus: function () {
    shopAPI.getStatus().then(res => {
      this.setData({
        shopStatus: res.data
      })
    }).catch(err => {
      console.error('获取店铺状态失败:', err)
    })
  },

  // 加载分类数据
  loadCategories: function () {
    return categoryAPI.getList(1).then(res => {
      const categories = res.data || []
      this.setData({
        categories: categories
      })
      // 默认选择第一个分类
      if (categories.length > 0) {
        this.setData({
          currentCategory: categories[0]
        })
        this.loadDishList(categories[0].id)
      }
    }).catch(err => {
      console.error('获取分类失败:', err)
      // 如果是401错误且用户未登录，提示登录
      if (err.statusCode === 401 && !app.globalData.token) {
        this.showLoginDialog()
      }
    })
  },

  // 加载菜品列表
  loadDishList: function (categoryId) {
    if (!categoryId) return
    
    dishAPI.getListByCategoryId(categoryId).then(res => {
      const dishList = (res.data || []).map(dish => ({
        ...dish,
        number: 0 // 初始化数量
      }))
      this.setData({
        dishList: dishList
      })
      this.updateDishNumbers()
    }).catch(err => {
      console.error('获取菜品失败:', err)
    })
  },

  // 加载购物车数据
  loadCartData: function () {
    if (!app.globalData.token) {
      this.setData({
        cartItems: [],
        cartCount: 0,
        totalPrice: 0,
        totalPriceText: '0.00',
        deliveryDifference: this.data.minDeliveryAmount,
        deliveryDifferenceText: this.data.minDeliveryAmount.toFixed(2),
        canCheckout: false,
        checkoutText: `￥${this.data.minDeliveryAmount.toFixed(2)}起送`
      })
      return
    }

    cartAPI.getList().then(res => {
      const cartItems = res.data || []
      let cartCount = 0
      let totalPrice = 0

      cartItems.forEach(item => {
        cartCount += item.number
        totalPrice += item.amount * item.number  // 单价 × 数量 = 总价
      })

      const canCheckout = totalPrice >= this.data.minDeliveryAmount
      const deliveryDifference = this.data.minDeliveryAmount - totalPrice
      
      this.setData({
        cartItems: cartItems,
        cartCount: cartCount,
        totalPrice: totalPrice,
        totalPriceText: totalPrice.toFixed(2),
        deliveryDifference: deliveryDifference > 0 ? deliveryDifference : 0,
        deliveryDifferenceText: deliveryDifference > 0 ? deliveryDifference.toFixed(2) : '0.00',
        canCheckout: canCheckout,
        checkoutText: canCheckout ? '去结算' : `￥${deliveryDifference.toFixed(2)}起送`
      })

      // 更新菜品数量显示
      this.updateDishNumbers()
      // 更新全局购物车数量
      app.globalData.cartCount = cartCount
    }).catch(err => {
      console.log('获取购物车失败:', err)
      // 如果获取购物车失败，清空购物车数据
      this.setData({
        cartItems: [],
        cartCount: 0,
        totalPrice: 0,
        totalPriceText: '0.00',
        deliveryDifference: this.data.minDeliveryAmount,
        deliveryDifferenceText: this.data.minDeliveryAmount.toFixed(2),
        canCheckout: false,
        checkoutText: `￥${this.data.minDeliveryAmount.toFixed(2)}起送`
      })
    })
  },

  // 更新菜品数量显示
  updateDishNumbers: function () {
    const { dishList, cartItems } = this.data
    const updatedDishList = dishList.map(dish => {
      const cartItem = cartItems.find(item => 
        (item.dishId && item.dishId === dish.id) || 
        (item.setmealId && item.setmealId === dish.id)
      )
      const number = cartItem ? cartItem.number : 0
      const price = parseFloat(dish.price) || 0
      return {
        ...dish,
        number: number,
        displayPrice: number > 0 ? (price * number).toFixed(2) : price.toFixed(2)
      }
    })
    this.setData({
      dishList: updatedDishList
    })
  },

  // 分类点击
  onCategoryTap: function (e) {
    const category = e.currentTarget.dataset.category
    this.setData({
      currentCategory: category
    })
    this.loadDishList(category.id)
  },

  // 添加菜品
  addDish: function (e) {
    const dish = e.currentTarget.dataset.dish
    this.addToCart(dish)
  },

  // 减少菜品
  removeDish: function (e) {
    const dish = e.currentTarget.dataset.dish
    this.removeFromCart(dish)
  },

  // 添加到购物车
  addToCart: function (dish) {
    if (!app.globalData.token) {
      this.showLoginDialog()
      return
    }

    console.log('添加商品到购物车:', dish)
    
    const cartData = {
      dishId: dish.id,  // 首页都是菜品
      setmealId: null,
      dishFlavor: dish.dishFlavor || ''
    }
    
    console.log('发送的购物车数据:', cartData)

    cartAPI.add(cartData).then(() => {
      wx.showToast({
        title: '已添加',
        icon: 'success',
        duration: 1000
      })
      this.loadCartData()
    }).catch(err => {
      wx.showToast({
        title: '添加失败',
        icon: 'none'
      })
    })
  },

  // 从购物车移除
  removeFromCart: function (dish) {
    if (!app.globalData.token) {
      this.showLoginDialog()
      return
    }

    const cartData = {
      dishId: dish.type === 1 ? dish.id : null,
      setmealId: dish.type === 2 ? dish.id : null,
      dishFlavor: dish.dishFlavor || ''
    }

    cartAPI.sub(cartData).then(() => {
      this.loadCartData()
    }).catch(err => {
      wx.showToast({
        title: '操作失败',
        icon: 'none'
      })
    })
  },

  // 显示菜品详情
  showDishDetail: function (e) {
    const dish = e.currentTarget.dataset.dish
    this.setData({
      selectedDish: dish,
      showDetailPop: true
    })
  },

  // 隐藏菜品详情
  hideDetailPop: function () {
    this.setData({
      showDetailPop: false,
      selectedDish: null
    })
  },

  // 详情页添加菜品
  addDishFromDetail: function () {
    if (this.data.selectedDish) {
      this.addToCart(this.data.selectedDish)
    }
  },

  // 详情页减少菜品
  removeDishFromDetail: function () {
    if (this.data.selectedDish) {
      this.removeFromCart(this.data.selectedDish)
    }
  },

  // 切换购物车显示
  toggleCart: function () {
    if (this.data.cartCount === 0) return
    
    this.setData({
      showCartPop: !this.data.showCartPop
    })
  },

  // 隐藏购物车
  hideCartPop: function () {
    this.setData({
      showCartPop: false
    })
  },

  // 清空购物车
  clearCart: function () {
    wx.showModal({
      title: '清空购物车',
      content: '确定要清空购物车吗？',
      success: (res) => {
        if (res.confirm) {
          cartAPI.clean().then(() => {
            wx.showToast({
              title: '已清空',
              icon: 'success'
            })
            this.loadCartData()
            this.hideCartPop()
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

  // 去购物车页面
  goToCart: function () {
    if (!this.data.canCheckout) {
      wx.showToast({
        title: `还差¥${this.data.deliveryDifferenceText}起送`,
        icon: 'none'
      })
      return
    }

    wx.switchTab({
      url: '/pages/cart/cart'
    })
  },

  // 显示登录对话框
  showLoginDialog: function() {
    wx.showModal({
      title: '需要登录',
      content: '访问此功能需要先登录，是否前往登录？',
      confirmText: '去登录',
      cancelText: '稍后再说',
      success: (res) => {
        if (res.confirm) {
          wx.navigateTo({
            url: '/pages/login/login'
          })
        }
      }
    })
  },

  // 阻止事件冒泡
  stopPropagation: function () {
    // 阻止事件冒泡
  }
})