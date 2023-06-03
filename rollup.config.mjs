import fs from "fs";
import modify from "rollup-plugin-modify";
import postcss from "postcss";
import postcss_url from "postcss-url";
import scss from "rollup-plugin-scss";
import terser from "@rollup/plugin-terser";
import typescript from "@rollup/plugin-typescript";

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
    {
      file: "build/wunderbaum.esm.min.js",
      format: "es",
      plugins: [terser()], // minify
      sourcemap: true,
    },
    {
      file: "build/wunderbaum.umd.min.js",
      format: "umd",
      name: "mar10",
      plugins: [terser()], // minify
      sourcemap: true,
    },
  ],
  plugins: [
    typescript(),
    modify({
      "@VERSION": "v" + package_json.version,
      "@DATE": "" + new Date().toUTCString(),
      "const default_debuglevel = 4;": "const default_debuglevel = 3;",
    }),
    scss({
      fileName: "wunderbaum.css",
      outputStyle: "compressed",
      sourceMap: true,
      // convert
      processor: () => postcss().use(postcss_url({ url: "inline" })),
    }),
  ],
};
