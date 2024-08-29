import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin, loadEnv } from 'electron-vite'
import vue from '@vitejs/plugin-vue'

const root = process.cwd()

export default ({ mode }) => {
  const env = loadEnv(mode, root)
  return defineConfig({
    main: {
      plugins: [externalizeDepsPlugin()]
    },
    preload: {
      plugins: [externalizeDepsPlugin()]
    },
    renderer: {
      plugins: [vue()],
      resolve: {
        // 配置别名
        alias: {
          '~': resolve('.'),
          '@': resolve('src/renderer/src')
        }
      },
      server: {
        // 配置代理(解决跨域)
        proxy: {
          '/api': {
            target: env.VITE_API_DOMAIN,
            changeOrigin: true,
            rewrite: path => path.replace(/^\/api/, '')
          },
          '/upload': {
            target: env.VITE_UPLOAD_DOMAIN,
            changeOrigin: true,
            rewrite: path => path.replace(/^\/upload/, '')
          }
        }
      },
    }
  })
}
