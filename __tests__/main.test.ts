/**
 * Unit tests for the action's main functionality, src/main.ts
 *
 * These should be run as if the action was called from a workflow.
 * Specifically, the inputs listed in `action.yml` should be set as environment
 * variables following the pattern `INPUT_<INPUT_NAME>`.
 */

import * as core from '@actions/core'
import * as main from '../src/main'
import * as actionCore from '../src/core'

// Mock the GitHub Actions core library
const getInputMock = jest.spyOn(core, 'getInput')
const getBooleanInputMock = jest.spyOn(core, 'getBooleanInput')
const setFailedMock = jest.spyOn(core, 'setFailed')
const setOutputMock = jest.spyOn(core, 'setOutput')
const getPrInfoMock = jest.spyOn(actionCore, 'getPrInfo')
const processMock = jest.spyOn(actionCore, 'process')
const updatePrMock = jest.spyOn(actionCore, 'updatePr')
const infoMock = jest.spyOn(core, 'info')

function mockFromData<T>(data: Readonly<Record<string, T>>): (name: string) => T {
  return name => {
    if (name in data) {
      return data[name]
    } else {
          throw new Error(`Unexpected property ${name}`)
    }
  }
}

describe('#readConfig', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('reads basic config from inputs', () => {
    getInputMock.mockImplementation(mockFromData({
        'github-token': 'github-token-for-something',
         'namespace': '',
         'delay': '500',
    }))
    getBooleanInputMock.mockImplementation(mockFromData({
      'capture-labels': true,
    }))

    const config = main.readConfig()
    expect(config).toEqual({
      githubToken: 'github-token-for-something',
      delay: 500,
      captureLabels: true,
      namespace: undefined,
    });

    // Verify that all of the core library functions were called correctly
    // expect(debugMock).toHaveBeenNthCalledWith(1, 'Waiting 500 milliseconds ...')
    // expect(debugMock).toHaveBeenNthCalledWith(
    //   2,
    //   expect.stringMatching(timeRegex)
    // )
  })

  it('reads config with namespace', () => {
    getInputMock.mockImplementation(mockFromData({
        'github-token': 'github-token-for-something',
         'namespace': 'the-ns',
         'delay': '500',
    }))
    getBooleanInputMock.mockImplementation(mockFromData({
      'capture-labels': true,
    }))

    const config = main.readConfig()
    expect(config.namespace).toEqual('the-ns');
  })
})

describe('#run', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    getPrInfoMock.mockImplementationOnce(() => Promise.resolve({
      repo: 'repo',
      owner: 'owner',
      prNumber: 124,
      body: 'body',
    }))
    getBooleanInputMock.mockImplementation(mockFromData({
      'capture-labels': true,
    }))
    updatePrMock.mockImplementationOnce(() => Promise.resolve())
  })

  it('reports the computed report', async () => {
    getInputMock.mockImplementation(mockFromData({
        'github-token': 'github-token-for-something',
         'namespace': '',
         'delay': '-1',
    }))
    const report = {
      hasChanged: true,
      state: {operate: true},
      changed: ['operate'],
    }
    processMock.mockImplementationOnce(() => report)
    await main.run();

    expect(setOutputMock).toHaveBeenCalledWith('report', JSON.stringify(report))
    expect(setFailedMock).not.toHaveBeenCalled()
  })

  it('waits before processing', async () => {
    getInputMock.mockImplementation(mockFromData({
        'github-token': 'github-token-for-something',
         'namespace': '',
         'delay': '10',
    }))
    const report = {
      hasChanged: false,
      state: {operate: true},
      changed: [],
    }
    processMock.mockImplementationOnce(() => report)
    await main.run();

    expect(infoMock).toHaveBeenNthCalledWith(1, expect.stringMatching(/waiting 10 milliseconds/i))
    expect(setFailedMock).not.toHaveBeenCalled()
  })

  it('does not wait before processing for a negative delay', async () => {
    getInputMock.mockImplementation(mockFromData({
        'github-token': 'github-token-for-something',
         'namespace': '',
         'delay': '-10',
    }))
    const report = {
      hasChanged: false,
      state: {operate: true},
      changed: [],
    }
    processMock.mockImplementationOnce(() => report)
    await main.run();

    expect(infoMock).toHaveBeenNthCalledWith(1, expect.stringMatching(/immediate execution/i))
    expect(setFailedMock).not.toHaveBeenCalled()
  })
  
  it('does not update the PR if no changes are detected', async () => {
    getInputMock.mockImplementation(mockFromData({
        'github-token': 'github-token-for-something',
         'namespace': '',
         'delay': '-1',
    }))
    processMock.mockImplementationOnce(() => ({
      hasChanged: false,
      state: {operate: true},
      changed: [],
    }))
    await main.run();

    expect(updatePrMock).not.toHaveBeenCalled()
    expect(setFailedMock).not.toHaveBeenCalled()
  })
})