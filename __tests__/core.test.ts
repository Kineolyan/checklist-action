
import { process, rewritePrBody } from '../src/core'
import { expect } from '@jest/globals'

describe('process', () => {
  it('finds a single switch', () => {
    const report = process(`
        PR body
         - [ ] run operation <!-- run-operation state[x] -->
    `);
    
    expect(report).toEqual({
        hasChanged: true,
        state: {
            'run-operation': false
        },
    });
  })

  it('finds multiple switches', () => {
    const report = process(`
        PR body
         - [ ] do some random task<!-- do-something state[ ] -->                
         - [x] operate <!-- operate state[x] --> 
    `);
    
    expect(report).toEqual({
        hasChanged: false,
        state: {
            'do-something': false,
            'operate': true
        },
    });
  })

  it('ignores badly-formatted lines', () => {
    const report = process(`
        PR body
         - [ ] do some random task<!-- too many words before state[ ] -->                
         - [] not enough space in checkbox <!-- operate state[x] --> 
         - [  ] too many spaces in checkbox <!-- operate state[x] --> 
          - [y] not the correct checkbox char <!-- operate state[x] --> 
         - [ ] not enough space in checkbox <!-- operate state[] --> 
         - [ ] too many spaces in checkbox <!-- operate state[  ] --> 
         - [ ] not the correct checkbox char <!-- operate state[v] --> 
         - [x] missing id <!-- state[x] --> 
         - [x] id after state <!-- state[x] id-after-state --> 
    `);
    
    const expectedReport = {
        hasChanged: false,
        state: {},
    }
    expect(report).toEqual(expectedReport);
    
  })
})

describe('rewritePrBody', () => {
  it('does not rewrite unchanged unchecked line', () => {
    const output = rewritePrBody(`
       - [ ] run operation <!-- run-operation state[ ] -->
    `);
    expect(output).toEqual(`
       - [ ] run operation <!-- run-operation state[ ] -->
    `);
  })

  it('does not rewrite unchanged checked line', () => {
    const output = rewritePrBody(`
       - [x] run operation <!-- run-operation state[x] -->
    `);
    expect(output).toEqual(`
       - [x] run operation <!-- run-operation state[x] -->
    `);
  })

  it('rewrites changed unchecked line', () => {
    const output = rewritePrBody(`
       - [ ] run operation <!-- run-operation state[x] -->
    `);
    expect(output).toEqual(`
       - [ ] run operation <!-- run-operation state[ ] -->
    `);
  })

  it('rewrites changed checked line', () => {
    const output = rewritePrBody(`
       - [x] run operation <!-- run-operation state[ ] -->
    `);
    expect(output).toEqual(`
       - [x] run operation <!-- run-operation state[x] -->
    `);
  })
})
