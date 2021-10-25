const BaseController = require('./base')

// 用户 => 文章 1对多

class ArticleController extends BaseController {
  async index() {
    const { ctx } = this
    const articles = await ctx.model.Article.find()
      .populate('author')
      .sort({ createdAt: -1 })
    this.success(articles)
  }
}
module.exports = ArticleController
