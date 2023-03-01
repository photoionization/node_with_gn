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

execSync(`ninja ${verbose ? '-v' : ''} -C ${dir} ${args.join(' ')}`)
