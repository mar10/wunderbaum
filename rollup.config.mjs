import fs from "fs";
// import postcss from "postcss";
// import postcss_url from "postcss-url";
import rup_replace from "@rollup/plugin-replace";
// import rup_scss from "rollup-plugin-scss";
// import rup_terser from "@rollup/plugin-terser";
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
    // TODO: Minify with terser did produce invalid files (only first extension)?
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

    // TODO: Minify with terser did produce invalid files (only first extension)?
    // rup_terser(),

    // TODO: Could not get this to work. It seems to be ignored.
    //       Using a package.json script instead (build:scss).
    //       However, now we cannot auto-inline images. :-(
    // rup_scss({
    //   fileName: "wunderbaum.css",
    //   // Convert image URLs to inline data-uris
    //   processor: () =>
    //     postcss().use(
    //       postcss_url({ url: "inline", maxSize: 10, fallback: "copy" })
    //     ),
    // }),

    // Replace @VERSION and @DATE in build files
    rup_replace({
      preventAssignment: true,
      delimiters: ["", ""],
      values: {
        "@VERSION": "v" + package_json.version,
        "@DATE": "" + new Date().toUTCString(),
        "const DEFAULT_DEBUGLEVEL = 4;": "const DEFAULT_DEBUGLEVEL = 3;",
      },
    }),

    // TODO: additional minfied version?
    // rup_scss({
    //   fileName: "wunderbaum.min.css",
    //   outputStyle: "compressed",
    //   sourceMap: true,
    //   // Convert image URLs to inline data-uris
    //   processor: () =>
    //     postcss().use(
    //       postcss_url({ url: "inline", maxSize: 10, fallback: "copy" })
    //     ),
    // }),
  ],
};
