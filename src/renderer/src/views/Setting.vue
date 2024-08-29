<script setup>
import { reactive, ref } from 'vue'

const onSubmit = () => {
}
</script>


<template>
  <Layout>
    <template #layout-main-inner>
      <Header>
        <template #title>
          <h4>设置</h4>
        </template>

        <template #option>
          <el-button size="small" class="option-btn" link>
            <i class="iconfont icon-setting"></i>
          </el-button>
        </template>
      </Header>
    </template>
  </Layout>
</template>


<style scoped>
h4 {
  padding: 0 10px;
  color: #333;
}
</style>