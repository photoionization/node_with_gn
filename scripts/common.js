const fs = require('fs')
const path = require('path')
const {execSync, spawnSync} = require('child_process')

// Quit when promise is rejected.
process.on('unhandledRejection', (error) => {
  console.error(error)
  process.exit(1)
})

// Switch to root dir.
process.chdir(path.dirname(__dirname))

// Allow searching modules from libs/.
module.parent.paths.push(path.resolve(__dirname, '..', 'third_party', 'bundled_node_modules'))

// Expose ninja and gn to PATH.
const gnDir = path.resolve('third_party', 'gn')
process.env.PATH = `${gnDir}${path.delimiter}${process.env.PATH}`

// Get tag version.
const version = String(execSync('git describe --always --tags')).trim()

// Get target OS.
const targetOs = {
  win32: 'win',
  linux: 'linux',
  darwin: 'mac',
}[process.platform]

// Get target_cpu from args.gn.
let targetCpu = 'x64'
let clang = targetOs != 'win'
if (fs.existsSync('out/Release/args.gn')) {
  const content = String(fs.readFileSync('out/Release/args.gn'))
  const match = content.match(/target_cpu = "(.*)"/)
  if (match && match.length > 1)
    targetCpu = match[1]
  if (content.includes('is_clang = true'))
    clang = true
  else
    clang = false
}

let hostCpu = process.arch
if (hostCpu == 'ia32')
  hostCpu = 'x86'

// Parse args.
let verbose = false
const argv = process.argv.slice(2).filter((arg) => {
  if (arg == '-v' || arg == '--verbose') {
    verbose = true
    return false
  } else if (arg == '--clang') {
    clang = true
    return false
  } else if (arg == '--no-clang') {
    clang = false
    return false
  } else if (arg.startsWith('--target-cpu=')) {
    targetCpu = arg.substr(arg.indexOf('=') + 1)
    return false
  } else {
    return true
  }
})

// Turn stream into Promise.
function streamPromise(stream) {
  return new Promise((resolve, reject) => {
    stream.on('end', () => {
      resolve('end')
    })
    stream.on('finish', () => {
      resolve('finish')
    })
    stream.on('error', (error) => {
      reject(error)
    })
  })
}

// Helper around execSync.
const execSyncWrapper = (command, options = {}) => {
  // Print command output by default.
  if (!options.stdio)
    options.stdio = 'inherit'
  // Merge the custom env to global env.
  if (options.env)
    options.env = Object.assign(options.env, process.env)
  return execSync(command, options)
}

const spawnSyncWrapper = (exec, args, options = {}) => {
  // Print command output by default.
  if (!options.stdio)
    options.stdio = 'inherit'
  // Merge the custom env to global env.
  if (options.env)
    options.env = Object.assign(options.env, process.env)
  const result = spawnSync(exec, args, options)
  if (result.error)
    throw result.error
  if (result.signal)
    throw new Error(`Process aborted with ${result.signal}`)
  return result
}

// Export public APIs.
module.exports = {
  verbose,
  version,
  clang,
  argv,
  targetCpu,
  targetOs,
  hostCpu,
  streamPromise,
  execSync: execSyncWrapper,
  spawnSync: spawnSyncWrapper,
}
