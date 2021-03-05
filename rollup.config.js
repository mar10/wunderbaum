import fs from 'fs';
import typescript from '@rollup/plugin-typescript';
import modify from 'rollup-plugin-modify';
import scss from 'rollup-plugin-scss'

let package_json = JSON.parse(fs.readFileSync('package.json', 'utf8'));

export default {
  input: 'src/wunderbaum.ts',
  output: [
    {
      file: 'dist/wunderbaum.esm.js',
      format: 'es',
    },
    {
      file: 'dist/wunderbaum.umd.js',
      format: 'umd',
      name: 'mar10',
    },
  ],
  plugins: [
    typescript(),
    scss({
      output: "dist/wunderbaum.css"
    }),
    modify({
      '@VERSION': 'v' + package_json.version,
      '@DATE_NONO': '' + new Date().toUTCString(),
      'const default_debuglevel = 2;': 'const default_debuglevel = 1;',
    }),
  ],
};
