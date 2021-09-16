import { Plugin } from '@yarnpkg/core'
import { ChangedForeachCommand } from './changed-foreach.command'
import { ChangedListCommand } from './changed-list.command'

const plugin: Plugin = {
  hooks: {},
  commands: [ChangedForeachCommand, ChangedListCommand],
}

export default plugin
