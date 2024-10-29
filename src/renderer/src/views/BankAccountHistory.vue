<script setup>
import { ref, watch, computed, reactive, onMounted } from "vue"
import api from "@/api"
import message from "@/utils/message"
import notification from "@/utils/notification"
import { timestampToFormattedString, numberFmt, maxText, addNumbers, formatDate } from "@/utils/format"
import { useClient } from "@/utils/client"
import {setUpExportToExcel} from "@/utils/tools"
import logger from "../utils/logger"
import { viewImages } from "../utils/tools"
import { useLocalConfig } from "../stores/config"
const { height, width } = useClient()

const shortcuts = [
  {
    text: '1周前',
    value: () => {
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 7)
      return start
    },
  },
  {
    text: '1月前',
    value: () => {
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 30)
      return start
    },
  },
  {
    text: '3月前',
    value: () => {
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 90)
      return start
    },
  },
]

const startTime = defineModel('startTime', {default: ''})
const endTime = defineModel('endTime', {default:''})
const emit = defineEmits('update:timeOrder')

const cfg = useLocalConfig()
const tableFields = computed(()=>{
  return cfg.histories
})

const tableFieldsInfo = computed(()=>{
  const rs = {}
  cfg.histories.forEach((v)=>{
    rs[v.label] = v.value
  })
  return rs
})

const vFocus = {
  mounted: (el) => el.querySelector('textarea')?.focus()
}

const props = defineProps({
  accountId: {
    type: [Number, String, null],
    required: true
  },
  currency: String,
  available: Boolean,
  typeName: String,
  balance:Number,
  timeOrder: String
})

const queryFormRef = ref(null)
const queryForm = reactive({
  page: {
    currentPage: 1,
    pageSize: 50,
    totalCount: 0,
  },
  search: {
    account_id: props.accountId,
    // start_time: formatDate( shortcuts[1].value(), {start: true}),
    // end_time: formatDate(new Date, {end: true}),
    content: '',  // 凭证号
    rank:  props.timeOrder ==='ascending' ? 'ASC': 'DESC',  // 倒叙，顺序 ASC DESC
    voucher_no: '', // 编号
    page: 1,
    limit: 10,
  },
  tableData: [],
  hasSearch: false
})

watch(()=>props.timeOrder, ()=>{
  if(props.timeOrder ==='ascending'){
    queryForm.search.rank = 'ASC'
  }else{
    queryForm.search.rank = 'DESC'
  }
}, {deep: true})

const currentPageIndex = computed(()=>{
  return queryForm.page.currentPage * queryForm.page.pageSize
})

const tableRef = ref(null)

const tableHeight = computed(() => {
  const el = queryFormRef.value?.$el
  const h = el?.clientHeight || 0
  width.value + 1
  let th
  if (h > 60) {
    th = 234
  } else {
    th = 184
    th = 214
  }
  if (queryForm.page.totalCount == 0) {
    return height.value - th
  }
  return height.value - th
})

const processResponse = async (resp) => {
  const page = parseInt(queryForm.page.currentPage)
  const limit = parseInt(resp.limit)
  resp.list.forEach((v, index) => {
    v.INDEX = (page - 1) * limit + index
    v._vo_number = v.voucher_no
    v._vo_show = false
    v._vo_loading = false
    v._vo_total = v.payment_items.reduce((x, y) => {
      return { cny_amount: addNumbers(x.cny_amount, y.cny_amount) }
    }, { cny_amount: '0' }).cny_amount
  })
  return resp
}

const saveAsExcel = setUpExportToExcel(()=>{
  exportLoading.value=false
})

