import { exec } from 'child_process'

/**
 * Returns the current branch name.
 */
export const getBranchName = () =>
  new Promise<string>((resolve, reject) =>
    exec('git rev-parse --abbrev-ref HEAD', (err, stdout) => {
      if (err) {
        return reject(err)
      }
      if (typeof stdout !== 'string') {
        return reject(new Error('stdout is not a string'))
      }
      return resolve(stdout.trim())
    })
  )

/**
 * Returns a list of files changed. It uses `git diff` under the hood.
 *
 * https://git-scm.com/docs/git-diff
 *
 * @param commit Git revision patterns: eg `<commit>..<commit>`, <commit>
 * @param limit https://git-scm.com/docs/git-diff#Documentation/git-diff.txt--lltnumgt
 */
export const getFilesChanged = (commit?: string, limit?: number) =>
  new Promise<Array<string>>((resolve, reject) => {
    const withLimit = limit ? `-l ${limit}` : ''

    const gitCommand = `git --no-pager diff --name-only ${withLimit} ${
      commit ?? ''
    }`

    return exec(gitCommand, (err, stdout) => {
      if (err) {
        return reject(err)
      }
      if (typeof stdout !== 'string') {
        return reject(new Error('stdout is not a string'))
      }

      const fileNames = stdout.split(/[\r\n|\n|\r]/).filter(String)
      return resolve(fileNames)
    })
  })
