import * as core from '@actions/core'
import * as github from '@actions/github'

export type Report = Readonly<{
  hasChanged: boolean,
  state: Record<string, boolean>,
  captures?: Record<string, string>
}>

export type PrInfo = Readonly<{
  owner: string,
  repo: string,
  prNumber: number,
  body: string,
}>

type SwitchInfo = Readonly<{
  id: string,
  before: boolean,
  after: boolean
}>

const buildOctokit = () => {
  const myToken = core.getInput('github-token')
  // You can also pass in additional options as a second parameter to getOctokit
  // const octokit = github.getOctokit(myToken, {userAgent: "MyActionVersion1"});
  return github.getOctokit(myToken)
}

export async function getPrInfo(): Promise<PrInfo> {
  const octokit = buildOctokit();

    const owner = github.context.repo.owner
    const repo = github.context.repo.repo
    const prNumber = parseInt(github.context.payload?.number, 10)
    const { data: pullRequest } = await octokit.rest.pulls.get({
        owner,
        repo,
        pull_number: prNumber,
        mediaType: {
          format: 'patch'
        }
    })
    return {
      owner,
      repo,
      prNumber,
      body: pullRequest.body ?? '',
    }
}

const isEnabled = (checkChar: string) => checkChar !== ' '

const findSwitch = (line: string): SwitchInfo | null => {
  const pattern = /^\s*- \[( |x|X)\](.*?)<!-- ([a-zA-Z0-9\-_]+) state\[( |x|X)\] -->\s*$/
  const match = pattern.exec(line)
  if (match){
    const [, after,, id, before] = match;
    return {
      id: id.trim(),
      before: isEnabled(before),
      after: isEnabled(after),
    }
  } else {
    return null
  }
}

export function process(prBody: string): Report {
  const lines = prBody.split('\n')
  const switches = lines
    .map(line => findSwitch(line))
    .filter(found => found !== null)
    .map(v => v!!)

  const hasChanged = switches.some(({before, after}) => before !== after)
  const state = switches.reduce(
    (acc, {id, after}) => {
      acc[id] = after
      return acc
    },
    {} as Record<string, boolean>
  )
  return {
    hasChanged: hasChanged,
    state,
  }
}

const rewritePrLine = (line: string, {after, before}: SwitchInfo) => {
  if (before !== after) {
    const i = line.lastIndexOf('state[')
    const end = line.indexOf(']', i) 
    const newState = after ? 'x' : ' '
    return `${line.substring(0, i)}state[${newState}]${line.substring(end + 1)}`
  } else {
    return line
  }
}

export function rewritePrBody(content: string): string {
  return content.split('\n')
    .map(line => {
      const switchDetails = findSwitch(line)
      return switchDetails === null ? line : rewritePrLine(line, switchDetails)
    })
    .join('\n')
}

export async function updatePr({owner, repo, prNumber, body}: PrInfo) {
  const newBody = rewritePrBody(body)
  const octokit = buildOctokit()

   await octokit.rest.pulls.update({
      owner,
      repo,
      pull_number: prNumber,
      body: newBody
  })
}
