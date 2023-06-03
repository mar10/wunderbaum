import fs from "fs";
import postcss from "postcss";
import postcss_url from "postcss-url";
import rup_modify from "rollup-plugin-modify";
import rup_scss from "rollup-plugin-scss";
import rup_terser from "@rollup/plugin-terser";
import rup_typescript from "@rollup/plugin-typescript";

let package_json = JSON.parse(fs.readFileSync("package.json", "utf8"));

export default {
  input: "src/wunderbaum.ts",
  output: [
    {
      file: "build/wunderbaum.esm.js",
      format: "es",
    },
    {
      file: "build/wunderbaum.umd.js",
      format: "umd",
      name: "mar10",
    },
    // Minify with terser did produce invalid files ( only first extension)???
    // running `terser` as npm script from package.json instead
    // {
    //   file: "build/wunderbaum.esm.min.js",
    //   format: "es",
    //   plugins: [rup_terser()], // minify
    //   sourcemap: true,
    // },
    // {
    //   file: "build/wunderbaum.umd.min.js",
    //   format: "umd",
    //   name: "mar10",
    //   plugins: [rup_terser()], // minify
    //   sourcemap: true,
    // },
  ],
  plugins: [
    rup_typescript(),
    rup_modify({
      "@VERSION": "v" + package_json.version,
      "@DATE": "" + new Date().toUTCString(),
      "const default_debuglevel = 4;": "const default_debuglevel = 3;",
    }),
    // rup_terser(),
    rup_scss({
      fileName: "wunderbaum.css",
      outputStyle: "compressed",
      sourceMap: true,
      // convert
      processor: () =>
        postcss().use(
          postcss_url({ url: "inline", maxSize: 10, fallback: "copy" })
        ),
    }),
  ],
};
