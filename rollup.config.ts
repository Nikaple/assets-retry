import resolve from '@rollup/plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'
import sourceMaps from 'rollup-plugin-sourcemaps'
import camelCase from 'lodash.camelcase'
import typescript from '@rollup/plugin-typescript'
import json from '@rollup/plugin-json'
import replace from '@rollup/plugin-replace'
import { uglify } from 'rollup-plugin-uglify'

const pkg = require('./package.json')

const libraryName = 'assets-retry'

const createConfig = (imageRetry) => ({
  input: `src/${libraryName}.ts`,
  output: [
    {
      file: imageRetry ? pkg.main : pkg.main.replace('.umd.js', '.no-image.umd.js'),
      name: camelCase(libraryName),
      format: 'umd',
      sourcemap: true
    },
  ],
  external: [],
  watch: {
    include: 'src/**',
  },
  plugins: [
    json(),
    typescript(),
    replace({ __RETRY_IMAGE__: imageRetry }),
    commonjs(),
    resolve(),
    uglify(),
    sourceMaps(),
  ],
})

export default [
  createConfig(true),
  createConfig(false)
]
