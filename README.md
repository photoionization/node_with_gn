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

### Build configurations

By default 3 configurations are generated: `Debug`, `Release` and `Component`.
The detailed arguments can be found in the `bootstrap.js` script.

The [component build](https://chromium.googlesource.com/chromium/src/+/master/docs/component_build.md)
is a concept in Chromium that, each component is built as a shared library
instead of static library, which can dramatically reduce linking time. It is
recommended for daily development work.

To build a specific config, pass the out directory to `build.js`:

```
./scripts/build.js out/Component
```

### Cross compilation

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

### Build without clang

By default all platforms use prebuilt clang binaries from Chromium project for
building, you can choose to use system clang or other compilers too. However
please note that V8 does not officially support these methods and build might
fail.

On macOS to build with clang from XCode, pass `use_xcode_clang=true`:

```
./scripts/bootstrap.js --extra-args="use_xcode_clang=true"
```

To build with the default `cc` and `cxx` on your system, pass `--no-clang`:

```
./scripts/bootstrap.js --no-clang
```
