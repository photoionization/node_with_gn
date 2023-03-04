#!/usr/bin/env python3
# Copyright 2008 the V8 project authors.
# Copyright 2023 Microsoft Inc.
# Use of this source code is governed by a BSD-style license that can be
# found in the LICENSE file.

import glob
import os
import sys

def SearchFiles(root, dir, ext):
  list = glob.glob(dir + '/**/*.' + ext, recursive=True)
  if sys.platform == 'win32':
    list = [ x.replace('\\', '/') for x in list]
  list = [ os.path.relpath(x, root) for x in list ]
  return sorted(list)


if __name__ == '__main__':
  try:
      print('\n'.join(SearchFiles(*sys.argv[1:])))
  except Exception as e:
    print(str(e))
    sys.exit(1)
