import type { StorageAdapter } from './types'

const memoryStore = new Map<string, string>()

export const localStorageAdapter: StorageAdapter = {
  getItem(key) {
    if (typeof window === 'undefined') {
      return memoryStore.get(key) ?? null
    }

    return window.localStorage.getItem(key)
  },
  setItem(key, value) {
    if (typeof window === 'undefined') {
      memoryStore.set(key, value)
      return
    }

    window.localStorage.setItem(key, value)
  },
  removeItem(key) {
    if (typeof window === 'undefined') {
      memoryStore.delete(key)
      return
    }

    window.localStorage.removeItem(key)
  },
}
