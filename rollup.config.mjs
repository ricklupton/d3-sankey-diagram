import { nodeResolve } from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import pkg from './package.json' with { type: "json" }

const d3External = [
  'd3-collection',
  'd3-array',
  'd3-selection',
  'd3-transition',
  'd3-dispatch',
  'd3-format',
  'd3-interpolate'
]

const globals = {}
d3External.forEach(k => {
  globals[k] = 'd3'
})

export default [
  // browser-friendly UMD build
  {
    input: 'src/index.js',
    output: {
      file: pkg.browser,
      format: 'umd',
      name: 'd3',
      extend: true,
      globals: globals
    },
    external: d3External,
    plugins: [
      nodeResolve(), // find modules in node_modules
      commonjs({ // convert CommonJS to ES modules so they can be loaded
        // namedExports: {
        //   'node_modules/graphlib/index.js': ['Graph', 'alg']
        // }
      })
    ]
  },

  // CommonJS (for Node) and ES module (for bundlers) build.
  // (We could have three entries in the configuration array
  // instead of two, but it's quicker to generate multiple
  // builds from a single configuration where possible, using
  // the `targets` option which can specify `dest` and `format`)
  {
    input: 'src/index.js',
    output: [
      { file: pkg.main, format: 'cjs' },
      { file: pkg.module, format: 'es' }
    ],
    external: [...d3External, '@dagrejs/graphlib'],
  }
]
