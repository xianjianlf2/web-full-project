'use strict'
const { Service } = require('egg')
const path = require('path')
const fse = require('fs-extra')
const nodemailer = require('nodemailer')

const userEmail = 'mark-xian@foxmail.com'
const transporter = nodemailer.createTransport({
  service: 'QQ',
  secureConnection: true,
  auth: {
    user: userEmail,
    pass: 'ltjpqhknsirkbiie',
  },
})

class ToolService extends Service {
  async mergeFile(filepPath, filehash, size) {
    const chunkdDir = path.resolve(this.config.UPLOAD_DIR, filehash) // 切片的文件夹
    let chunks = await fse.readdir(chunkdDir)
    chunks.sort((a, b) => a.split('-')[1] - b.split('-')[1])
    chunks = chunks.map((cp) => path.resolve(chunkdDir, cp))
    await this.mergeChunks(chunks, filepPath, size)
  }
  async mergeChunks(files, dest, size) {
    const pipStream = (filePath, writeStream) =>
      new Promise((resolve) => {
        const readStream = fse.createReadStream(filePath)
        readStream.on('end', () => {
          fse.unlinkSync(filePath)
          resolve()
        })
        readStream.pipe(writeStream)
      })

    await Promise.all(
      files.forEach((file, index) => {
        pipStream(
          file,
          fse.createWriteStream(dest, {
            start: index * size,
            end: (index + 1) * size,
          })
        )
      })
    )
  }

  async sendMail(email, subject, text, html) {
    const mailOptions = {
      from: userEmail,
      to: email,
      subject,
      text,
      html,
      cc: userEmail,
    }
    try {
      await transporter.sendMail(mailOptions)
      return true
    } catch (error) {
      console.log('email error', error)
      return false
    }
  }
}

module.exports = ToolService
