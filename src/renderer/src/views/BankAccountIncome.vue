<script setup>
import { ref, watch, computed, reactive, onMounted } from "vue"
import api from "@/api"
import { useUserStore } from "@/stores/index"
import { timestampToFormattedString, numberFmt } from "@/utils/format"
import { useClient } from "@/utils/client"
const { height, width } = useClient()
const store = useUserStore()

const props = defineProps({
    accountId: {
        type: [Number, String, null],
        required: true
    }
})

const search = reactive({
    condition: 5,
    page: 1,
    limit: 10,
    totalPage: null,
    resp: [],
})


const hasDown = computed(() => {
    console.log('had down');
    if (search.totalPage === null) {
        return false
    }
    if (search.totalPage === 0) {
        return true
    }
    return search.page >= search.totalPage
})

const reset = () => {
    search.totalPage = null
    search.page = 1
    search.limit = 10
    disabled.value = false
    search.resp = []
}

const onSearch = async () => {
    const resp = await api.incomeRecord.getIncomeRecords({
        page: search.page,
        limit: search.limit,
        user_id: store.user.id,
        condition: search.condition,
        account_id: props.accountId
    })

    search.totalPage = resp.pages
    search.limit = resp.limit
    search.page++
    search.resp = resp.list
}
const renderValues = computed(() => {
    props.accountId
    return search.resp
})

const disabled = ref(false);
const load = async () => {
    if (disabled.value) {
        console.log('Loading is disabled.');
        return;
    }
    console.log('loading data ', disabled.value);
    const resp = await api.incomeRecord.getIncomeRecords({
        page: search.page,
        limit: search.limit,
        user_id: store.user.id,
        condition: search.condition,
        account_id: props.accountId
    });
    search.totalPage = resp.pages;
    search.limit = resp.limit;
    search.page++;
    search.resp = [...search.resp, ...resp.list]; // 确保数据是追加的，而不是替换
    if (hasDown.value) {
        disabled.value = true;
        console.log('stop load ', search, disabled.value);
    }
}

watch(() => props.accountId, () => {
    reset()
    console.log('reset', props.accountId, disabled.value);
    onSearch()
})

</script>

<template>
    <div style="display:flex; width:100%;height: 100%;">
        <div class="left">
            <div
                style=" display: flex; justify-content: space-between;align-items: center; padding-right: 0px;margin-bottom: 10px;">
                <div>收入历史列表</div>
                <el-select style="width: 120px" v-model="search.condition">
                    <el-option label="今天" :value="1"></el-option>
                    <el-option label="昨天" :value="2"></el-option>
                    <el-option label="近7天" :value="3"></el-option>
                    <el-option label="本月" :value="4"></el-option>
                    <el-option label="上月" :value="5"></el-option>
                </el-select>
            </div>
                <ul class="records" v-infinite-scroll="load" :infinite-scroll-disabled="disabled" style="overflow: auto">
                    <li v-for="info in renderValues" :key="info.id" class="record-item">
                        <div> 收入编号： <span>{{ info.sn }}</span></div>
                        <div> 创建人： <span>{{ info.creator }}</span> 创建时间：{{ timestampToFormattedString(info.create_time)
                            }}
                        </div>
                        <div> 银行账号： <span>{{ info.voucher_ext_last.account_name }}</span> </div>
                        <div>收入科目：<span>{{ info.account_title }}</span></div>
                        <div>金额：<span>{{ numberFmt(info.payment_items[0]?.cny_amount) }}</span> {{
                    info.payment_items[0]?.currency }}</div>
                        <div>备注：<span>{{ info.payment_items[0]?.note }}</span></div>
                    </li>
                </ul>

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
    /* background-color: red; */
    flex: 1;
}

.records {
    height: v-bind("height-100");
  padding: 0;
  margin: 0;
  list-style: none;
}

.record-item {
    margin-bottom: 10px;
    background-color: white;
    padding: 10px;
    border-radius: 10px;
}

p,
span,
.records div {
    color: black;
    font-size: 10pt
}

div {
    color: black
}
</style>