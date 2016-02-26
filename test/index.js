import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { spy } from 'sinon'
import promiseMiddleware from '../src'
import { request, reject, resolve } from '../src'
import 'babel-polyfill'

global.expect = chai.expect
chai.use(chaiAsPromised)

function noop () {}
const GIVE_ME_META = 'GIVE_ME_META'

function metaMiddleware () {
  return next => action =>
    action.type === GIVE_ME_META
      ? next(Object.assign({}, action, { meta: 'here you go' }))
      : next(action)
}

describe('before promiseMiddleware is called', () => {
  it('returns the request, reject, and resolve strings with default values', () => {
    expect(request('MY_ACTION')).to.equal('MY_ACTION_REQUEST')
    expect(reject('MY_ACTION')).to.equal('MY_ACTION_FAIL')
    expect(resolve('MY_ACTION')).to.equal('MY_ACTION')
  })
})

describe('promiseMiddleware', () => {
  let baseDispatch
  let dispatch
  let foobar
  let err

  beforeEach(() => {
    baseDispatch = spy()
    dispatch = function d (action) {
      const methods = { dispatch: d, getState: noop }
      return metaMiddleware()(promiseMiddleware(methods)(baseDispatch))(action)
    }
    foobar = { foo: 'bar' }
    err = new Error()
  })
  it('dispatches request action before promise without arguments', () => {
    dispatch({
      type: 'ACTION_TYPE',
      payload: new Promise(() => {})
    })

    expect(baseDispatch.calledOnce).to.be.true

    expect(baseDispatch.firstCall.args[0]).to.deep.equal({
      type: request('ACTION_TYPE')
    })
  })

  it('dispatches request action before promise with arguments', () => {
    dispatch({
      type: 'ACTION_TYPE',
      payload: new Promise(() => {}),
      meta: {
        foo: 'bar'
      }
    })

    expect(baseDispatch.calledOnce).to.be.true

    expect(baseDispatch.firstCall.args[0]).to.deep.equal({
      type: request('ACTION_TYPE'),
      meta: {
        foo: 'bar'
      }
    })
  })

  it('dispatches resolve action with arguments', async function () {
    await dispatch({
      type: 'ACTION_TYPE',
      payload: Promise.resolve(foobar),
      meta: {
        foo2: 'bar2'
      }
    })

    expect(baseDispatch.calledTwice).to.be.true

    expect(baseDispatch.secondCall.args[0]).to.deep.equal({
      type: 'ACTION_TYPE',
      payload: foobar,
      meta: {
        foo2: 'bar2'
      }
    })
  })

  it('dispatches promise passed in as payload.promise', async function () {
    await dispatch({
      type: 'ACTION_TYPE',
      payload: {
        promise: Promise.resolve(foobar),
        foo1: 'bar1'
      },
      meta: {
        foo2: 'bar2'
      }
    })

    expect(baseDispatch.calledTwice).to.be.true

    expect(baseDispatch.secondCall.args[0]).to.deep.equal({
      type: 'ACTION_TYPE',
      payload: foobar,
      meta: {
        foo2: 'bar2',
        originalPayload: {
          foo1: 'bar1'
        }
      }
    })
  })

  it('dispatches reject action with arguments', async function () {
    await dispatch({
      type: 'ACTION_TYPE',
      payload: Promise.reject(err),
      meta: {
        foo3: 'bar3',
        foo4: 'bar4'
      }
    })

    expect(baseDispatch.calledTwice).to.be.true

    expect(baseDispatch.secondCall.args[0]).to.deep.equal({
      type: reject('ACTION_TYPE'),
      error: err,
      meta: {
        foo3: 'bar3',
        foo4: 'bar4'
      }
    })
  })

  it('dispatches reject action with originalPayload when payload.promise', async function () {
    await dispatch({
      type: 'ACTION_TYPE',
      payload: {
        promise: Promise.reject(err),
        foo1: 'bar1'
      },
      meta: {
        foo2: 'bar2',
        foo3: 'bar3'
      }
    })

    expect(baseDispatch.calledTwice).to.be.true

    expect(baseDispatch.secondCall.args[0]).to.deep.equal({
      type: reject('ACTION_TYPE'),
      error: err,
      meta: {
        foo2: 'bar2',
        foo3: 'bar3',
        originalPayload: {
          foo1: 'bar1'
        }
      }
    })
  })

  it('returns the original promise from dispatch', () => {
    let promiseDispatched = new Promise(() => {})

    let dispatchedResult = dispatch({
      type: 'ACTION_TYPE',
      payload: promiseDispatched
    })
    // Unable to compare promise directly for some reason, so comparing functions
    expect(dispatchedResult.then).to.be.equal(promiseDispatched.then)
  })

  it('resolves the original promise results from dispatch', () => {
    let promiseDispatched = Promise.resolve(foobar)

    let dispatchedResult = dispatch({
      type: 'ACTION_TYPE',
      payload: promiseDispatched
    })
    expect(dispatchedResult).to.eventually.equal(foobar)
  })

  it('reject the original promise from dispatch', () => {
    let promiseDispatched = Promise.reject(err)

    let dispatchedResult = dispatch({
      type: 'ACTION_TYPE',
      payload: promiseDispatched
    })
    expect(dispatchedResult).to.eventually.be.rejectedWith(err)
  })

  it('ignores non-promises', async function () {
    dispatch(foobar)
    expect(baseDispatch.calledOnce).to.be.true
    expect(baseDispatch.firstCall.args[0]).to.equal(foobar)

    dispatch({ type: 'ACTION_TYPE', payload: foobar })
    expect(baseDispatch.calledTwice).to.be.true
    expect(baseDispatch.secondCall.args[0]).to.deep.equal({
      type: 'ACTION_TYPE',
      payload: foobar
    })
  })

  it('starts async dispatches from beginning of middleware chain', async function () {
    dispatch({ type: GIVE_ME_META })
    dispatch({ type: GIVE_ME_META })
    expect(baseDispatch.args.map(args => args[0].meta)).to.eql([
      'here you go',
      'here you go'
    ])
  })
})
