'use strict'
const BaseController = require('./base')
const md5 = require('md5')
const jwt = require('jsonwebtoken')

// 加盐操作
const HashSalt = ':Kaikeba@good!@123'
const createRule = {
  email: { type: 'email' },
  nickname: { type: 'string' },
  passwd: { type: 'string' },
  captcha: { type: 'string' },
}

class UserController extends BaseController {
  async login() {
    // this.success('token')
    const { ctx, app } = this
    const { email, captcha, passwd, emailcode } = ctx.request.body

    if (captcha.toUpperCase() !== ctx.session.captcha.toUpperCase()) {
      return this.error('验证码错误')
    }

    if (emailcode !== ctx.session.emailcode) {
      return this.error('邮箱验证码错误')
    }

    const user = await ctx.model.User.findOne({
      email,
      passwd: md5(passwd + HashSalt),
    })
    if (!user) {
      return this.error('用户名密码错误')
    }
    // 用户信息加密成token

    const token = jwt.sign(
      {
        _id: user._id,
        email,
      },
      app.config.jwt.secret,
      {
        expiresIn: '1h',
      }
    )
    this.success({ token, email, nickname: user.nickname })
  }
  async register() {
    const { ctx } = this

    try {
      // 校验传递的参数
      ctx.validate(createRule)
    } catch (e) {
      return this.error('参数校验失败', -1, e.error)
    }

    const { email, passwd, captcha, nickname } = ctx.request.body

    if (captcha.toUpperCase() !== ctx.session.captcha.toUpperCase()) {
      return this.error('验证码错误')
    }
    // 邮箱是不是重复
    if (await this.checkEmial(email)) {
      this.error('邮箱重复了')
    } else {
      const ret = await ctx.model.User.create({
        email,
        nickname,
        passwd: md5(passwd + HashSalt),
      })

      if (ret._id) {
        this.message('注册成功')
      }
    }
    // this.success({ name: "kkb" });
  }
  async checkEmial(email) {
    const user = await this.ctx.model.User.findOne({ email })
    return user
  }
  async verify() {
    // 校验用户名是否存在
  }
  async info() {
    // 获取用户信息
    // 当前还不知道是哪个邮件,需要从token里面读取
    // 有的接口需要从token里面读取数据
    const { ctx } = this
    const { email } = ctx.state
    const user = await this.checkEmial(email)
    this.success(user)
  }
}

module.exports = UserController
