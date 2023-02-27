#!/usr/bin/env node

const {targetOs} = require('./common')

const fs = require('fs')
const path = require('path')
const extract = require('extract-zip')
const fetch = require('node-fetch')

const gnVersion = 'v0.9.1'
const url = `https://github.com/yue/build-gn/releases/download/${gnVersion}/gn_${gnVersion}_${targetOs}_x64.zip`

const gnDir = path.resolve('third_party', 'gn')
const verFile = path.join(gnDir, '.version')
if (fs.existsSync(verFile) && fs.readFileSync(verFile) == gnVersion)
  return

fetch(url).then((response) => {
  response.body.on('end', async () => {
    try {
      await extract('gn.zip', {dir: gnDir})
      fs.writeFileSync(verFile, gnVersion)
    } finally {
      fs.unlinkSync('gn.zip')
    }
  })
  response.body.pipe(fs.createWriteStream('gn.zip'))
})
