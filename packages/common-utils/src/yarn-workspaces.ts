import {
  Configuration,
  formatUtils,
  structUtils,
  Workspace,
} from '@yarnpkg/core'
import { PortablePath } from '@yarnpkg/fslib'
import any from 'ramda/es/any'

export const getWorkspaceFullName = (w: Workspace): string =>
  `${w.locator.scope ? `@${w.locator.scope}/` : ''}${w.locator.name}`

export type WorkspaceInfo = {
  readonly name: string
  readonly scope: string | null
  readonly fullName: string
  readonly identHash: string
  readonly relativePath: PortablePath
}

export const getWorkspaceInfo = (w: Workspace): WorkspaceInfo => ({
  name: w.locator.name,
  scope: w.locator.scope,
  fullName: getWorkspaceFullName(w),
  identHash: w.locator.identHash,
  relativePath: w.relativeCwd,
})

type WorkspaceWithDependencies = {
  readonly workspace: Workspace
  readonly dependencies: Array<Workspace>
}
export const getWorkspaceWithDependencies = (
  workspace: Workspace
): WorkspaceWithDependencies => {
  const dependencies = Array.from(workspace.getRecursiveWorkspaceDependencies())
  return { workspace, dependencies }
}
export const getWorkspacesWithDependencies = (workspaces: Array<Workspace>) =>
  workspaces.map(getWorkspaceWithDependencies)

type WorkspaceWithDependants = {
  readonly workspace: Workspace
  readonly dependants: Array<Workspace>
}
export const getWorkspacesWithDependants = (
  workspacesWithDeps: Array<WorkspaceWithDependencies>
) =>
  workspacesWithDeps.map(({ workspace }): WorkspaceWithDependants => {
    const dependants = workspacesWithDeps
      .filter(({ dependencies }) =>
        any(
          dep => dep.locator.identHash === workspace.locator.identHash,
          dependencies
        )
      )
      .map(({ workspace: w }) => w)

    return { workspace, dependants }
  })

export const findWorkspaceByFullName = (
  fullName: string,
  workspaces: Array<Workspace>
) => workspaces.find(w => getWorkspaceFullName(w) === fullName)

const colors = [`#2E86AB`, `#A23B72`, `#F18F01`, `#C73E1D`, `#CCE2A3`] as const

type GetPrefixOptions = {
  readonly configuration: Configuration
  readonly commandIndex: number
}
export const getPrefix = (
  workspace: Workspace,
  { configuration, commandIndex }: GetPrefixOptions
) => {
  const ident = structUtils.convertToIdent(workspace.locator)
  const name = structUtils.stringifyIdent(ident)
  const prefix = `[${name}]:`
  const color = colors[commandIndex % colors.length] || colors[0]
  return formatUtils.pretty(configuration, prefix, color)
}
