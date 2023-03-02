# node_with_gn

Scripts and GN configurations to build Node.js with GN.

## How to use

First run bootstrap Scripts to download Node.js and its dependencies:

```
./scripts/bootstrap.js
```

Then start building:

```
./scripts/build.js
```

## Cross compilation

To build for a different cpu, pass `--target-cpu` to bootstrap.

```
./scripts/bootstrap.js --target-cpu=arm64
```

To build for Windows on macOS or Linux, first follow
[Cross-compiling Chrome/win](https://chromium.googlesource.com/chromium/src/+/master/docs/win_cross.md)
to generate a vs toolchain package and put it in current directory, then pass
`--target-os` to bootstrap.

(You can find a working example in this repo's GitHub Actions workflow.)

```
./scripts/bootstrap.js --target-os=win
```
