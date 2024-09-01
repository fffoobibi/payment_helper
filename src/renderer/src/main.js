import { createApp, defineAsyncComponent  } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

import App from './App.vue'
import './assets/css/main.css'
import './assets/icons/iconfont.css'
import router from './router'

// import Layout from './components/Layout.vue'
import Header from './components/Header.vue'
import Upload from './components/Upload.vue'

const pinia = createPinia()
const app = createApp(App)
app.use(pinia)
app.use(router)
app.use(ElementPlus, { locale: zhCn })
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}
app.component('Layout', defineAsyncComponent(()=> import('./components/Layout.vue')))
app.component('Header', Header)
app.component('Upload', Upload)

app.mount('#app')
