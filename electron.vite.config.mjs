import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin, loadEnv } from 'electron-vite'
import vue from '@vitejs/plugin-vue'
// import info from "./package.json?assets=json"
// const packageJson = JSON.parse(readFileSync(path.resolve(__dirname, 'package.json'), 'utf-8'));
// console.log('info ===> ', info.version)
const root = process.cwd()

export default ({ mode }) => {
  const env = loadEnv(mode, root)
  return defineConfig({
    // define: {
    //   __APP_VERSION__: JSON.stringify(info.version)
    // },
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
            rewrite: (path) => path.replace(/^\/api/, ''), //path
            configure: (proxy, options) => {
              // 使用自定义的代理逻辑
              const originalWeb = proxy.web
              proxy.web = (req, res, ...args) => {
                // 根据请求头或其他信息动态设置目标
                if (req.headers['target-url']) {
                  options.target = req.headers['target-url']
                } else {
                  options.target = env.VITE_API_DOMAIN
                }
                // 调用原始的代理逻辑
                originalWeb.call(proxy, req, res, ...args)
              }
            }
          },
          '/upload': {
            target: env.VITE_UPLOAD_DOMAIN,
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/upload/, ''), //path
            configure: (proxy, options) => {
              // 使用自定义的代理逻辑
              const originalWeb = proxy.web
              proxy.web = (req, res, ...args) => {
                // 根据请求头或其他信息动态设置目标
                if (req.headers['target-url']) {
                  options.target = req.headers['target-url']
                } else {
                  options.target = env.VITE_UPLOAD_DOMAIN
                }
                // 调用原始的代理逻辑
                originalWeb.call(proxy, req, res, ...args)
              }
            }
          }
        }
      }
    },
  })
}
