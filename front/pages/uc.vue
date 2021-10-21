<template>
  <div>
    <h1>用户中心</h1>
    <div ref="drag" id="drag">
      <input type="file" name="file" @change="handleFileChange" />
    </div>
    <div>
      <el-progress
        :stroke-width="20"
        :text-inside="true"
        :percentage="uploadprocess"
      ></el-progress>
    </div>
    <div>
      <el-button @click="uploadFile" type="primary">提交</el-button>
    </div>
    <div>
      <p>计算hash的进度</p>
      <el-progress
        :stroke-width="20"
        :text-inside="true"
        :percentage="hashProgress"
      ></el-progress>
    </div>

    <div>
      <!-- chunk.progress -->
      <!-- progress<0 报错 显示红色
      progress=100 成功
      别的数字，方块高度显示 -->
      <div class="cube-container" :style="{ width: cubeWidth + 'px' }">
        <div class="cube" v-for="chunk in chunks" :key="chunk.name">
          <div
            :class="{
              uploading: chunk.progress > 0 && chunk.progress < 100,
              success: chunk.progress == 100,
              error: chunk.progress < 0,
            }"
            :style="{ height: chunk.progress + '%' }"
          >
            <i
              class="el-icon-loading"
              style="color: #f56c6c"
              v-if="chunk.progress < 100 && chunk.progress > 0"
            ></i>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import sparkMD5 from 'spark-md5'
