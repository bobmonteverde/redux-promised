
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

      if (!payload || typeof payload.then !== 'function') return next(action)

      const SUCCESS = type
      const REQUEST = request(type)
      const FAILURE = reject(type)

      let metaClone = {}
      if (meta) {
        metaClone.meta = meta
      }
      next({ ...metaClone, type: REQUEST })

      return payload
        .then(
          result => {
            next({ ...metaClone, payload: result, type: SUCCESS })
            return result
          },
          error => {
            next({ ...metaClone, error, type: FAILURE })
            return error
          }
        )
    }
  }
}

export default simplePromiseMiddleware()
