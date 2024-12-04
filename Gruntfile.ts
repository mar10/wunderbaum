/*
 * Build scripts for Wunderbaum
 */
module.exports = (grunt: any) => {
  grunt.initConfig({
    pkg: grunt.file.readJSON("package.json"),

    exec: {
      build: {
        stdin: true, // Allow interactive console
        cmd: "npm run build",
      },
      copy_dist: {
        stdin: true, // Allow interactive console
        cmd: "rm dist/*.* ; cp build/*.* dist",
      },
      make_docs: {
        stdin: true, // Allow interactive console
        cmd: "npm run api_docs",
      },
      make_dist: {
        stdin: true, // Allow interactive console
        cmd: "npm run make_dist",
      },
    },
    connect: {
      dev: {
        options: {
          port: 8088,
          base: "./",
          keepalive: false, // pass on, so subsequent tasks (like watch or qunit) can start
        },
      },
    },
    qunit: {
      options: {
        httpBase: "http://localhost:8088",
        //   timeout: 20000,
        //   "--cookies-file": "misc/cookies.txt",
      },
      dist: ["test/unit/test_dist.html"],
      // build: ["test/unit/test-build.html"],
      develop: ["test/unit/test-dev.html"],
    },
    yabs: {
      release: {
        common: {
          // defaults for all tools
          manifests: ["package.json"],
        },
        // The following tools are run in order:
        check: {
          branch: ["main"],
          canPush: true,
          clean: true,
          cmpVersion: "gte",
        },
        run_test: { tasks: ["test_dev"], always: true },
        bump: {}, // 'bump' also uses the increment mode `yabs:release:MODE`
        run_build: { tasks: ["exec:build"], always: true }, // TODO 'always' NYI
        run_copy_dist: { tasks: ["exec:copy_dist"] },
        run_make_docs: { tasks: ["exec:make_docs"] },
        run_test_dist: { tasks: ["test_dist"] },
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
  for (const key in grunt.file.readJSON("package.json").devDependencies) {
    if (key !== "grunt" && key.indexOf("grunt") === 0) {
      grunt.loadNpmTasks(key);
    }
  }
  // Register tasks
  grunt.registerTask("test_dev", [
    "connect:dev", // start server
    "qunit:develop",
  ]);
  grunt.registerTask("test_dist", [
    "connect:dev", // start server
    "qunit:dist",
  ]);
  grunt.registerTask("ci", ["test_dev"]); // Called by 'npm test'
  grunt.registerTask("default", ["test_dev"]);

  if (parseInt(process.env.TRAVIS_PULL_REQUEST!, 10) > 0) {
    // saucelab keys do not work on forks
    // http://support.saucelabs.com/entries/25614798
    grunt.registerTask("travis", ["test_dev"]);
  } else {
    grunt.registerTask("travis", ["test_dev"]); // , "sauce"]
  }
};
