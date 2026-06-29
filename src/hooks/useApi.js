import { useState, useEffect, useCallback } from 'react'

/**
 * useApi — generic data-fetching hook
 * @param {function} apiFn   - async function that returns axios response
 * @param {Array}    deps    - dependency array (re-fetches when these change)
 * @param {boolean}  immediate - fetch immediately on mount (default: true)
 */
export function useApi(apiFn, deps = [], immediate = true) {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(immediate)
  const [error,   setError]   = useState(null)

  const execute = useCallback(async (...args) => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiFn(...args)
      setData(res.data)
      return res.data
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Something went wrong'
      setError(msg)
      throw new Error(msg)
    } finally {
      setLoading(false)
    }
  }, deps)

  useEffect(() => {
    if (immediate) execute()
  }, [execute])

  return { data, loading, error, execute, setData }
}

/**
 * useMutation — for POST/PUT/PATCH/DELETE operations
 * Does NOT auto-execute; call `mutate(payload)` manually.
 */
export function useMutation(apiFn) {
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  const mutate = useCallback(async (payload) => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiFn(payload)
      return res.data
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Something went wrong'
      setError(msg)
      throw new Error(msg)
    } finally {
      setLoading(false)
    }
  }, [apiFn])

  return { mutate, loading, error }
}
