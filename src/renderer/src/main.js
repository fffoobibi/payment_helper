import { createApp, defineAsyncComponent, nextTick } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus, { ElTooltip } from 'element-plus'
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
import ContextMenu from './components/ContextMenu.vue'
import LoadingList from './components/LoadingList.vue'
import MonaCoEditor from './components/MonaCoEditor.vue'

const pinia = createPinia()
const app = createApp(App)
app.use(pinia)
app.use(router)
app.use(ElementPlus, { locale: zhCn })
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}
app.component('Layout', defineAsyncComponent(() => import('./components/Layout.vue')))
app.component('Header', Header)
app.component('Upload', Upload)
app.component('ContextMenu', ContextMenu)
app.component('LoadingList', LoadingList)
app.component('MonaCoEditor', MonaCoEditor)
app.directive('feathers', {
  mounted: (el, bind) => {
    // 判断是否有根元素，存在，则移除
    if (!import.meta.env.PROD) {
      nextTick(() => {
        const elRoot = document.querySelector("#_tooltip_root");
        const modifiers = bind.modifiers
        const value = bind.value
        if (modifiers.hide) {
          return
        }
        let content
        if (modifiers.gt) {
          content = '版本: > v' + value
        }
        else if (modifiers.gte) {
          content = '版本: >= v' + value
        }
        else if (modifiers.lt) {
          content = '版本: < v' + value
        } else if (modifiers.lte) {
          content = '版本: <= v' + value
        }

        if (elRoot) {
          elRoot.remove();
        }
        // 初始化 根元素
        el._tiproot = null;
        el._tipapp = null;
        const id = "_tooltip_root";
        const _tiproot = document.createElement("div");
        _tiproot.id = id;
        _tiproot.classList.add("_tiproot");
        // 通过createApp 创建实例组件
        const _tipapp = createApp(ElTooltip, {
          trigger: "hover",
          visible: true,
          virtualRef: el,
          rawContent: true,
          placement: "right",
          virtualTriggering: true,
          content,
        });
        el._tiproot = _tiproot;
        el._tipapp = _tipapp;
        // body添加根元素
        document.body.appendChild(_tiproot);
        // 将新组件挂载到根元素
        if (_tipapp && _tiproot) {
          el._tipapp.mount("#" + id);
        }
      })

    }

  }
})

app.mount('#app')
