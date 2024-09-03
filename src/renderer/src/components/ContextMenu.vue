<template>
  <div ref="menuRef" v-if="showMenu" :style="{ left: x + 'px', top: y + 'px' }" class="right-click-menu">
    <ul>
      <li v-for="(item, index) in menuItems" :key="index" @click="handleMenuItemClick(item)">
        <div style="display: flex; justify-content: space-between;">

          <span>{{ item.label }} </span>
          <span v-if="item.children">
            <el-icon color="gray" size="small">
              <ArrowRight />
            </el-icon>
          </span>
        </div>

        <template v-if="item.children && item.children.length > 0">
          <ul class="sub-menu" :style="{ left: `${x.value + 150}px`, top: `${y.value}px` }">
            <li v-for="(subItem, subIndex) in item.children" :key="'sub-' + subIndex"
              @click="handleMenuItemClick(subItem)">
              {{ subItem.label }}
            </li>
          </ul>
        </template>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  menuItems: Array

})
// 状态管理
const showMenu = ref(props.show);
const x = ref(0);
const y = ref(0);
const menuRef = ref(null);
const menuItems = ref(props.menuItems)


// 监听右键点击事件
function handleContextMenu(event) {
  event.preventDefault();
  x.value = event.clientX;
  y.value = event.clientY;
  showMenu.value = true;
}

// 隐藏菜单
function hideMenu() {
  showMenu.value = false;
}

// 处理菜单项点击
function handleMenuItemClick(item) {
  console.log(`Clicked item: ${item.label}`);
  hideMenu();
}

// 添加和移除事件监听器
onMounted(() => {
  document.addEventListener('contextmenu', handleContextMenu);
  document.addEventListener('click', hideMenu);
});

onUnmounted(() => {
  document.removeEventListener('contextmenu', handleContextMenu);
  document.removeEventListener('click', hideMenu);
});
</script>

<style scoped>
.right-click-menu {
  padding: 0px;
  margin: 0px;
  position: fixed;
  background-color: white;
  border: 1px solid #ccc;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  list-style: none;
  padding: 0px;
  z-index: 1000;
  color: black
}

.right-click-menu ul {
  margin: 0;
  padding: 0;
}

.right-click-menu li {
  padding: 5px 10px;
  cursor: pointer;
}

.right-click-menu li:hover {
  background-color: #f0f0f0;
}

.sub-menu {
  display: none;
  position: absolute;
  top: 0;
  left: 100%;
  margin-top: -10px;
  background-color: white;
  border: 1px solid #ccc;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  list-style: none;
  padding: 10px;
  z-index: 1000;
  width: 120px;
}

.right-click-menu li:hover .sub-menu {
  display: block;
}

.right-click-menu li:active .sub-menu {
  display: block;
}
</style>