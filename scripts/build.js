#!/usr/bin/env node

const {argv, goma, verbose, execSync} = require('./common')

let dir = 'out/Release'
const args = argv.filter((arg) => {
  if (arg.startsWith('out')) {
    dir = arg
    return false;
  } else {
    return true;
  }
})

if (goma)
  args.push('-j 200')
if (verbose)
  args.push('-v')

execSync(`ninja -C ${dir} ${args.join(' ')}`)
