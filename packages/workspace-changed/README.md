# workspace-changed

Custom Yarn 3+ plugin to execute commands only on workspaces with git changes.

## Installation

Install the latest plugin:

```
yarn plugin import https://github.com/crushjz/yarn-plugins/releases/download/v0.0.1/plugin-workspace-changed.js
```

## Usage

```
yarn workspaces foreach changed ... <commandName>
```

## Examples

Run the `lint` command only on workspaces that has git changes between the current branch and the `dev` branch:

```
yarn workspaces foreach changed --commit dev lint
```

## Options

| Definition    | Description                                                                 |
| ------------- | --------------------------------------------------------------------------- |
| -c,--commit   | Git commit/branch to be used as revision for the diff                       |
| -p,--parallel | Run the commands in parallel                                                |
| -j,--jobs #0  | The maximum number of parallel tasks that the execution will be limited to  |
| --include #0  | An array of glob pattern idents; only matching workspaces will be traversed |
| --exclude #0  | An array of glob pattern idents; matching workspaces won't be traversed     |

## Details

The command name has to be written last because the plugin can forward arguments to it:

```
yarn workspaces foreach changed --commit dev lint --max-warnings=0
```

Under the hood it will use [git diff](https://git-scm.com/docs/git-diff) to retrieve the list of changed files:

```
git --no-pager diff --name-only <commit>
```

## Development

Build the plugin in watch mode and copy it to the `.yarn/plugins` folder:

```
yarn workspace @crushjz/yarn-plugin-workspace-changed dev
```
