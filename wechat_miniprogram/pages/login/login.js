// pages/login/login.js
const { userAPI } = require('../../utils/api.js')
const app = getApp()

Page({
  data: {
    hasLogin: false,
    userInfo: null,
    canIUseGetUserProfile: false
  },

  onLoad: function (options) {
    // 检查是否已登录
    const token = wx.getStorageSync('token')
    if (token) {
      this.setData({
        hasLogin: true
      })
    }
    
    // 检查是否支持getUserProfile
    if (wx.getUserProfile) {
      this.setData({
        canIUseGetUserProfile: true
      })
    }
  },

  // 微信一键登录
  wxLogin: function() {
    wx.showLoading({
      title: '登录中...'
    })

    // 获取微信登录凭证code
    wx.login({
      success: (res) => {
        if (res.code) {
          // 尝试获取用户基本信息，如果失败则使用基本登录
          this.getUserProfile(res.code)
        } else {
          wx.hideLoading()
          wx.showToast({
            title: '获取登录凭证失败',
            icon: 'none'
          })
        }
      },
      fail: () => {
        wx.hideLoading()
        wx.showToast({
          title: '登录失败，请重试',
          icon: 'none'
        })
      }
    })
  },

  // 获取用户信息（可选）
  getUserProfile: function(code) {
    if (this.data.canIUseGetUserProfile) {
      wx.getUserProfile({
        desc: '用于完善用户资料',
        success: (res) => {
          this.setData({
            userInfo: res.userInfo
          })
          this.doLogin(code, res.userInfo)
        },
        fail: () => {
          // 如果用户拒绝授权，使用基本登录（仅code）
          console.log('用户拒绝授权，使用基本登录')
          this.doBasicLogin(code)
        }
      })
    } else {
      // 兼容老版本
      wx.getUserInfo({
        success: (res) => {
          this.setData({
            userInfo: res.userInfo
          })
          this.doLogin(code, res.userInfo)
        },
        fail: () => {
          // 如果获取用户信息失败，使用基本登录
          console.log('获取用户信息失败，使用基本登录')
          this.doBasicLogin(code)
        }
      })
    }
  },

  // 获取手机号（可选）
  getPhoneNumber: function(e) {
    if (e.detail.errMsg === 'getPhoneNumber:ok') {
      // 如果已经有基本登录信息，更新手机号
      if (app.globalData.token) {
        this.updatePhone(e.detail)
      } else {
        wx.showToast({
          title: '请先微信登录',
          icon: 'none'
        })
      }
    } else {
      wx.showToast({
        title: '手机号授权失败',
        icon: 'none'
      })
    }
  },

  // 更新手机号
  updatePhone: function(phoneDetail) {
    // 这里可以调用后端接口更新手机号
    wx.showToast({
      title: '手机号获取成功',
      icon: 'success'
    })
  },

  // 执行登录（包含用户信息）
  doLogin: function(code, userInfo) {
    const loginData = {
      code: code,
      userInfo: {
        nickName: userInfo.nickName,
        avatarUrl: userInfo.avatarUrl,
        gender: userInfo.gender
      }
    }

    this.callLoginAPI(loginData, userInfo)
  },

  // 基本登录（仅code）
  doBasicLogin: function(code) {
    const loginData = {
      code: code,
      userInfo: null
    }

    this.callLoginAPI(loginData, null)
  },

  // 调用登录API
  callLoginAPI: function(loginData, userInfo) {
    userAPI.login(loginData).then(res => {
      wx.hideLoading()
      
      if (res.code === 1) {
        // 保存登录信息
        const userData = {
          ...res.data,
          nickName: userInfo ? userInfo.nickName : (res.data.nickName || '微信用户'),
          avatarUrl: userInfo ? userInfo.avatarUrl : (res.data.avatarUrl || ''),
          gender: userInfo ? userInfo.gender : (res.data.gender || 0)
        }
        
        app.globalData.token = res.data.token
        app.globalData.userInfo = userData
        
        wx.setStorageSync('token', res.data.token)
        wx.setStorageSync('userInfo', userData)

        this.setData({
          hasLogin: true
        })

        wx.showToast({
          title: '登录成功',
          icon: 'success'
        })

        // 延迟跳转
        setTimeout(() => {
          this.enterApp()
        }, 1500)
      } else {
        wx.showToast({
          title: res.msg || '登录失败',
          icon: 'none'
        })
      }
    }).catch(err => {
      wx.hideLoading()
      wx.showToast({
        title: err.msg || '登录失败，请重试',
        icon: 'none'
      })
      console.error('登录错误:', err)
    })
  },

  // 进入应用
  enterApp: function() {
    // 返回上一页或跳转到首页
    const pages = getCurrentPages()
    if (pages.length > 1) {
      wx.navigateBack()
    } else {
      wx.switchTab({
        url: '/pages/index/index'
      })
    }
  }
})
