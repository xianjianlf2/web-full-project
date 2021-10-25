<template>
  <el-container>
    <el-header>
      <el-menu class="el-menu-demo" mode="horizontal">
        <el-menu-item index="0">
          <img src="/logo.png" alt="" class="logo" />
        </el-menu-item>

        <el-menu-item index="1">
          <nuxt-link to="/">首页</nuxt-link>
        </el-menu-item>

        <el-menu-item v-if="userInfo.id" index="3" class="pull-right">
          <p>退出</p>
        </el-menu-item>

        <el-menu-item>
          <p>{{ userInfo.nickname }}</p>
        </el-menu-item>

        <el-menu-item index="3" class="pull-right">
          <nuxt-link to="/editor/new">写文章</nuxt-link>
        </el-menu-item>

        <el-menu-item index="2" class="pull-right">
          <nuxt-link to="/register" v-if="!userInfo.id">注册</nuxt-link>
        </el-menu-item>

        <el-menu-item index="3" class="pull-right">
          <nuxt-link to="/login" v-if="!userInfo.id">登录</nuxt-link>
        </el-menu-item>
      </el-menu>
    </el-header>

    <el-main>
      <nuxt />
    </el-main>
    <el-footer> 底部信息 </el-footer>
  </el-container>
</template>
<script>
export default {
  mounted() {
    this.getUserInfo()
  },
  computed: {
    userInfo() {
      return this.$store.state.user || {}
    },
  },
  methods: {
    async getUserInfo() {
      const token = localStorage.getItem('token')
      if (token) {
        this.$store.dispatch('user/detail')
      }
    },
  },
}
</script>
<style>
html {
  font-family: 'Source Sans Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI',
    Roboto, 'Helvetica Neue', Arial, sans-serif;
  font-size: 16px;
  word-spacing: 1px;
  -ms-text-size-adjust: 100%;
  -webkit-text-size-adjust: 100%;
  -moz-osx-font-smoothing: grayscale;
  -webkit-font-smoothing: antialiased;
  box-sizing: border-box;
  background: #eee;
}
.pull-right {
  float: right !important;
}
*,
*:before,
*:after {
  box-sizing: border-box;
  margin: 0;
}
.logo {
  height: 37px;
}
a {
  text-decoration: none;
}
.kkb-container {
  width: 980px;
  height: 80vh;
  margin: 0 auto;
  background: #fff;
  padding: 20px;
}
.el-menu--horizontal > .el-menu-item.is-active {
  border: none;
}
</style>
