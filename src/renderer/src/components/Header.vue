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


<style>
header {
  display: flex;
  width: 100%;
  height: 36px;
  padding: 0 0 0 10px;
  background-color: #fff;
  border-bottom: 1px solid #eee;
}

.header-title {
  flex: 1;
}

.header-title h4 {
  line-height: 30px;
  color: #353535;
  font-size: 15px;
}

.option-btn {
  width: 45px;
  height: 30px;
  margin: 0 !important;
}
.option-btn i {
  font-size: 1.75em;
}
</style>