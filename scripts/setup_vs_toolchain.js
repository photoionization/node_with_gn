#!/usr/bin/env node

const {execSync} = require('./common')

const fs = require('fs')
const path = require('path')

// Receive TOOLCHAIN_HASH from vs_toolchain.py.
const content = String(fs.readFileSync('third_party/gn/build/vs_toolchain.py'))
const match = content.match(/TOOLCHAIN_HASH = '(.*)'/)
if (!match || match.length == 0) {
  console.error('Can not find TOOLCHAIN_HASH from vs_toolchain.py')
  process.exit(2)
}
const toolchainHash = match[1]

// Find <hash value>.zip from current dir.
let winsdk
for (const f of fs.readdirSync('.')) {
  if (f.endsWith('.zip') && f.length == 14) {
    winsdk = path.basename(f, '.zip')
    break
  }
}
if (!winsdk) {
  console.error('Unable to find out toolchain zip, please follow the guide to generate one and put it in the source root dir.')
  console.error('https://chromium.googlesource.com/chromium/src/+/master/docs/win_cross.md')
  process.exit(3)
}

// Invoke vs_toolchain.py to unzip the toolchain.
const env = {
  DEPOT_TOOLS_WIN_TOOLCHAIN: 1,
  DEPOT_TOOLS_WIN_TOOLCHAIN_BASE_URL: process.cwd(),
}
env[`GYP_MSVS_HASH_${toolchainHash}`] = winsdk
execSync('python third_party/gn/build/vs_toolchain.py update --force', {env})
