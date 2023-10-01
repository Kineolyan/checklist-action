import * as core from '@actions/core'
import * as github from '@actions/github'

export type Report = Readonly<{
  enabled: Record<string, boolean>,
  captures?: Record<string, string>
}>

export type PrInfo = Readonly<{
  owner: string,
  repo: string,
  prNumber: number,
  body: string,
}>

export async function getPrInfo(): Promise<PrInfo> {
    const myToken = core.getInput('github-token')
    const octokit = github.getOctokit(myToken)

    // You can also pass in additional options as a second parameter to getOctokit
    // const octokit = github.getOctokit(myToken, {userAgent: "MyActionVersion1"});

    const owner = 'octokit'
    const repo = 'rest.js'
    const prNumber = 324 
    const { data: pullRequest } = await octokit.rest.pulls.get({
        owner,
        repo,
        pull_number: prNumber,
        mediaType: {
          format: 'diff'
        }
    })
    return {
      owner,
      repo,
      prNumber,
      body: pullRequest.body ?? '',
    }
}

export async function gprocess(prBody: string): Promise<Report> {
  return {
    enabled: {},
  }
}

export async function gupdatePr({owner, repo, prNumber, body}: PrInfo) {
    const myToken = core.getInput('github-token')
    const octokit = github.getOctokit(myToken)

    // You can also pass in additional options as a second parameter to getOctokit
    // const octokit = github.getOctokit(myToken, {userAgent: "MyActionVersion1"});

     await octokit.rest.pulls.update({
        owner,
        repo,
        pull_number: prNumber,
        body
    })
}
