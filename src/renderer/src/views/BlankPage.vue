<script setup>
import { ref, toRaw } from 'vue'
import Blank from '@/components/Blank.vue'
import PaymentAdd from './PaymentAdd.vue'
import PaymentRecord from './PaymentRecord.vue'
import { useUserStore } from '@/stores'
import { useLocalConfig } from '@/stores/config'

const showAddDrawer = ref(false)
const showRecordDrawer = ref(false)
const store = useUserStore()
const cfgStore = useLocalConfig()

const openExcel = () => {
  electron.openExcel(toRaw(store.user), toRaw(cfgStore.excelColors))
}
</script>


<template>
  <div class="wrapper">
    <Header>
      <template #title>
        <h4></h4>
      </template>

      <template #option>
        <el-tooltip content="批量打款" placement="bottom-end">
          <el-button size="small" class="option-btn" @click="openExcel" link>
            <i class="iconfont icon-Excel" :size="17"></i>
          </el-button>
        </el-tooltip>
        <el-tooltip content="新增打款" placement="bottom-end">
          <el-button size="small" class="option-btn" @click="showAddDrawer = true" link>
            <i class="iconfont icon-edit"></i>
          </el-button>
        </el-tooltip>
        <el-tooltip content="打款记录" placement="bottom-end">
          <el-button size="small" class="option-btn" @click="showRecordDrawer = true" link>
            <i class="iconfont icon-history-record"></i>
          </el-button>
        </el-tooltip>
      </template>
    </Header>

    <Blank class="empty-page" />

    <!-- 新增打款抽屉 -->
    <el-drawer v-model="showAddDrawer" title="新增打款" direction="rtl" size="600" destroy-on-close>
      <PaymentAdd @close="showAddDrawer = false" />
    </el-drawer>

    <!-- 打款记录抽屉 -->
    <el-drawer v-model="showRecordDrawer" title="打款记录" direction="rtl" size="600" class="records" destroy-on-close>
      <PaymentRecord />
    </el-drawer>
  </div>
</template>


<style scoped>
.wrapper {
  height: 100%;
}

header {
  display: flex;
  width: 100%;
  height: 36px;
  padding: 0 0 0 10px;
  background-color: #fffc;
  border-bottom: 1px solid #eee;
}

.header-title {
  flex: 1;
}

.empty-page {
  height: calc(100% - 30px);
}
</style>