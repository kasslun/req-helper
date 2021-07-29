import path from 'path'
import { eslint } from 'rollup-plugin-eslint'
import ts from 'rollup-plugin-typescript2'
const getPath = _path => path.resolve(__dirname, _path)
import packageJSON from './package.json'
import { terser } from "rollup-plugin-terser";
import banner from 'rollup-plugin-banner'

const extensions = ['.ts']

// ts
const tsPlugin = ts({
  tsconfig: getPath('./tsconfig.json'),
  extensions
})


// eslint
const esPlugin = eslint({
  throwOnError: true,
  include: ['src/**/*.ts'],
  exclude: ['node_modules/**', '*.js']
})


// commonConf
const commonConf = {
  input: getPath('./src/index.ts'),
  plugins:[
    esPlugin,
    tsPlugin,
    banner('req-helper\nv<%= pkg.version %>\nBy <%= pkg.author %>\n@license MIT License.')
  ]
}
// files
const outputMap = [
  {
    file: packageJSON.main,
    format: 'cjs',
  },
  {
    file: packageJSON.module,
    format: 'es',
  },
  {
    file: "dist/req-helper.umd.js",
    format: 'umd'
  },
  {
    file: "dist/req-helper.umd.min.js",
    format: 'umd',
    plugins: [terser({
      output: {
        comments: function (node, comment) {
          if (comment.type === "comment2") {
            return /@license/i.test(comment.value);
          }
        },
      }
    })]
  },
]

export default outputMap.map(output => {
  return Object.assign({}, commonConf, {
      output:
        {
          name: packageJSON.name,
          ...output
        }
    }
  )
  // if (/min\.js$/.test(output.file)) {
  //   conf.plugins = [...conf.plugins, terser({ compress: { drop_console: true } })]
  // }
  // return conf;
})
