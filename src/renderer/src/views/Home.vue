<script setup>
import { reactive, ref } from 'vue'

import avatar from '@/assets/images/avatar-1.png?asset'
import { useRouter } from 'vue-router'
import { useUserStore } from "@/stores/index"
const store = useUserStore()
const router = useRouter()
const menuItems = reactive([
  { icon: 'dingdingdingd', text: '钉钉打款', name: 'payment' },
  { icon: 'fund-intransit', text: '在途资金', name: 'fundInTransit' },
  { icon: 'payment', text: '银行转账', name: 'bankTransfer' },
  { icon: 'bank-transfer', text: '银行账户', name: 'bankAccount' },
  { icon: 'bank-account', text: '信用卡管理', name: 'creditCard' },
])

const optionItems = reactive([
  { icon: 'jietu', text: '截图', name: 'jietu' },
  { icon: 'setting', text: '设置', name: 'setting' }
])

const currItem = ref(menuItems[0])

const onMenu = (item) => {
  currItem.value = item
  if (item.name == 'jietu') {
    // 调用electron的截图功能
    // window.electron.ipcRenderer.send('jietu')
  } else {
    router.push({ name: item.name })
  }
}

</script>


<template>
  <div class="win">
    <div class="sider">
      <el-popover placement="right-start" :title="store.user.username" :width="200" trigger="hover"
        content="您好">
        <template #reference>
          <div class="avatar">
            <img :src="avatar" alt="">
            </img>
          </div>
        </template>
      </el-popover>

      <ul class="menu">
        <li :class="['menu-item', { active: item.name == currItem.name }]" v-for="item in menuItems">
          <el-tooltip :content="item.text" hide-after="0" effect="dark" transition="none" placement="right-start">
            <el-button @click="onMenu(item)" text>
              <el-icon :class="['iconfont', 'icon-' + item.icon]"></el-icon>
            </el-button>
          </el-tooltip>
        </li>
      </ul>

      <ul class="options">
        <li :class="['menu-item', { active: item.name == currItem.name }]" v-for="item in optionItems">
          <el-tooltip :content="item.text" hide-after="0" effect="dark" transition="none" placement="right-start">
            <el-button @click="onMenu(item)" text>
              <el-icon :class="['iconfont', 'icon-' + item.icon]"></el-icon>
            </el-button>
          </el-tooltip>
        </li>
      </ul>
    </div>

    <div class="main">
      <RouterView v-slot="{ Component }">
        <keep-alive>
          <component :is="Component" />
        </keep-alive>
      </RouterView>
    </div>
  </div>
</template>


<style scoped>
.win {
  display: flex;
  align-items: flex-start;
  width: 100vw;
  height: 100%;
  border-radius: 8px;
  background-color: #f5f6f9;
}

/* =============== sider =============== */
.sider {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 50px;
  height: 100%;
  padding: 27px 0 20px;
  background-color: #2e3238;
}

.avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  overflow: hidden;
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.menu,
.options {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  width: 100%;
  margin: 0;
}

.menu {
  flex: 1;
  padding: 20px 0;
}

.menu-item {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
}

.menu-item .el-button {
  width: 36px;
  height: 36px;
  border-radius: 10px;
}

.menu-item.active .el-button,
.el-button.is-text:not(.is-disabled):hover {
  background-color: #ffffff30;
}

.el-button.is-text :deep(.el-icon) {
  font-size: 1.7em;
  color: #aaa;
}

.menu-item.active .el-button :deep(.el-icon) {
  color: #eee;
}

.options {
  padding: 0;
}

/* =============== main =============== */
.main {
  flex: 1;
  height: 100%;
  border: 1px solid #e0e0e0;
  border-left: 0;
  border-radius: 0 8px 8px 0;
  overflow: hidden;
}
</style>