const CHUNK_SIZE = 10 * 1024 * 1024
export default {
  async mounted() {
    const ret = await this.$http.get('/user/info')
    this.bindEvents()
  },
  data() {
    return {
      file: null,
      // uploadprocess: 0,
      hashProgress: 0,
      chunks: [],
    }
  },
  computed: {
    cubeWidth() {
      return Math.ceil(Math.sqrt(this.chunks.length)) * 16
    },
    uploadprocess() {
      if (!this.file || this.chunks.length) {
        return 0
      }
      const loaded = this.chunks
        .map((item) => item.chunk.size * item.progress)
        .reduce((acc, cur) => acc + cur, 0)
      return parseInt(((loaded * 100) / this.file.size).toFixed(2))
    },
  },
  methods: {
    async blobToString(blob) {
      return new Promise((resolve) => {
        const reader = new FileReader()
        reader.onload = function () {
          const ret = reader.result
            .split('')
            .map((v) => v.charCodeAt()) // 转Hashcode
            .map((v) => v.toString(16).toUpperCase()) // 转换16进制
            .map((v) => v.padStart(2, '0')) // 补位
            .join(' ')
          resolve(ret)
        }
        reader.readAsBinaryString(blob)
      })
    },
    async isGif(file) {
      // 前面6个的16进制  '47 49 46 38 39 61' '47 49 46 38 37 61'
      // 16进制的转换
      const ret = await this.blobToString(file.slice(0, 6))
      const isGif = ret == '47 49 46 38 39 61' || ret == '47 49 46 38 37 61'
      return isGif
    },
    async isPng(file) {
      const ret = await this.blobToString(file.slice(0, 8))
      const isPng = ret == '89 50 4E 47 0D 0A 1A 0A'
      return isPng
    },
    async isJpg(file) {
      const len = file.size
      const start = await this.blobToString(file.slice(0, 2))
      const tail = await this.blobToString(file.slice(-2, len))

      const isJpg = start == 'FF D8' && tail == 'FF D9'
      return isJpg
    },
    async isImage(file) {
      // 通过文件流来判定
      // 先判定是不是gif
      return (
        (await this.isGif(file)) ||
        (await this.isPng(file)) ||
        (await this.isJpg(file))
      )
    },
    bindEvents() {
      const drag = this.$refs.drag
      drag.addEventListener('dragover', (e) => {
        drag.style.borderColor = 'red'
        // 阻止冒泡事件
        e.preventDefault()
      })
      drag.addEventListener('dragleave', (e) => {
        drag.style.borderColor = '#eee'
        // 阻止冒泡事件
        e.preventDefault()
      })
      drag.addEventListener('drop', (e) => {
        const fileList = e.dataTransfer.files
        drag.style.borderColor = '#eee'
        this.file = fileList[0]
        e.preventDefault()
      })
    },
    handleFileChange(e) {
      const [file] = e.target.files
      if (!file) {
        return
      }
      this.file = file
    },

    creaFileChunk(file, size = CHUNK_SIZE) {
      const chunks = []
      let cur = 0
      while (cur < this.file.size) {
        chunks.push({ index: cur, file: this.file.slice(cur, cur + size) })
        cur += size
      }
      return chunks
    },
    // 计算Hash
    async calculateHashSample() {
      // 参考算法  布隆过滤器  判断一个数据存在与否
      // 1个G 的文件，抽样后5M以内
      // 如果Hash一样  文件不一定一样
      // hash不一样，文件一定不一样
      return new Promise((resolve) => {
        const spark = new sparkMD5.ArrayBuffer()
        const reader = new FileReader()

        const file = this.file
        const size = file.size

        const offset = 2 * 1024 * 1024
        // 第一个2M，最后一个区块全要
        // 中间的取前中后各两个字节
        let chunks = [file.slice(0, offset)]

        let cur = offset
        while (cur < size) {
          if (cur + offset >= size) {
            // 最后一块区域
            chunks.push(file.slice(cur, cur + offset))
          } else {
            // 中间的区域
            const mid = cur + offset / 2
            const end = cur + offset

            chunks.push(file.slice(cur, cur + 2))
            chunks.push(file.slice(mid, mid + 2))
            chunks.push(file.slice(end - 2, end))
          }
          cur += offset
        }
        reader.readAsArrayBuffer(new Blob(chunks))
        reader.onload = (e) => {
          spark.append(e.target.result)
          this.hashProgress = 100
          resolve(spark.end())
        }
      })
    },
    async calculateHashWorker() {
      return new Promise((resolve) => {
        this.worker = new Worker('/hash.js')
        this.worker.postMessage({ chunks: this.chunks })
        this.worker.onmessage = (e) => {
          const { progress, hash } = e.data
          this.hashProgress = Number(progress.toFixed(2))
          if (hash) {
            resolve(hash)
          }
        }
      })
    },
    // 利用时间切片分割
    // 60fps
    // 1秒渲染60次 渲染1次 1帧，大概16.6ms
    // |帧(system task，render，script)空闲时间  |帧 painting idle   |帧   |帧   |
    // 借鉴fiber架构
    async calculateHashIdle() {
      const chunks = this.chunks
      return new Promise((resolve) => {
        const spark = new sparkMD5.ArrayBuffer()
        let count = 0

        const appendToSpark = async (file) => {
          return new Promise((resolve) => {
            const reader = new FileReader()
            reader.readAsArrayBuffer(file)
            reader.onload = (e) => {
              spark.append(e.target.result)
              resolve()
            }
          })
        }
        const workLoop = async (deadline) => {
          // timeRemaining获取当前帧的剩余时间
          while (count < chunks.length && deadline.timeRemaining() > 1) {
            // 空闲时间，且有任务
            await appendToSpark(chunks[count].file)
            count++
            if (count < chunks.length) {
              this.hashProgress = Number(
                ((100 * count) / chunks.length).toFixed(2)
              )
            } else {
              this.hashProgress = 100
              resolve(spark.end())
            }
          }
          window.requestIdleCallback(workLoop)
        }
        // 浏览器一旦空闲，就会调用workLoop
        window.requestIdleCallback(workLoop)
      })
    },
    async uploadFile() {
      // if (!(await this.isImage(this.file))) {
      //   alert('文件格式不对')
      //   return
      // }

      this.chunks = this.creaFileChunk(this.file)
      // const hash = await this.calculateHashWorker(chunks)
      // const hash1 = await this.calculateHashIdle()

      const hash = await this.calculateHashSample()
      this.hash = hash

      // 问一下后端,文件是否上传过,如果没有,是否有存在的切片

      const {
        data: { uploaded, uploadedList },
      } = await this.$http.post('/checkfile', {
        hash: this.hash,
        ext: this.file.name.split('.').pop(),
      })
      if (uploaded) {
        //秒传
        return this.$message.success('秒传成功')
      }

      this.chunks = this.chunks.map((chunk, index) => {
        // 切片的名字  hash-index
        const name = hash + '-' + index
        return {
          hash,
          name,
          index,
          chunk: chunk.file,
          // 设置进度条,已经上传的,设为100
          progress: uploadedList.indexOf(name) > -1 ? 100 : 0,
        }
      })
      await this.uploadChunks(uploadedList)
    },
    async uploadChunks(uploadedList) {
      const requests = this.chunks
        .filter((chunk) => uploadedList.indexOf(chunk.name) == -1)
        .map((chunk, index) => {
          // 转成promise
          const form = new FormData()
          form.append('chunk', chunk.chunk)
          form.append('hash', chunk.hash)
          form.append('name', chunk.name)
          // form.append('index',chunk.index)
          return form
        })
        .map((form, index) => {
          this.$http.post('/uploadfile', form, {
            onUploadProgress: (progress) => {
              // 不是整体的进度，而是每个区块的进度，整体进度条需要计算
              this.chunks[index].progress = Number(
                ((progress.loaded / progress.total) * 100).toFixed(2)
              )
            },
          })
        })
      // @todo 异步数据并发量的控制
      await Promise.all(requests)
      await this.mergeRequest()
      //  const form = new FormData()
      //       form.append('name', 'file')
      //       form.append('file', this.file)
      //       const ret = await this.$http.post('/uploadfile', form, {
      //         onUploadProgress: (progress) => {
      //           this.uploadprocess = Number(
      //             ((progress.loaded / progress.total) * 100).toFixed(2)
      //           )
      //         },
      //       })
      //       console.log(ret)
    },
    async mergeRequest() {
      console.log(CHUNK_SIZE)
      this.$http.post('/mergefile', {
        ext: this.file.name.split('.').pop(),
        size: CHUNK_SIZE,
        hash: this.hash,
      })
    },
  },
}
</script>

<style lang="stylus">
#drag {
  height: 100px;
  border: 2px dashed #eee;
  text-align: center;
  vertical-align: middle;
  line-height: 100px;
}

.cube-container, .cube {
  width: 14px;
  height: 14px;
  line-height: 12px;
  border: 1px black solid;
  background: #eee;
  float: left;

  >.success {
    background: green;
  }

  >.uploading {
    background: blue;
  }

  >.error {
    background: red;
  }
}
</style>