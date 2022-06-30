# Contributors Guide

First off: thank you for your contribution :heart: <br>
This open source project would not be possible without your support!

There are many ways how you can help:

- Use and test the library. Provide constructive feedback.
- Spread the word: Star this GitHub project, share links, or mention it if you
  find it useful.
- Improve the documentation.
- Report - or fix - bugs (see below).
- Suggest - or implement - new features (see below).
- Donate.

## Report Bugs

Issues can be reported in the [bug tracker](https://github.com/mar10/wunderbaum/issues).

?> Try your best to make fixing as easy as possible.
Create a [minimal, reproducible example](https://stackoverflow.com/help/minimal-reproducible-example).<br>
Do not assume that bugs are fixed, just because they are reported:
Please understand that issues are likely to be closed, if they are hard to
reproduce.

Of course a
[pull request](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/about-pull-requests)
is the most welcomed form of contribution.<br>
Do not forget to add an entry to the `CHANGELOG.md`.

## Request New Features

Features can be requested and discussed in the [bug tracker](https://github.com/mar10/wunderbaum/issues),
or - often more adequate - in the [discussion forum](https://github.com/mar10/wunderbaum/discussions).

?> Please understand that feature requests sometimes are rejected due to the lack
of resources, or because they do not fit into the _greater plan_ or paradigm.<br>
This does not mean that the proposal is bad, so do not feel offended.

If you plan to contribute a feature via a
[pull request](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/about-pull-requests)
we highly recommend to discuss the approach beforehand to avoid effort.

Keep in mind that a feature implementation also includes tests, documentation,
and updates to the demo page.

## Development

Checkout the project from GiHub, then

```bash
$ cd path/to/project
$ yarn
$ yarn dev
```

you can now edit the files in `.../wunderbaum/src` folder.
TypeScript and SCSS files are automatically transpiled to the `.../wunderbaum/build` folder.

Reformat according to the style guide, generate API documentation, run unit tests,
build, or compile a version using these commands:

```bash
$ yarn format
$ yarn docs
$ yarn test
$ yarn build
```

Don't forget to call `yarn format` regularly and before committing:
Formatting errors will be rejected by the CI pipeline.