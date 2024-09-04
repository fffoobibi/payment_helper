<script setup>
import { ref, watch, computed, reactive, onMounted } from "vue"
import api from "@/api"
import { useUserStore } from "@/stores/index"
import { timestampToFormattedString, numberFmt } from "@/utils/format"
import { useClient } from "@/utils/client"
const { height } = useClient()
const store = useUserStore()

const props = defineProps({
    accountId: {
        type: [Number, String, null],
        required: true
    }
})

const search = reactive({
    condition: 1,
    totalPage: null,
})

const listRef = ref(null)

const onSearch = async (page, limit) => {
    const resp = await api.incomeRecord.getIncomeRecords({
        page: page,
        limit: limit,
        user_id: store.user.id,
        condition: search.condition,
        account_id: props.accountId
    })
    return resp
}

const onFetchDone = ({ total }) => {
    search.totalPage = total
}

const stopLoad = (resp, current) => {
    if (resp.pages === null) {
        return false
    }
    if (resp.pages === 0) {
        return true
    }
    return current >= resp.pages
}

watch([() => props.accountId, () => search.condition], () => {
    listRef.value.reload()
})

</script>

<template>
    <div style="display:flex; width:100%;height: 100%;">
        <div class="left">
            <div
                style=" display: flex; justify-content: space-between;align-items: center; padding-right: 0px;margin-bottom: 10px;">
                <div>收入历史 <span class="display-result">({{ search.totalPage }}条记录)</span></div>
                <el-select style="width: 120px" v-model="search.condition">
                    <el-option label="今天" :value="1"></el-option>
                    <el-option label="昨天" :value="2"></el-option>
                    <el-option label="近7天" :value="3"></el-option>
                    <el-option label="本月" :value="4"></el-option>
                    <el-option label="上月" :value="5"></el-option>
                </el-select>
            </div>
            <LoadingList :fetch="onSearch" :stop-load="stopLoad" :height="height - 100" ref="listRef" @on-fetch-done="onFetchDone">
                <template #default="{ info }">
                    <div class="record-item">
                        <div> 收入编号： <span>{{ info.sn }} </span></div>
                        <div> 创建人： <span>{{ info.creator }}</span> 创建时间：{{ timestampToFormattedString(info.create_time)
                            }}
                        </div>
                        <div> 银行账号： <span>{{ info.voucher_ext_last?.account_name }}</span> </div>
                        <div>收入科目：<span>{{ info.account_title }}</span></div>
                        <div>金额：<span>{{ numberFmt(info?.payment_items[0]?.cny_amount) }}</span> {{
                    info?.payment_items[0]?.currency }}</div>
                        <div>备注：<span>{{ info?.payment_items[0]?.note }}</span></div>
                    </div>

                </template>

            </LoadingList>

        </div>
        <div class="right">

        </div>

    </div>
</template>

<style scoped>
.left {
    width: 320px;
    height: 100%;
}

.right {
    padding-left: 10px;
    height: 100%;
    flex: 1;
}

.display-result{
    font-size:10pt;
    color: gray;
}

.record-item {
    margin-bottom: 10px;
    background-color: white;
    padding: 10px;
    border-radius: 10px;
}

.record-item * {
    font-size: 9pt;
}

p, span {
    color: black;
    font-size: 10pt
}
div{
    color: black
}

</style>