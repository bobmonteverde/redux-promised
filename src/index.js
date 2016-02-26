
let requestSuffix = '_REQUEST'
let rejectSuffix = '_FAIL'

export const request = type => type + requestSuffix
export const reject = type => type + rejectSuffix

export const simplePromiseMiddleware = (newRequestSuffix, newRejectSuffix) => {
  requestSuffix = newRequestSuffix || requestSuffix
  rejectSuffix = newRejectSuffix || rejectSuffix

  return function promiseMiddleware ({ dispatch }) {
    return next => action => {
      const { type, payload, meta } = action

      if ((!payload || typeof payload.then !== 'function') && (!payload.promise || typeof payload.promise.then !== 'function') return next(action)

      let promise = typeof payload.then === 'function' ? payload : payload.promise

      const SUCCESS = type
      const REQUEST = request(type)
      const FAILURE = reject(type)

      let metaClone = {}
      if (meta) {
        metaClone.meta = meta
      }
      let payloadClone = {}
      if (promise !== payload) {
        payloadClone.payload = { ...payload }
        delete payloadClone.payload.promise
      }
      next({ ...metaClone, ...payloadClone, type: REQUEST })

      return promise
        .then(
          result => {
            next({ ...metaClone, payload: result, type: SUCCESS })
            return result
          },
          error => {
            next({ ...metaClone, ...payloadClone, error, type: FAILURE })
            return error
          }
        )
    }
  }
}

export default simplePromiseMiddleware()
