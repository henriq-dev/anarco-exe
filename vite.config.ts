import { manusGameTuning } from './scripts/manus-tuning/vite.mjs'
import { loadEnv, type Plugin } from 'vite'
import { defineConfig } from 'vitest/config'

const criticalModulePreload: Plugin = {
  name: 'anarco-critical-module-preload',
  transformIndexHtml: {
    order: 'post',
    handler(html, context) {
      if (html.includes('rel="modulepreload"')) return html
      const entry = context.bundle
        ? Object.values(context.bundle).find(output => output.type === 'chunk' && output.isEntry)
        : undefined
      const src = entry ? `./${entry.fileName}` : './src/anarco-entry.ts'
      const link = `<link rel="modulepreload" href="${src}" crossorigin>\n`
      const scriptPosition = html.indexOf('<script type="module"')
      if (scriptPosition >= 0) return `${html.slice(0, scriptPosition)}${link}${html.slice(scriptPosition)}`
      return html.replace('</head>', `${link}</head>`)
    },
  },
}

// Relative base keeps production output portable; the Session owns preview HOST/PORT.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', ['HOST', 'PORT'])
  const port = Number(env.PORT ?? 3000)
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid PORT')
  return {
    base: './',
    plugins: [manusGameTuning(), criticalModulePreload],
    server: {
      host: env.HOST ?? '127.0.0.1', port, strictPort: true,
      allowedHosts: ['.manuspre.computer', '.manus.computer', '.manus-asia.computer', '.manuscomputer.ai', '.manusvm.computer', 'localhost', '127.0.0.1'],
    },
    build: { target: 'es2022', assetsInlineLimit: 0, chunkSizeWarningLimit: 4600, sourcemap: false },
    test: { environment: 'node', include: ['tests/**/*.test.{ts,mjs}'] },
  }
})
