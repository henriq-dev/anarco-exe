import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import { describe, expect, it, vi } from 'vitest'

const workerSource = readFileSync(new URL('../public/sw.js', import.meta.url), 'utf8')

function createWorker({ fetchImpl, caches }) {
  const handlers = new Map()
  vm.runInNewContext(workerSource, {
    self: { addEventListener: (type, handler) => handlers.set(type, handler) },
    location: { origin: 'https://game.example' },
    URL,
    Response,
    fetch: fetchImpl,
    caches,
  })
  return handlers.get('fetch')
}

function dispatchFetch(handler) {
  const pending = []
  let responsePromise
  handler({
    request: { method: 'GET', url: 'https://game.example/assets/models/anarco.mdl', mode: 'cors' },
    respondWith: promise => { responsePromise = promise },
    waitUntil: promise => pending.push(promise),
  })
  return { responsePromise, pending }
}

describe('Service Worker cache failure handling', () => {
  it('returns a valid network response even when cache storage is full', async () => {
    const cache = { put: vi.fn().mockRejectedValue(new Error('QuotaExceededError')) }
    const caches = { open: vi.fn().mockResolvedValue(cache), match: vi.fn() }
    const networkResponse = new Response('online asset', { status: 200 })
    const handler = createWorker({ fetchImpl: vi.fn().mockResolvedValue(networkResponse), caches })

    const { responsePromise, pending } = dispatchFetch(handler)
    const response = await responsePromise
    await Promise.all(pending)

    expect(response.status).toBe(200)
    expect(await response.text()).toBe('online asset')
    expect(cache.put).toHaveBeenCalledOnce()
    expect(caches.match).not.toHaveBeenCalled()
  })

  it('serves a previously cached response when the network is unavailable', async () => {
    const cachedResponse = new Response('offline asset', { status: 200 })
    const caches = { open: vi.fn(), match: vi.fn().mockResolvedValue(cachedResponse) }
    const handler = createWorker({ fetchImpl: vi.fn().mockRejectedValue(new Error('offline')), caches })

    const { responsePromise } = dispatchFetch(handler)
    const response = await responsePromise

    expect(response.status).toBe(200)
    expect(await response.text()).toBe('offline asset')
    expect(caches.match).toHaveBeenCalledOnce()
  })
})
