#!/usr/bin/env node

const {argv, verbose, execSync} = require('./common')

let dir = 'out/Release'
const args = argv.filter((arg) => {
  if (arg.startsWith('out')) {
    dir = arg
    return false;
  } else {
    return true;
  }
})

if (verbose)
  args.push('-v')

execSync(`ninja -C ${dir} ${args.join(' ')}`)
