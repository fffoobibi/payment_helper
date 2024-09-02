<script setup>
</script>


<template>
  <header>
    <div class="header-title">
      <slot name="title">
        <h4>页面标题</h4>
      </slot>
    </div>

    <slot name="option">
      <!-- 插槽示例 -->
      <!-- <el-button size="small" class="option-btn" link>
        <i class="iconfont icon-setting"></i>
      </el-button> -->
    </slot>
  </header>
</template>


<style scoped>
header {
  display: flex;
  width: 100%;
  height: 36px;
  padding: 0 0 0 10px;
  background-color: #fff;
  border-bottom: 1px solid #eee;
}
</style>