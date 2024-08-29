<script setup>
import { reactive, ref, watch } from 'vue'
import { useAccountStore, useUserStore } from "@/stores"
import { timestampToFormattedString } from "@/utils/format"
import api from "@/api"
import { computed } from 'vue';
const store = useUserStore()
const info = useAccountStore()

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
  }
})

const formState = reactive({
  getState: name => {
    const disabled = Object.keys(form.post)
    if (form.mode === "view") {
      switch (name) {
        case disabled.includes(name):
          return true
        default:
          return false
      }
    }
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


const viewTransfer = (row) => {
  formState.show = true
  formState.mode = 'view'
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
            <el-button type="primary" @click="() => {
          details.mode = 'add'
          details.show = true
        }">添加</el-button>
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
                <div style=" display: flex;flex-direction: column;width: 100%;">
                  <el-select v-model="form.post.out_account_id" filterable @change="handleBankChange"
                    :disabled="formState.getState('out_account_id')">
                    <el-option v-for="item in bank.accounts" :key="item.id" :label="item.account_name"
                      :value="item.id" />
                  </el-select>

                  <div style="display: flex;justify-content: flex-start;align-items: center">
                    <p><span style="color:black">实时余额 </span>
                      <span style="color:black">{{ form.available_balance }}</span>
                      <span style="color:red">{{ " " + form.currency }}</span>
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
                  <el-input v-model="form.post.origin_amount" :disabled="formState.getState('origin_amount')">
                    <template #suffix>
                      <p>{{ form.currency }}</p>
                    </template>
                  </el-input>
                  <p>
                    <span style="color:black">可用余额 {{ computedAvailableBalance }}</span>
                    <span style="color:red">{{ " " + form.currency }}</span>
                  </p>
                </div>

              </el-form-item>

              <el-form-item label="转入账户" prop="post.out_account_id" required>
                <div style=" display: flex;flex-direction: column;width: 100%;">
                  <el-select v-model="form.post.out_account_id" filterable @change="handleBankChange"
                    :disabled="formState.getState('out_account_id')">
                    <el-option v-for="item in bank.accounts" :key="item.id" :label="item.account_name"
                      :value="item.id" />
                  </el-select>

                  <div style="display: flex;justify-content: flex-start;align-items: center">
                    <p><span style="color:black">实时余额 </span>
                      <span style="color:black">{{ form.available_balance }}</span>
                      <span style="color:red">{{ " " + form.currency }}</span>
                    </p>
                  </div>
                </div>
              </el-form-item>

              <el-form-item label="到账收入科目" prop="post.out_account_title_id" required>
                <el-select v-model="form.post.out_account_title_id" filterable
                  :disabled="formState.getState('out_account_title_id')">
                  <el-option v-for="item in bank.payouts" :key="item.id" :label="item.name" :value="item.id" />
                </el-select>
              </el-form-item>

              <el-form-item label="到账金额" prop="post.received_amount" required>
                <div style=" display: flex;flex-direction: column;width: 100%;">
                  <el-input v-model="form.post.received_amount" :disabled="formState.getState('received_amount')">
                    <template #suffix>
                      <p>{{ form.currency }}</p>
                    </template>
                  </el-input>
                  <p>
                    <span style="color:black">可用余额 {{ computedAvailableBalance }}</span>
                    <span style="color:red">{{ " " + form.currency }}</span>
                  </p>
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
              <el-button @click="cancelClick">取消</el-button>
              <el-button v-show="formState.confirmButtonState" type="primary" @click="confirmClick">确认</el-button>
            </div>
          </template>
        </el-drawer>

        <!-- <el-dialog v-model="modifyNoteForm.show" title="备注修改" width="500" :before-close="handleClose">
          <el-input type="textarea" v-model="modifyNoteForm.post.note"></el-input>
          <template #footer>
            <div class="dialog-footer">
              <el-button @click="modifyNoteForm.show = false">关闭</el-button>
              <el-button type="primary" @click="submitNoteTransit">
                确认
              </el-button>
            </div>
          </template>
        </el-dialog> -->

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
</style>