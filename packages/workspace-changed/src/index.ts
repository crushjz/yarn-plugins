import { Plugin } from '@yarnpkg/core'
import { Changed } from './changed.command'

const plugin: Plugin = {
  hooks: {},
  commands: [Changed],
}

export default plugin
