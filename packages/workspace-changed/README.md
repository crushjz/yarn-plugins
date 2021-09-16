# workspace-changed

Custom Yarn 3+ plugin to execute commands only on workspaces with git changes.

## Installation

Install the latest plugin:

```
yarn plugin import https://github.com/crushjz/yarn-plugins/releases/latest/download/plugin-workspace-changed.js
```

## `changed foreach`

### Usage

```
yarn workspaces changed foreach ... <commandName>
```

### Examples

Run the `lint` command only on workspaces that has git changes between the current branch and the `dev` branch:

```
yarn workspaces changed foreach --commit dev lint
```

### Options

| Definition    | Description                                                                 |
| ------------- | --------------------------------------------------------------------------- |
| -c,--commit   | Git commit, branch or range to be used as revision for the diff             |
| -p,--parallel | Run the commands in parallel                                                |
| -j,--jobs #0  | The maximum number of parallel tasks that the execution will be limited to  |
| --include #0  | An array of glob pattern idents; only matching workspaces will be traversed |
| --exclude #0  | An array of glob pattern idents; matching workspaces won't be traversed     |

### Details

The command name has to be written last because the plugin can forward arguments to it:

```
yarn workspaces changed foreach --commit dev lint --max-warnings=0
```

Under the hood it uses [git diff](https://git-scm.com/docs/git-diff) to retrieve the list of changed files:

```
git --no-pager diff --name-only <commit>
```

`<commit>` can be any git branch, commit or range (eg `branch-1...branch-2`)

## `changed list`

Returns a list of workspaces that changed.

If the `--json` option is set, it also returns the reasons each workspace is marked as changed. Currently there are two reasons:

- `file-changed`: if the `git diff` returned at least one file that matched the workspace path
- `dependency-changed`: if one of the workspace dependency has changed (by either a file change or a dependency change)

### Usage

```
yarn workspaces changed list ...
```

### Examples

```
yarn workspaces changed list --json
```

will output:

```
{"name":"@scope/workspace-1","location":"packages/workspace-1","reasons":["file-change"]}
{"name":"@scope/workspace-2","location":"packages/workspace-2","reasons":["dependency-change","file-change"]}
```

### Options

| Definition  | Description                                                                                               |
| ----------- | --------------------------------------------------------------------------------------------------------- |
| -c,--commit | Git commit, branch or range to be used as revision for the diff                                           |
| -j,--json   | If true the output will follow a JSON-stream also known as NDJSON (https://github.com/ndjson/ndjson-spec) |

# Development

Build the plugin in watch mode and copy it to the `.yarn/plugins` folder:

```
yarn workspace @crushjz/yarn-plugin-workspace-changed dev
```
