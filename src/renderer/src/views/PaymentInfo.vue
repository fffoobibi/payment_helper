<script setup>
import { reactive, ref } from 'vue'

const props = defineProps({
  id: Number
})

const onSubmit = () => {
}
</script>


<template>
  <Header>
    <template #title>
      <h4>审批单信息</h4>
    </template>

    <template #option>
      <el-button size="small" class="option-btn" link>
        <i class="iconfont icon-setting"></i>
      </el-button>
    </template>
  </Header>

  <el-scrollbar class="info-box">
    <section class="infos">
      <div class="info"></div>
      <div class="info"></div>
    </section>
    <section class="table-box"></section>
  </el-scrollbar>
</template>


<style scoped>
.info-box {
  width: 100%;
  height: calc(100% - 66px);
  overflow-y: auto;
}
.infos,
.table-box {
  width: calc(100% - 24px);
}
.infos {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin: 12px 12px 0;
}
.info {
  flex: 1;
  min-width: 240px;
  height: 240px;
}

.info,
.table-box {
  background-color: #fff;
  border-radius: 6px;
  box-shadow: 0 2px 10px 0 #e8eeff;
  color: #353535;
}

.table-box {
  height: 400px;
  margin: 12px;
}
</style>