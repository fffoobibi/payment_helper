<script setup>
import { ref } from 'vue'
import Blank from '@/components/Blank.vue'
import PaymentAdd from './PaymentAdd.vue'
import PaymentRecord from './PaymentRecord.vue'
const props = defineProps({
  type: {
    type: String,
    default: 'pending'
  }
})
const showAddDrawer = ref(false)
const showRecordDrawer = ref(false)
import { useExcelStore } from "@/stores/index"
const ws = useExcelStore()
const emit = defineEmits(['openBatch'])

</script>


<template>
  <div class="wrapper">
    <Header>
      <template #title>
        <h4></h4>
      </template>

      <template #option>
        <el-tooltip content="批量打款" placement="bottom" hide-after="0" transition="none" :disabled="ws.excelLoading">
          <el-button link @click="emit('openBatch')" :loading="ws.excelLoading">
            <template #loading>
              <el-icon class="is-loading" :size="20" color="black">
                <Eleme />
              </el-icon>
            </template>
            <el-icon v-if="!ws.excelLoading" :size="20" class="iconfont icon-Excelxieru-xuanzhong">
            </el-icon>
          </el-button>
        </el-tooltip>
        <el-tooltip content="新增打款" placement="bottom" hide-after="0" transition="none" v-if="type === 'pending'">
          <el-button size="small" class="option-btn" @click="showAddDrawer = true" link>
            <i class="iconfont icon-edit"></i>
          </el-button>
        </el-tooltip>
        <el-tooltip content="打款记录" placement="bottom-end" hide-after="0" transition="none">
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