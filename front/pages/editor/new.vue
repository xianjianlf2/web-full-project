<template>
  <div>
    <div class="write-btn">
      <el-button type="primary" @click="submit">提交</el-button>
    </div>
    <el-row>
      <el-col :span="12">
        <!-- markdown编辑器的基本操作 -->
        <textarea
          class="md-editor"
          :value="content"
          @input="update"
          cols="30"
          rows="10"
        ></textarea>
      </el-col>
      <el-col :span="12">
        <div class="markdown-body" v-html="compiledContent"></div>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import marked from 'marked'
export default {
  data() {
    return {
      content: `# kkb
      * 上课
      * 吃饭
      * 写代码
      `,
    }
  },
  computed: {
    compiledContent() {
      return marked(this.content, {})
    },
  },
  methods: {
    submit() {},
    update(e) {
      this.content = e.target.value
    },
  },
}
</script>

<style >
.md-editore {
  width: 100%;
  height: 100%;
  outline: none;
}
.write-btn {
  position: fixed;
  z-index: 100;
  right: 30px;
  top: 10px;
}
</style>