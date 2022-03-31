/*
 * Build scripts for Wunderbaum
 */
module.exports = (grunt: any) => {
  grunt.initConfig({
    pkg: grunt.file.readJSON("package.json"),

    exec: {
      build: {
        stdin: true, // Allow interactive console
        cmd: "yarn build",
      },
      make_dist: {
        stdin: true, // Allow interactive console
        cmd: "yarn make_dist",
      },
    },
    // connect: {
    //   dev: {
    //     options: {
    //       port: 8080,
    //       base: "./",
    //       keepalive: false, // pass on, so subsequent tasks (like watch or qunit) can start
    //     },
    //   },
    // },
    qunit: {
      options: {
        httpBase: "http://localhost:8080",
        //   timeout: 20000,
        //   "--cookies-file": "misc/cookies.txt",
      },
      dist: ["test/unit/test-dist.html"],
      build: ["test/unit/test-build.html"],
      develop: ["test/unit/test-dev.html"],
    },
    yabs: {
      release: {
        common: {
          // defaults for all tools
          manifests: ["package.json"],
        },
        // The following tools are run in order:
        run_test: { tasks: ["qunit:develop"] },
        check: {
          branch: ["main"],
          canPush: true,
          clean: true,
          cmpVersion: "gte",
        },
        bump: {}, // 'bump' also uses the increment mode `yabs:release:MODE`
        run_build: { tasks: ["exec:dist"] },
        run_test_dist: { tasks: ["qunit:dist"] },
        commit: { add: "." },
        tag: {},
        push: { tags: true, useFollowTags: true },
        githubRelease: {
          repo: "mar10/wunderbaum",
          draft: false,
        },
        npmPublish: {},
        bump_develop: { inc: "prepatch" },
        commit_develop: {
          message: "Bump prerelease ({%= version %}) [ci skip]",
        },
        push_develop: {},
      },
    },
  });

  // ----------------------------------------------------------------------------

  // Load "grunt*" dependencies
  for (let key in grunt.file.readJSON("package.json").devDependencies) {
    if (key !== "grunt" && key.indexOf("grunt") === 0) {
      grunt.loadNpmTasks(key);
    }
  }
  // Register tasks
  grunt.registerTask("test", [
    // "connect:dev", // start server
    "qunit:develop",
  ]);
  grunt.registerTask("ci", ["test"]); // Called by 'npm test'
  grunt.registerTask("default", ["test"]);

  if (parseInt(process.env.TRAVIS_PULL_REQUEST!, 10) > 0) {
    // saucelab keys do not work on forks
    // http://support.saucelabs.com/entries/25614798
    grunt.registerTask("travis", ["test"]);
  } else {
    grunt.registerTask("travis", ["test"]); // , "sauce"]
  }
};