const exportData = async ()=>{
  try{
    exportLoading.value=true
    const post = { ...queryForm.search }
    post.rank = queryForm.search.rank
    // if (post.date) {
      if(startTime.value){
        post.start_time = startTime.value
        if(endTime.value){
          post.end_time = endTime.value
        }else{
          post.end_time = formatDate(new Date, {end: true})
        }
      }
      
      
    // }
    delete post.page
    delete post.limit
    delete post.date
    const resp = await api.bank_account.exportAccountRecordHistoryList(post)
    const data = resp.list.map(v=>{
        return {
          '银行账户名称': v.account_name,
          '钉钉编号/收支编号': v.sn,
          '时间': timestampToFormattedString(v.create_time),
          '姓名/部门': v.creator+ `(${v.department_name})`,
          '类型': v.type_name,
          '期初金额': v.beginning_balance,
          '期初币种': v.base_currency,
          '本期金额': v.current_amount,
          '本期币种': v.base_currency,
          '本期原始金额': v.origin_amount,
          '本期原始币种': v.origin_currency,
          '期末金额': v.ending_balance,
          '期末币种': v.base_currency,
          '备注': v.account_record_note,
          '凭证号':v.voucher_no
        }
    })
    saveAsExcel(data, '银行账户历史记录' + timestampToFormattedString(Date.now()/1000, true) + '.xlsx')

  }catch(err){
    console.log(err)
    exportLoading.value=false
    notification.warning('导出EXCEL失败')
  }
}
const onSearch = async (page = null, pageSize = null) => {
  if (page != null) {
    queryForm.search.page = page
    queryForm.page.currentPage = page
  } else {
    queryForm.search.page = queryForm.page.currentPage
  }
  if (pageSize != null) {
    queryForm.search.limit = pageSize
  } else {
    queryForm.search.limit = queryForm.page.pageSize
  }
  
  const post = { ...queryForm.search }
  post.rank = queryForm.search.rank

  post.start_time = startTime.value
  post.end_time = endTime.value
  delete post.date
  const data = await api.bank_account.getAccountHistoryList(post, processResponse)
  queryForm.tableData = data.list
  queryForm.page.totalCount = data.count
  queryForm.page.pageSize = data.limit
}
watch(() => queryForm.page.currentPage, async () => {
  await onSearch()
})

watch(() => queryForm.page.pageSize, async () => {
  queryForm.page.currentPage = 1
  await onSearch(1, null)
})

const exportLoading = ref(false)

const editVoucherNo = async(row)=>{
  try{
    row._vo_loading = true
    const data = {account_record_id: row.id, voucher_no: row._vo_number, log_text: '历史凭证号'}
    await api.bank_account.editVoucherNo(data)
    row.voucher_no = row._vo_number
    row._vo_loading = false
    row._vo_show=false
    message.success("凭证号已修改!")
    if(row.INDEX + 1 < currentPageIndex.value){
      const nextRow = queryForm.tableData[(row.INDEX + 1) % queryForm.page.pageSize]
      nextRow._vo_show=true
      tableRef.value.setCurrentRow(nextRow)
    }
  }catch(err){
    logger.error('修改凭证号失败', err)
    row._vo_loading=false
  }
}
onMounted(() => {
  if (!queryForm.hasSearch) {
    onSearch(1, null)
    queryForm.hasSearch = true
  }
})


</script>

