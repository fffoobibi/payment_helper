<script setup>
import { reactive, ref, watch } from 'vue'
import { useAccountStore, useUserStore } from "@/stores"
import { timestampToFormattedString } from "@/utils/format"
import api from "@/api"
import { computed } from 'vue'
import message from '../utils/message'
const store = useUserStore()
const bank = useAccountStore()

const queryForm = reactive({
  page: {
    currentPage: 1,
    pageSize: 10,
    totalCount: null,
  },
  search: {
    account_name: '',
    condition: '1',
    user_id: store.user.id,
    page: 1,
    limit: 10,
  },
  tableData: [],
})

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
  const data = await api.transfer.getList(queryForm.search)
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


//增删改查
/**
 * 
 * 
 * 
 *                 'user_id': current_data.id,
                'out_account_id': current_data.get_account_id(self.widget.comboBox_8.currentText()),
                'in_account_id': current_data.get_account_id(self.widget.comboBox_9.currentText()),
                'origin_amount': self.widget.lineEdit_11.text().strip().replace(',', ''),
                'currency': self.widget.comboBox.currentText(),
                'note': self.widget.textEdit_2.toPlainText(),
                'received_amount': self.widget.lineEdit.text().replace(',', ''),
                'received_currency': self.widget.comboBox_10.currentText(),
                'in_account_title_id': self.widget.comboBox_3.current_data(),
                'out_account_title_id': self.widget.comboBox_2.current_data(),
*/
const formRef = ref(null)
const form = reactive({
  available_balance: "",
  currency: "",
  mode: '',
  show: false,
  post: {
    user_id: store.user.id,
    out_account_id: null,
    in_account_id: null,
    origin_amount: null,
    currency: null,
    received_amount: null,
    received_currency: null,
    note: null,
    in_account_title_id: null,
    out_account_title_id: null,
    attachment_list: [],
  },
  noteShow: false,
  notePost: {
    note: '',
    user_id: store.user.id,
    voucher_ext_id: null
  }
})

const formState = reactive({
  in_account_id_loading: false,
  out_account_id_loading: false,
  in_account_id_color:'transparent',
  out_account_id_color:'transparent',
  in_account_id_balance: '',
  out_account_id_balance: '',
  in_account_id_currency: '',
  out_account_id_currency: '',
  available_balance: computed(()=>{
    const rs = parseFloat(formState.out_account_id_balance || '0') - parseFloat(form.post.origin_amount || '0')
    return rs
  }),
  available_color: computed(()=>{
    if (form.post.origin_amount){
      return "black"
    }return "transparent"
  }), 
  getState: name => {
    const disabled = Object.keys(form.post)
    if (form.mode === "view") {
      return true
    }return false
  },
  formTitle: computed(() => {
    if (form.mode == "add") {
      return "银行转账-添加"
    }
    else if (form.mode == "edit") {
      return "银行转账-编辑"
    }
    else if (form.mode == "view") {
      return "银行转账-查看"
    }
  })
})

watch(()=>form.post.in_account_id, async()=>{
  console.log('change ===>')
  if (form.post.in_account_id){
    formState.in_account_id_loading=true
    const resp = await api.getAccountDetail({user_id: store.user.id, account_id: form.post.in_account_id})
    formState.in_account_id_color = 'black'
    formState.in_account_id_loading=false
    formState.in_account_id_balance = resp.available_balance
    formState.in_account_id_currency = resp.currency
  }else{
    formState.in_account_id_color = 'transparent'
    formState.in_account_id_balance = ''
    formState.in_account_id_currency = ''
  }
})

watch(()=> form.post.out_account_id, async ()=>{
  if (form.post.out_account_id){
    formState.out_account_id_loading = true
    const resp = await api.getAccountDetail({user_id: store.user.id, account_id: form.post.out_account_id})
    formState.out_account_id_color = 'black'
    formState.out_account_id_loading = false
    formState.out_account_id_balance = resp.available_balance
    formState.out_account_id_currency = resp.currency
  }else{
    formState.out_account_id_color = 'transparent'
    formState.out_account_id_balance = ''
    formState.out_account_id_currency = ''
  }
})

const resetForm = ()=>{
  form.post = {
    out_account_id: null,
    in_account_id: null,
    origin_amount: null,
    currency: null,
    received_amount: null,
    received_currency: null,
    note: null,
    in_account_title_id: null,
    out_account_title_id: null,
    attachment_list: [],
  }
  formRef.value?.resetFields()
}
const handleCancel = ()=>{
  resetForm()
  form.mode='view'
  form.show=false
}

