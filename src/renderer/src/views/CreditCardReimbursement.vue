<script setup>
import { reactive } from "vue"
import { useClient } from "../utils/client";
const { height } = useClient()
const queryForm = reactive({
    search: {
        start_time: "",
        end_time: ""
    },
    page: {
        currentPage: 1,
        pageSize: 10,
        totalCount: 0,
    },
})

const shortcuts = [
    {
        text: '1周前',
        value: () => {
            const end = new Date()
            const start = new Date()
            start.setTime(start.getTime() - 3600 * 1000 * 24 * 7)
            return start
        },
    },
    {
        text: '1月前',
        value: () => {
            const end = new Date()
            const start = new Date()
            start.setTime(start.getTime() - 3600 * 1000 * 24 * 30)
            return start
        },
    },
    {
        text: '3月前',
        value: () => {
            const end = new Date()
            const start = new Date()
            start.setTime(start.getTime() - 3600 * 1000 * 24 * 90)
            return start
        },
    },
]

</script>

<template>
    <div class="pannel">
        <el-form inline>
            <el-form-item>
                <el-date-picker style="width: 130px;margin-right:5px" v-model="queryForm.search.start_time" type="date"
                    value-format="YYYY-MM-DD 00:00:00" format="YY/MM/DD" placeholder="开始" :shortcuts="shortcuts" />
                <el-date-picker style="width: 130px" v-model="queryForm.search.end_time" type="date"
                    value-format="YYYY-MM-DD 23:59:59" format="YY/MM/DD" placeholder="结束" :shortcuts="shortcuts" />
            </el-form-item>

            <el-form-item>
                <el-button type="primary">查询</el-button>
                <el-button type="danger">报销</el-button>
            </el-form-item>
        </el-form>
        <el-table :height="height - 180">
            <template #empty>
                <el-empty :image-size="200" />
            </template>
        </el-table>
        <el-pagination size="default" style="padding-top: 5px; position: fixed; bottom: 20px" :default-page-size="10"
            v-show="queryForm.page.totalCount > 0" v-model:current-page="queryForm.page.currentPage"
            v-model:page-size="queryForm.page.pageSize" background="true" :page-sizes="[10, 50, 100, 300]"
            layout="total, sizes, prev, pager, next, jumper" :total="queryForm.page.totalCount" />
    </div>


</template>

<style scoped>
.pannel {
    padding: 10px
}
</style>