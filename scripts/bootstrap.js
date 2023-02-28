#!/usr/bin/env node

const {argv, clang, hostCpu, hostOs, targetCpu, targetOs, execSync, spawnSync} = require('./common')

const fs = require('fs')

execSync('git submodule sync --recursive')
execSync('git submodule update --init --recursive')

// Download GN.
execSync('node scripts/download_gn.js')
// Download clang binaries.
if (clang)
  execSync('python third_party/gn/tools/clang/scripts/update.py')
// Extract vs toolchain when cross compiling for Windows.
if (targetOs == 'win' && targetOs != hostOs)
  execSync('node scripts/setup_vs_toolchain.js')
// Download Linux sysroot images.
if (hostOs == 'linux') {
  const map = {x64: 'amd64', x86: 'i386'}
  const hostArch = map[hostCpu] ?? hostCpu
  execSync(`python third_party/gn/build/linux/sysroot_scripts/install-sysroot.py --arch ${hostArch}`)
  const targetArch = map[targetCpu] ?? targetCpu
  execSync(`python third_party/gn/build/linux/sysroot_scripts/install-sysroot.py --arch ${targetArch}`)
}

// Checkout dependencies needed for building V8.
checkoutDeps()

const commonConfig = [
  `is_clang=${clang}`,
  `target_cpu="${targetCpu}"`,
  `target_os="${targetOs}"`,
  // Ignore warnings.
  'treat_warnings_as_errors=false',
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
if (hostOs == 'mac') {
  // Default xcode clang is not supported for building v8.
  commonConfig.push('use_xcode_clang=false')
}
if (hostOs == 'linux') {
  // Ensure stable environment.
  commonConfig.push('use_sysroot=true',
                    'use_custom_libcxx=true')
}
for (const arg of argv) {
  if (arg == '--ccache' && hostOs != 'win')
    commonConfig.push('cc_wrapper="ccache"')
  else if (arg.startsWith('--extra-args='))
    commonConfig.push(...arg.substr(arg.indexOf('=') + 1).split(' '))
}

gen('out/Component', componentConfig)
gen('out/Debug', debugConfig)
gen('out/Release', releaseConfig)

function checkoutDeps() {
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
  const env = {}
  // This env is used to instruct build settings to use bundled vs toolchain.
  if (targetOs == 'win' && targetOs != hostOs)
    env.DEPOT_TOOLS_WIN_TOOLCHAIN = 1
  spawnSync('gn', ['gen', dir, `--args=${commonConfig.concat(args).join(' ')}`], {env})
}
