// electron.vite.config.mjs
import { resolve } from "path";
import { defineConfig, externalizeDepsPlugin, loadEnv } from "electron-vite";
import vue from "@vitejs/plugin-vue";
var root = process.cwd();
var electron_vite_config_default = ({ mode }) => {
  const env = loadEnv(mode, root);
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
          "~": resolve("."),
          "@": resolve("src/renderer/src")
        }
      },
      server: {
        // 配置代理(解决跨域)
        proxy: {
          "/api": {
            target: env.VITE_API_DOMAIN,
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api/, ""),
            //path
            configure: (proxy, options) => {
              const originalWeb = proxy.web;
              proxy.web = (req, res, ...args) => {
                if (req.headers["target-url"]) {
                  options.target = req.headers["target-url"];
                } else {
                  options.target = env.VITE_API_DOMAIN;
                }
                originalWeb.call(proxy, req, res, ...args);
              };
            }
          },
          "/upload": {
            target: env.VITE_UPLOAD_DOMAIN,
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/upload/, ""),
            //path
            configure: (proxy, options) => {
              const originalWeb = proxy.web;
              proxy.web = (req, res, ...args) => {
                if (req.headers["target-url"]) {
                  options.target = req.headers["target-url"];
                } else {
                  options.target = env.VITE_UPLOAD_DOMAIN;
                }
                originalWeb.call(proxy, req, res, ...args);
              };
            }
          }
        }
      }
    }
  });
};
export {
  electron_vite_config_default as default
};
