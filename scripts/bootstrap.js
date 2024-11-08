#!/usr/bin/env node

const {argv, clang, hostCpu, hostOs, targetCpu, targetOs, execSync, spawnSync} = require('./common')

const fs = require('fs')
const path = require('path')

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

// Checkout node.
checkoutNode()

const commonConfig = [
  `is_clang=${clang}`,
  `host_cpu="${hostCpu}"`,
  `target_cpu="${targetCpu}"`,
  `target_os="${targetOs}"`,
  // V8 settings required by Node.
  'icu_use_data_file=false',
  'v8_expose_symbols=true',
  'v8_enable_sandbox=false',
  'v8_use_external_startup_data=false',
  'v8_enable_javascript_promise_hooks=true',
  'v8_promise_internal_field_count=1',
  'v8_array_buffer_internal_field_count=2',
  'v8_array_buffer_view_internal_field_count=2',
  'v8_scriptormodule_legacy_lifetime=true',
  'v8_enable_maglev=false',
  'v8_enable_fuzztest=false',
  'v8_imminent_deprecation_warnings=false',
  // TODO(zcbenz): Node.js manually updates this value in common.gypi, we should
  // find out a better procedure without manual updating source code.
  'v8_embedder_string="-node.0"',
  // Not our job fixing the warnings.
  'clang_use_chrome_plugins=false',
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
if (clang) {
  // Setting up system libc++ that builds well with Node/V8's C++ code is hard.
  commonConfig.push('use_custom_libcxx=true')
}
if (hostOs == 'mac') {
  // Default xcode clang is not supported for building v8.
  commonConfig.push('use_xcode_clang=false')
  // Node.js requires macOS 11 and later.
  commonConfig.push('mac_deployment_target="11.0"')
  commonConfig.push('mac_min_system_version="11.0"')
}
if (hostOs == 'linux') {
  // Ensure stable environment.
  commonConfig.push('use_sysroot=true')
}

gen('out/Component', componentConfig)
gen('out/Debug', debugConfig)
gen('out/Release', releaseConfig)

function checkoutNode() {
  if (fs.existsSync('node'))
    return
  let nodeRepo = 'https://github.com/nodejs/node'
  let nodeCommit
  for (const arg of argv) {
    if (arg.startsWith('--node-repo='))
      nodeRepo = arg.substr(arg.indexOf('=') + 1)
    else if (arg.startsWith('--node-commit='))
      nodeCommit = arg.substr(arg.indexOf('=') + 1)
  }
  execSync(`git clone --depth=1 ${nodeRepo}`)
  if (nodeCommit) {
    execSync(`git fetch origin ${nodeCommit}`, {cwd: 'node'})
    execSync('git reset --hard FETCH_HEAD', {cwd: 'node'})
  }
}

function gen(dir, args) {
  spawnSync('gn', ['gen', dir, `--args=${commonConfig.concat(args).join(' ')}`])
}
