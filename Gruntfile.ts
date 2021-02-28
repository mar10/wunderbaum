/*
 * Build scripts for persisto
 */
module.exports = (grunt: any) => {
  grunt.initConfig({
    pkg: grunt.file.readJSON("package.json"),

    exec: {
      build: {
        stdin: true, // Allow interactive console
        cmd: "yarn build",
      },
    },
    qunit: {
      // options: {
      //   timeout: 20000,
      //   "--cookies-file": "misc/cookies.txt",
      // },
      build: ["test/unit/test-core-build.html"],
      develop: ["test/unit/test-core.html"],
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
          branch: ["no-jquery-ts"],
          canPush: true,
          clean: true,
          cmpVersion: "gte",
        },
        bump: {}, // 'bump' also uses the increment mode `yabs:release:MODE`
        run_build: { tasks: ["exec:build"] },
        run_test_dist: { tasks: ["qunit:build"] },
        commit: { add: "." },
        tag: {},
        push: { tags: true, useFollowTags: true },
        githubRelease: {
          repo: "mar10/persisto",
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
  grunt.registerTask("test", ["qunit:develop"]);
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
