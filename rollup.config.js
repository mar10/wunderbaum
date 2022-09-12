import fs from "fs";
import typescript from "@rollup/plugin-typescript";
import modify from "rollup-plugin-modify";
import scss from "rollup-plugin-scss";

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
  ],
  plugins: [
    typescript(),
    modify({
      "@VERSION": "v" + package_json.version,
      "@DATE": "" + new Date().toUTCString(),
      "const default_debuglevel = 4;": "const default_debuglevel = 3;",
    }),
    scss({
      output: "build/wunderbaum.css",
      outputStyle: "compressed",
    }),
  ],
};
