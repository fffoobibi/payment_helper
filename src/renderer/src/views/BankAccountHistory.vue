<script setup>
import { ref, watch, computed, reactive, onMounted } from "vue"
import api from "@/api"
import message from "@/utils/message"
import { useUserStore, useAccountStore } from "@/stores/index"
import { timestampToFormattedString, numberFmt, dateTimeFmt, subNumbers, maxText } from "@/utils/format"
import { useClient } from "@/utils/client"
import logger from "../utils/logger"
import { trim } from "lodash"
const { height, width } = useClient()
const store = useUserStore()
const bank = useAccountStore()

const vFocus = {
  mounted: (el) => el.querySelector('textarea')?.focus()
}

const props = defineProps({
  accountId: {
    type: [Number, String, null],
    required: true
  },
  currency: String
})
const queryFormRef = ref(null)
const queryForm = reactive({
  page: {
    currentPage: 1,
    pageSize: 100,
    totalCount: 0,
  },
  /**
   * 
   * {'account_id': 21, 'start_time': '', 'end_time': '', 'content': '', 'user_id': '139', 'rank': 'ASC', 'voucher_no': ''}
   * 
  */
  search: {
    account_id: props.accountId,
    date: '',    // 日期
    content: '',  // 凭证号
    rank: 'ASC',  // 倒叙，顺序
    voucher_no: '', // 编号
    page: 1,
    limit: 10,
  },
  tableData: [],
  hasSearch: false
})

const tableRef = ref(null)
const shortcuts = [
  {
    text: '近1周',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 7)
      return [start, end]
    },
  },
  {
    text: '近1月',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 30)
      return [start, end]
    },
  },
  {
    text: '近3月',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 90)
      return [start, end]
    },
  },
]
const tableHeight = computed(() => {
  const h = queryFormRef.value?.clientHeight || 0
  width.value + 1
  let th
  if (h > 60) {
    th = 234
  } else {
    th = 184
  }
  if (queryForm.page.totalCount == 0) {
    return height.value - th
  }
  return height.value - th
})

const processResponse = async (resp) => {
  const page = parseInt(resp.pages)
  const limit = parseInt(resp.limit)
  resp.list.forEach((v, index) => {
    v.INDEX = (page - 1) * limit + index
    v._vo_number = v.voucher_no
    v._vo_show = false
  })
  return resp
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
  if (post.date) {
    post.start_time = post.date[0]
    post.end_time = post.date[1]
  }
  delete post.date
  const data = await api.bank_account.getAccountHistoryList(post, processResponse)
  queryForm.tableData = data.list
  queryForm.page.totalCount = data.count
  queryForm.page.pageSize = data.limit
}

onMounted(() => {
  if (!queryForm.hasSearch) {
    onSearch(1, null)
    queryForm.hasSearch = true
  }
})


</script>

<template>
  <div style=" width:100%;height: 100%; padding: 10px;">
    <el-form inline :model="queryForm.search">
      <el-form-item>
        <el-input placeholder="钉钉编号/收支编号" clearable></el-input>
      </el-form-item>
      <el-form-item>
        <el-input placeholder="凭证号" clearable style="width:150px"></el-input>
      </el-form-item>
      <el-form-item>
        <el-date-picker style="width: 240px" v-model="queryForm.search.date" type="daterange" unlink-panels
          range-separator="-" value-format="YYYY-MM-DD 00:00:00" start-placeholder="开始" end-placeholder="结束"
          :shortcuts="shortcuts" />
      </el-form-item>
      <el-form-item>
        <el-select>
          <el-option label="顺序" value="1"></el-option>
          <el-option label="逆序" value="2"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type='primary' @click="onSearch(1, null)">
          查询
        </el-button>
      </el-form-item>
    </el-form>
    <el-table row-key="id" ref="tableRef" highlight-current-row :data="queryForm.tableData" :height="tableHeight"
      :row-class-name="renderTableRowClass" @cell-dblclick="(row, col) => {
      if (col.label == '凭证号') {
        row._vo_show = !row._vo_show
        console.log('row ', row._vo_show)
      }
    }" @row-contextmenu="(row, col, e) => {
      menuRef.pop(row)
    }">
      <template #empty>
        <el-empty :image-size="200" />
      </template>
      <el-table-column label="序号" width="60">
        <template #default="scope">
          <div>{{ scope.$index + 1 + (queryForm.page.currentPage - 1) * queryForm.page.pageSize }}</div>
        </template>
      </el-table-column>
      <el-table-column label="摘要信息">
        <template #default="{ row }">
          <div>编号：<span class="user-select">{{ row.sn }}</span></div>
          <div>时间：<span class="user-select">{{ timestampToFormattedString(row.create_time) }}</span>
            <div>创建：<span class="user-select">{{ row.creator + `(${row.department_name})` }}</span></div>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="创建">
        <template #default="{ row }">
          <div>类型：<span class="user-select">{{ row.type_name }}</span></div>
          <div>备注：<span class="user-select">{{ maxText(row.account_record_note?.trim()) }}</span></div>
          <div>打款备注：<span class="user-select">{{ maxText(row.account_voucher_ext_note?.trim()) }}</span>
          </div>

        </template>
      </el-table-column>
      <el-table-column label="金额">
        <template #default="{ row }">
          <div>初期：<span class="user-select">{{ numberFmt(row.beginning_balance) }}</span><span class="red">{{ " " +
      row.base_currency }}</span></div>
          <div>本期：<span class="user-select">{{ numberFmt(row.current_amount) }}</span><span class="red">{{ " " +
      row.base_currency
              }}</span></div>
          <div>期末：<span class="user-select">{{ numberFmt(row.ending_balance) }}</span><span class="red">{{ " " +
      row.base_currency
              }}</span></div>
        </template>
      </el-table-column>
      <el-table-column label="凭证号">
        <template #header>
          <el-tooltip effect="dark" content="双击编辑凭证号" placement="top">
            <el-space>
              凭证号<el-icon>
                <QuestionFilled />
              </el-icon>
            </el-space>
          </el-tooltip>
        </template>
        <template #default="{ row }">
          <span class="user-select" v-if="!row._vo_show">{{ row.voucher_no }}</span>
          <el-input v-if="row._vo_show" v-model="row._vo_number" v-focus clearable :rows="2" type="textarea"></el-input>
        </template>
      </el-table-column>

      <el-table-column label="操作">
        <template #default="{ row }">
          <el-button link type='primary'>凭证</el-button>
          <el-button link type="success">明细</el-button>
        </template>
      </el-table-column>

    </el-table>
    <el-pagination size="default" style="padding-top: 5px; position: fixed;bottom: 20px" :default-page-size="300"
      v-show="queryForm.page.totalCount > 0" v-model:current-page="queryForm.page.currentPage"
      v-model:page-size="queryForm.page.pageSize" background="true" :page-sizes="[10, 50, 100, 300]"
      layout="total, sizes, prev, pager, next, jumper" :total="queryForm.page.totalCount" />

  </div>
</template>

<style scoped>
.user-select {
  color: black;
  font-size: 10pt;
  user-select: text
}

.bold {
  font-weight: bold;
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

.audit {
  background-image: url('../assets/images/shenpi.svg');
  background-repeat: no-repeat;
  background-position: 90% 10%;
  background-size: 50px 50px;
}
</style>