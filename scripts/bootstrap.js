#!/usr/bin/env node

const {argv, clang, hostCpu, targetCpu, targetOs, execSync, spawnSync} = require('./common')

const fs = require('fs')

execSync('git submodule sync --recursive')
execSync('git submodule update --init --recursive')

execSync('node scripts/download_gn.js')
if (clang)
  execSync('python third_party/gn/tools/clang/scripts/update.py')

checkout()

const commonConfig = [
  `is_clang=${clang}`,
  `target_cpu="${targetCpu}"`,
]
const componentConfig = [
  'is_component_build=true',
  'is_debug=true',
]
const debugConfig = [
  'is_component_build=false',
  'is_debug=true',
]
const releaseConfig = [
  'is_component_build=false',
  'is_debug=false',
  'is_official_build=true',
]
if (targetOs == 'mac') {
  // Default config uses xcode clang which is not supported for building v8.
  commonConfig.push('use_xcode_clang=false')
} else if (targetOs == 'linux' && clang) {
  // V8 only builds with libc++ with clang.
  commonConfig.push('use_custom_libcxx=true')
} else if (targetOs == 'win' && !clang) {
  // Current V8's source code uses C++17 on msvc.
  commonConfig.push('use_cxx17=true')
}
for (const arg of argv) {
  if (arg == '--ccache' && targetOs != 'win')
    commonConfig.push('cc_wrapper="ccache"')
  else if (arg.startsWith('--extra-args='))
    commonConfig.push(...arg.substr(arg.indexOf('=') + 1).split(' '))
}

gen('out/Component', componentConfig)
gen('out/Debug', debugConfig)
gen('out/Release', releaseConfig)

function checkout() {
  const deps = {
    "icu": "https://chromium.googlesource.com/chromium/deps/icu",
    "zlib": "https://chromium.googlesource.com/chromium/src/third_party/zlib",
    "jinja2": "https://chromium.googlesource.com/chromium/src/third_party/jinja2",
    "markupsafe": "https://chromium.googlesource.com/chromium/src/third_party/markupsafe"
  }
  for (const name in deps) {
    if (fs.existsSync(`third_party/${name}`))
      continue
    execSync(`git clone --depth=1 ${deps[name]} third_party/${name}`)
  }
}

function gen(dir, args) {
  spawnSync('gn', ['gen', dir, `--args=${commonConfig.concat(args).join(' ')}`])
}
