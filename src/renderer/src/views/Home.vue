<script setup>
import { reactive, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore, useOperateRecords } from "@/stores/index"
import { useLocalConfig } from "@/stores/config"
import { onMounted } from 'vue';
const store = useUserStore()
const cfg = useLocalConfig()
const record = useOperateRecords()

const router = useRouter()

const menuItems = reactive([
  { display: '打款', icon: 'dingdingdingd', text: '钉钉打款', name: 'payment' },
  { display: '在途', icon: 'fund-intransit', text: '在途资金', name: 'fundInTransit' },
  { display: '转账', icon: 'payment', text: '银行转账', name: 'bankTransfer' },
  { display: '账户', icon: 'bank-transfer', text: '银行账户', name: 'bankAccount' },
  { display: '信用', icon: 'bank-account', text: '信用卡管理', name: 'creditCard' },
])

const optionItems = computed(() => {
  return [{ icon: 'setting', text: '设置', name: 'setting' }]
})

const switchAccount = () => {
  store.logOut()
  record.reset()
  router.push({ name: 'login' }).then(v=>{
    // window.location.reload()
  })
  electron.toLogin()
}

const currItem = ref(menuItems[0])

const onMenu = (item) => {
  currItem.value = item
  if (item.name == 'debug') {
  } else {
    router.push({ name: item.name })
  }
}


</script>


<template>
  <div class="win">
    <div class="sider">
      <el-popover placement="right-start" :title="store.user.username" :width="200" trigger="hover">
        <template #reference>
          <el-avatar :size="34" v-if="store.user.username">
            {{ store.user.username[0] }}
          </el-avatar>
        </template>
        <el-space direction="vertical">
          <el-button link type="primary" @click="switchAccount">切换账号</el-button>
        </el-space>
      </el-popover>

      <ul class="menu">
        <li :class="['menu-item', { active: item.name == currItem.name }]" v-for="item in menuItems" :key="item.name">
          <el-tooltip :content="item.text" :hide-after="0" effect="dark" transition="none" placement="right-start">
            <el-button @click="onMenu(item)" text>
              <div class="flex flex-col gap-3 flex-c-center">
                <el-icon :class="['iconfont', 'icon-' + item.icon]"></el-icon>
                <span class="menu-item-display b-600">{{ item.display }}</span>
              </div>
            </el-button>
          </el-tooltip>
        </li>
      </ul>

      <ul class="options">
        <li :class="['menu-item', { active: item.name == currItem.name }]" v-for="item in optionItems" :key="item.name">
          <el-tooltip :content="item.text" :hide-after="0" effect="dark" transition="none" placement="right-start">
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

.el-avatar {
  background: #5ba3ed;
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
  /* padding: 20px 0; */
  padding: 0px;
  padding-top: 20px;
  gap: 0px;
}

.menu-item {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  /* padding-top: 20px;
  padding-bottom: 20px; */
}

.menu-item-display {
  color: gray;
  font-size: 12px;
}

.menu-item.active .menu-item-display {
  color: #eee;
}

/* .menu-item.active{
  border-left: 2px solid #1d6dbd;
} */

.menu-item .el-button {
  /* width: 36px;
  height: 36px; */
  /* padding-left: 2px; */
  padding-top: 26px;
  padding-bottom: 26px;

  /* height: 50px; */
  /* border-radius: 10px; */
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