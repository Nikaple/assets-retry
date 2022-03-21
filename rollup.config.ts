import resolve from '@rollup/plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'
import sourceMaps from 'rollup-plugin-sourcemaps'
import camelCase from 'lodash.camelcase'
import typescript from '@rollup/plugin-typescript'
import json from '@rollup/plugin-json'
import replace from '@rollup/plugin-replace'
import { uglify } from 'rollup-plugin-uglify'

const pkg = require('./package.json')
const env = process.env.NODE_ENV;

const libraryName = 'assets-retry'

const output = [{ file: pkg.main, name: camelCase(libraryName), format: 'umd', sourcemap: env !== 'prod' }]
const plugins = [
  // Allow json resolution
  json(),
  // Compile TypeScript files
  typescript(),
  // replace environment variables
  replace({ __RETRY_IMAGE__: process.env.__RETRY_IMAGE__ }),
  // Allow bundling cjs modules (unlike webpack, rollup doesn't understand cjs)
  commonjs(),
  // Allow node_modules resolution, so you can use 'external' to control
  // which external modules to include in the bundle
  // https://github.com/rollup/rollup-plugin-node-resolve#usage
  resolve(),
  // uglify js
  uglify(),
  // // Resolve source maps to the original source
  // sourceMaps(),
];
env !== 'prod' && plugins.push(sourceMaps())

export default {
  input: `src/${libraryName}.ts`,
  output,
  // Indicate here external modules you don't wanna include in your bundle (i.e.: 'lodash')
  external: [],
  watch: {
    include: 'src/**',
  },
  plugins
}
