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
          ref="editor"
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
import hljs from 'highlight.js'
import javascript from 'highlight.js/lib/languages/javascript'
import 'highlight.js/styles/monokai-sublime.css'
import marked from 'marked'
export default {
  data() {
    return {
      content: `# kkb
      * 上课
      * 吃饭
      * 写代码
 \`\`\`javascript

  let a =1;
  console.log(a)
\`\`\`
      `,
    }
  },
  mounted() {
    this.timer = null
    this.bindEvent()

    marked.setOptions({
      rendered: new marked.Renderer(),
      highlight(code) {
        return hljs.highlightAuto(code).value
      },
      // ..
    })
  },
  computed: {
    compiledContent() {
      return marked(this.content, {})
    },
  },
  // lodash/debounce
  methods: {
    bindEvent() {
      this.$refs.editor.addEventListener('paste', async (e) => {
        const files = e.clipboardData.files
        console.log(files)
      })
      this.$refs.editor.addEventListener('drag', async (e) => {
        const files = e.dataTransfer.files
        console.log(files)

        // @todo 上传文件
        e.preventDefault()
      })
    },
    async submit() {
      // 文章列表，点赞，关注，草稿
      // user => aticle  一对多
      let ret = await this.$http.post('/article/create', {
        content: this.content, // selected : false 默认不显示
        compiledContent: this.compiledContent, // 显示只读取这个
      })
    },
    update(e) {
      clearTimeout(this.timer)
      this.timer = setTimeout(() => {
        this.content = e.target.value
      }, 350)
    },
  },
}
</script>

<style >
.md-editor {
  width: 100%;
  height: 100vh;
  outline: none;
}
.write-btn {
  position: fixed;
  z-index: 100;
  right: 30px;
  top: 10px;
}
</style>