import { Plugin } from '@yarnpkg/core'
import { ChangedForeachCommand } from './changed-foreach.command'

const plugin: Plugin = {
  hooks: {},
  commands: [ChangedForeachCommand],
}

export default plugin