const addTransfer = ()=>{
  resetForm()
  form.mode='add'
  form.show=true
}
const viewTransfer =async (row) => {
  const data = await api.transfer.getDetail({user_id: store.user.id, id: row.id})
  form.post = {
    out_account_id: data.out_account_id,
    in_account_id: data.in_account_id,
    origin_amount: data.origin_amount,
    currency: data.currency,
    received_amount: data.received_amount,
    received_currency: data.received_currency,
    note: data.note,
    in_account_title_id: data.in_account_title_id,
    out_account_title_id: data.out_account_title_id,
    attachment_list: data.attachment_list.map(v => { return { url: v.path } }),
  }
  form.mode = 'view'
  form.show = true
}

const noteTransfer = async (row)=>{
console.log('ropw ', row);
form.notePost.note = row.note
form.notePost.voucher_ext_id = row.voucher_ext_id
form.noteShow=true
}
const submitNoteTransit =async ()=>{
  try{
    const resp = await api.transfer.modifyNote({user_id: store.user.id, note: form.notePost.note, voucher_ext_id: form.notePost.voucher_ext_id})
    form.noteShow=false
    message.success("备注已修改!")
  }catch(error){
    message.warning(error)
  }
}
</script>

<template>
  <Layout>
    <template #layout-main-inner>
      <Header>
        <template #title>
          <h4>银行转账</h4>
        </template>

        <template #option>
          <el-button size="small" class="option-btn" link>
            <i class="iconfont icon-setting"></i>
          </el-button>
        </template>
      </Header>

      <div class="pannel">
        <el-form :inline="true" :model="queryForm.search" class="demo-form-inline">
          <el-form-item label="银行账户">
            <el-input v-model="queryForm.search.account_name" placeholder="支持模糊查找" clearable />
          </el-form-item>
          <el-form-item label="日期">
            <el-select v-model="queryForm.search.condition" placeholder="">
              <el-option label="今天" value="1" />
              <el-option label="昨天" value="2" />
              <el-option label="近7天" value="3" />
              <el-option label="本月" value="4" />
              <el-option label="上月" value="5" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="onSearch(1, null)">查询</el-button>
            <el-button type="primary" @click="addTransfer">添加</el-button>
          </el-form-item>
        </el-form>

        <el-table :data="queryForm.tableData" style="height: calc(100vh - 210px)" stripe>
          <template #empty>
            <el-empty :image-size="200" />
          </template>
          <el-table-column label="序号" width="60">
            <template #default="scope">
              <div>{{ scope.$index + 1 + (queryForm.page.currentPage - 1) * queryForm.page.pageSize }}</div>
            </template>
          </el-table-column>
          <el-table-column label="摘要信息">
            <template #default="scope">
              <div>编号：{{ scope.row.transfer_number }}</div>
              <div>创建：{{ timestampToFormattedString(scope.row.create_time) }}</div>
              <div>创建人：{{ `${scope.row.creator}(${scope.row.department_name})` }}</div>
            </template>
          </el-table-column>
          <el-table-column label="银行信息">
            <template #default="scope">
              <div>转出：{{ scope.row.out_account_name }}</div>
              <div>转入：{{ scope.row.in_account_name }}</div>
              <div>金额：{{ `${scope.row.origin_amount} ${scope.row.currency}` }}</div>
            </template>
          </el-table-column>
          <el-table-column label="备注">
            <template #default="scope">
              <div>{{ scope.row.note }}</div>
            </template>
          </el-table-column>

          <el-table-column label="操作" width="160">
            <template #default="scope">
              <el-space class="row-bg">
                <el-button size="default" type="primary" @click="viewTransfer(scope.row)" link>
                  查看
                </el-button>
                <el-button size="default" type="primary" @click="editTransfer(scope.row)" link>
                  编辑
                </el-button>
                <el-button size="default" type="primary" @click="noteTransfer(scope.row)" link>
                  备注
                </el-button>
              </el-space>

            </template>
          </el-table-column>

        </el-table>
        <el-pagination size="default" style="padding-top: 5px;" v-model:current-page="queryForm.page.currentPage"
          v-model:page-size="queryForm.page.pageSize" background="true" :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper" :total="queryForm.page.totalCount" />

        <el-drawer v-model="form.show" :title="formState.formTitle" direction="rtl" size="50%" @closed="handleClose"
          ref="drawRef">
          <template #default>
            <el-form :model="form" label-width="auto" style="width:100%" ref="formRef" :rules="formRules">

              <el-form-item label="转出账户" prop="post.out_account_id" required>
                <div style=" display: flex;flex-direction: column;width: 100%;" v-loading="formState.out_account_id_loading">
                  <el-select v-model="form.post.out_account_id" filterable @change="handleBankChange"
                    :disabled="formState.getState('out_account_id')">
                    <el-option v-for="item in bank.accounts" :key="item.id" :label="item.account_name"
                      :value="item.id" />
                  </el-select>

                  <div style="display: flex;justify-content: flex-start;align-items: center">
                    <p><span :class="formState.out_account_id_color">实时余额 </span>
                      <span style="color:black">{{ formState.out_account_id_balance }}</span>
                      <span style="color:red">{{ " " + formState.out_account_id_currency }}</span>
                    </p>
                  </div>
                </div>
              </el-form-item>

              <el-form-item label="转账支出科目" prop="post.out_account_title_id" required>
                <el-select v-model="form.post.out_account_title_id" filterable
                  :disabled="formState.getState('out_account_title_id')">
                  <el-option v-for="item in bank.payouts" :key="item.id" :label="item.name" :value="item.id" />
                </el-select>
              </el-form-item>

              <el-form-item label="转出金额" prop="post.origin_amount" required>
                <div style=" display: flex;flex-direction: column;width: 100%;">
                  <el-input-number v-model="form.post.origin_amount" :disabled="formState.getState('origin_amount')" :precision="2" :controls="false">
                    <template #suffix>
                      <p>{{ form.currency }}</p>
                    </template>
                  </el-input-number>
                  <p>
                    <span :class="formState.available_color">可用余额 {{ computedAvailableBalance }}</span>
                    <span :class="formState.available_color">{{ " " + formState.available_balance }}</span>
                    <span :class="formState.available_color=='transparent' ? 'transparent': 'red'">{{ " " + formState.out_account_id_currency }}</span>
                  </p>
                </div>

              </el-form-item>

              <el-form-item label="转入账户" prop="post.in_account_id" required>
                <div style=" display: flex;flex-direction: column;width: 100%;" v-loading="formState.in_account_id_loading">
                  <el-select v-model="form.post.in_account_id" filterable @change="handleBankChange"
                    :disabled="formState.getState('in_account_id')">
                    <el-option v-for="item in bank.accounts" :key="item.id" :label="item.account_name"
                      :value="item.id" />
                  </el-select>

                  <div style="display: flex;justify-content: flex-start;align-items: center">
                    <p><span :class="formState.in_account_id_color">实时余额 </span>
                      <span style="color:black">{{ formState.in_account_id_balance }}</span>
                      <span style="color:red">{{ " " + formState.in_account_id_currency }}</span>
                    </p>
                  </div>
                </div>
              </el-form-item>

              <el-form-item label="到账收入科目" prop="post.in_account_title_id" required>
                <el-select v-model="form.post.in_account_title_id" filterable
                  :disabled="formState.getState('in_account_title_id')">
                  <el-option v-for="item in bank.incomes" :key="item.id" :label="item.name" :value="item.id" />
                </el-select>
              </el-form-item>

              <el-form-item label="到账金额" prop="post.received_amount" required>
                <div style=" display: flex;flex-direction: column;width: 100%;">
                  <el-input-number v-model="form.post.received_amount" :disabled="formState.getState('received_amount')" :precision="2" :controls="false" style="width: 100%">
                    <template #suffix>
                      <p>{{ form.currency }}</p>
                    </template>
                  </el-input-number>

                </div>

              </el-form-item>

              <el-form-item label="备注" prop="post.note">
                <el-input v-model="form.post.note" type="textarea" :rows="3" show-word-limit
                  :disabled="formState.getState('note')"></el-input>
              </el-form-item>

              <el-form-item label="图片上传" prop="post.attachment_list">
                <Upload action="upload" ref="uploadRef" v-model="form.post.attachment_list" :limit="10" dir="transfer"
                  :disabled="formState.getState('attachment_list')" @done="r => {
          console.log('rs', r)
        }"></Upload>

              </el-form-item>

            </el-form>
          </template>
          <template #footer>
            <div style="flex: auto">
              <el-button @click="handleCancel">取消</el-button>
              <el-button v-show="!formState.getState('button')" type="primary" @click="confirmClick">确认</el-button>
            </div>
          </template>
        </el-drawer>

        <el-dialog v-model="form.noteShow" title="备注修改" width="500" :before-close="handleClose">
          <el-input type="textarea" v-model="form.notePost.note"></el-input>
          <template #footer>
            <div class="dialog-footer">
              <el-button @click="form.noteShow = false">关闭</el-button>
              <el-button type="primary" @click="submitNoteTransit">
                确认
              </el-button>
            </div>
          </template>
        </el-dialog>

      </div>

    </template>
  </Layout>
</template>


<style scoped>
h4 {
  padding: 0 10px;
  color: #333;
  font-weight: bold;
}

.pannel {
  padding: 10px;
}

.demo-form-inline .el-input {
  --el-input-width: 220px;
}

.demo-form-inline .el-select {
  --el-select-width: 100px;
}

.option-add {
  padding-right: 10px;
}

.black {
  color: black
}
.transparent{
  color: transparent
}
.red{
  color:red
}
:deep(.el-input-number .el-input__inner){
  text-align: left;
}
</style>