<template>
  <div style=" width:100%; height: 100%; padding: 10px;">
    <el-form inline :model="queryForm.search" ref="queryFormRef">
      <el-form-item>
        <el-input placeholder="钉钉编号/收支编号" clearable  style="width:200px" v-model.trim="queryForm.search.content"></el-input>
      </el-form-item>
      <el-form-item>
        <el-input placeholder="凭证号" clearable style="width:150px" v-model.trim="queryForm.search.voucher_no"></el-input>
      </el-form-item>
      <el-form-item>
        <el-date-picker style="width: 110px;margin-right:5px" v-model="startTime" type="date" 
          value-format="YYYY-MM-DD 00:00:00"
          format="YY/MM/DD"
          placeholder="开始" 
          :shortcuts="shortcuts" 
          />
        <el-date-picker style="width: 110px" v-model="endTime" type="date" 
          value-format="YYYY-MM-DD 23:59:59"
          format="YY/MM/DD"
          placeholder="结束"
          :shortcuts="shortcuts" 
          />
      </el-form-item>
      <el-form-item>
        <el-button type='primary' @click="onSearch(1, null)">
          查询
        </el-button>
        <el-button type='success'  @click="exportData" :loading="exportLoading">
        导出
        </el-button>
      </el-form-item>
    </el-form>
    <div style="margin-bottom: 5px; display: flex;width: 100%; gap: 10px;justify-content: space-between " >
      <el-space >
        <el-tag type="text" :disable-transitions="true" color="#9BA9E6">{{props.typeName}}</el-tag>
        <el-tag type="text" :color="props.available ? '#6DBEAD': 'red'" :disable-transitions="true">{{props.available ? '可用': '不可用'}}</el-tag>
        <el-tag type="text" color="transparent">
          <span class="black">总金额: {{ numberFmt(props.balance) }}</span>
          <span class="black bold">{{ " " + props.currency }}</span>
        </el-tag>
      </el-space>
      <el-dropdown :hide-on-click="false">
        <el-button size="small">
        查看列<el-icon class="el-icon--right"><arrow-down /></el-icon>
        </el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item v-for=" (item, index) in tableFields" :key="index">
              <el-checkbox :checked="item.value" @change="(v)=>{
                  cfg.histories[index] = {label: item.label, value: v}
                  cfg.updateHistories()
              }" >
                {{ item.label }}
              </el-checkbox>
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>

    <el-table row-key="id" ref="tableRef" highlight-current-row :data="queryForm.tableData" :height="tableHeight"
      :row-class-name="renderTableRowClass" 
      :default-sort="{ prop: 'create_time', order: props.timeOrder }"
      @sort-change="(d)=>{
        if(d.order =='ascending'){
          // timeOrder = 'ASC'
          emit('update:timeOrder','ascending')
          queryForm.search.rank = 'ASC'
        }else if (d.order=='descending'){
          // timeOrder = 'DESC'
          emit('update:timeOrder', 'descending')
          queryForm.search.rank = 'DESC'
        }
        onSearch(1, null)
      }"
      @cell-dblclick="(row, col) => {
      if (col.label == '凭证号') {
        row._vo_show = !row._vo_show
        console.log('row ', row._vo_show)
      }
    }">
      <template #empty>
        <el-empty :image-size="200" />
      </template>
      <el-table-column label="#" width="50" v-if="tableFieldsInfo['#']" class-name="cell-select">
        <template #default="scope">
          <div>{{ scope.$index + 1 + (queryForm.page.currentPage - 1) * queryForm.page.pageSize }}</div>
        </template>
      </el-table-column>
      <el-table-column label='编号' prop="sn" class-name="cell-select" v-if="tableFieldsInfo['编号']" ></el-table-column>
      <el-table-column label='时间' prop="create_time" class-name="cell-select" sortable="custom" :sort-orders="['ascending', 'descending']" v-if="tableFieldsInfo['时间']">
        <template #default="{row}">
          <span class="user-select">{{ timestampToFormattedString(row.create_time) }}</span>
        </template>
      </el-table-column>
      <el-table-column label='类型' prop="type_name" class-name="cell-select" v-if="tableFieldsInfo['类型']"></el-table-column>

      <el-table-column label="初期"  v-if="tableFieldsInfo['初期']"  class-name="cell-select" >
        <template #default="{ row }">
          <div class="flex gap-2">
            <div class="user-select">{{ numberFmt(row.beginning_balance) }}</div>
            <div class="red">{{ " " + row.base_currency }}</div>
          </div>
         
        </template>
      </el-table-column>

      <el-table-column label="本期"  v-if="tableFieldsInfo['本期']"  class-name="cell-select" >
        <template #default="{ row }">
          <div class="flex gap-2">
            <div class="user-select">{{ numberFmt(row.current_amount) }}</div>
            <div class="red">{{ " " + row.base_currency }}</div>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="期末"  v-if="tableFieldsInfo['期末']"  class-name="cell-select" >
        <template #default="{ row }">
          <div class="flex gap-2">
            <div class="user-select">{{ numberFmt(row.ending_balance) }}</div>
            <div class="red">{{ " " + row.base_currency }}</div>
          </div>
        </template>
      </el-table-column>
      <el-table-column label='备注' prop="account_record_note" class-name="cell-select" v-if="tableFieldsInfo['备注']"></el-table-column>
      <el-table-column label='打款备注' prop="account_voucher_ext_note" class-name="cell-select" v-if="tableFieldsInfo['打款备注']"></el-table-column>

      <el-table-column label="操作" width="140" v-if="tableFieldsInfo['操作']" class-name="cell-select">
        <template #default="{ row }">
          <el-space>

          <el-button link type='primary' v-if="row.attachment_list?.length" @click="()=>{
            viewImages(row.attachment_list.map(v=>v.path), 0)
          }">凭证[{{ row.attachment_list.length }}]</el-button>
          <el-popover
            v-if="row.payment_items.length"
            :transition="none"
            :hide-after="0"
            :width="330"
            title="明细"
            trigger="click"
            >
              <template #reference>
                <el-button link type="success" >明细[{{ row.payment_items.length }}]</el-button>
              </template>
              <el-scrollbar :max-height="300" :height="250">
                <div style="border-bottom:1px solid lightgray;margin-bottom: 4px; padding-bottom: 4px;">
                  <p>合计： <span> {{ numberFmt(row._vo_total)}} </span><span class="red">{{ " " + row.payment_items[0].currency }}</span></p>
                </div>
                <div v-for="item in row.payment_items" :key="item.item_id" style="padding-bottom: 4px; border-bottom:1px solid lightgray; margin-bottom: 4px;">
                  <p><span class="black">{{ item.account_title_parent }} - {{ item.account_title }}:</span> <span class="user-select">{{ numberFmt(item.cny_amount) }}</span><span class="red user-select">{{ " " + item.currency }}</span></p>
                  <p><span class="black">备注:</span> <span class="user-select" style="white-space: pre-wrap;">{{item.note}}</span></p>
                </div>
              </el-scrollbar>

            </el-popover>
          </el-space>

        </template>
      </el-table-column>

      <el-table-column label="凭证号" v-if="tableFieldsInfo['凭证号']" class-name="cell-select">
        <template #header>
          <el-tooltip effect="dark"  placement="right">
            <template #content>
            <p>双击编辑凭证号</p>
            <p>回车提交凭证号</p>
            </template>
            <el-space>
              凭证号<el-icon>
                <QuestionFilled />
              </el-icon>
            </el-space>
          </el-tooltip>
        </template>
        <template #default="{ row }">
          <span class="user-select" v-if="!row._vo_show">{{ row.voucher_no }}</span>
          <el-input v-if="row._vo_show" v-model.trim="row._vo_number" v-loading="row._vo_loading" v-focus clearable :rows="2" type="textarea" @keyup.enter="async()=>{
            await editVoucherNo(row)
          }" @keyup.esc="()=>{
            row._vo_show = !row._vo_show
            row._vo_number = row.voucher_no
          }"></el-input>
        </template>
      </el-table-column>

  

    </el-table>
    <el-pagination size="default" style="padding-top: 5px; position: fixed;bottom: 20px" :default-page-size="50"
      v-show="queryForm.page.totalCount > 0" v-model:current-page="queryForm.page.currentPage"
      v-model:page-size="queryForm.page.pageSize" background="true" :page-sizes="[10, 50, 100, 300]"
      layout="total, sizes, prev, pager, next, jumper" :total="queryForm.page.totalCount" />

  </div>
</template>

<style scoped>


.user-select {
  color: black;
  /* font-size: 10pt; */
  user-select: text
}
:deep(.el-table__row .cell-select .cell){
  color: black;
  /* font-size: 10pt; */
  user-select: text
}

.bold {
  font-weight: 600;
}

.black {
  color: black
}

.transparent {
  color: transparent
}

.red {
  color: red
}

.gray {
  color: gray
}
.white{
  color: #fff
}

.audit {
  background-image: url('../assets/images/shenpi.svg');
  background-repeat: no-repeat;
  background-position: 90% 10%;
  background-size: 50px 50px;
}
</style>