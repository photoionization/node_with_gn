#!/usr/bin/env node

const {hostOs} = require('./common')

const fs = require('fs')
const path = require('path')
const extract = require('extract-zip')
const {pipeline} = require('stream/promises');

const gnVersion = 'v0.10.0'
const url = `https://github.com/yue/build-gn/releases/download/${gnVersion}/gn_${gnVersion}_${hostOs}_x64.zip`

const gnDir = path.resolve('third_party', 'gn')
const verFile = path.join(gnDir, '.version')
if (fs.existsSync(verFile) && fs.readFileSync(verFile) == gnVersion)
  return

fetch(url).then(async (response) => {
  await pipeline(response.body, fs.createWriteStream('gn.zip'))
  try {
    await extract('gn.zip', {dir: gnDir})
    fs.writeFileSync(verFile, gnVersion)
  } finally {
    fs.unlinkSync('gn.zip')
  }
})
