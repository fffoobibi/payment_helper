export const relations = {

    '/passport/changePws': '修改了密码',
    '/voucher/uploadVoucher': (form, data, resp) => {
        const { left_origin_amount } = resp
        if (left_origin_amount > 0) {
            return ['新增钉钉分批打款', form.approval_number + ' 剩余款项: ' + left_origin_amount + " " + form.currency]
        }
        return ['新增钉钉打款', form.approval_number]
    },
    '/voucher/exportHistoryList': '钉钉打款历史导出',
    '/voucher/modifyVoucher': form => ['修改钉钉打款记录', "修改原因 " + form.application_reason],
    '/voucher/deleteVoucher': '删除钉钉打款记录',
    '/voucher/cancelModifyVoucher': '取消修改打款记录',
    '/voucher/auditModifyVoucher': '审核打款记录修改',
    '/voucher/replenishVoucher': '钉钉打款补充凭证图片',
    '/paymentCashier/review': form => {
        if (form.status?.toString() == '1') {
            return "通过钉钉打款"
        }
        else if (form.status?.toString() == '2') {
            return "拒绝钉钉打款"
        }
        return ''
    },
    '/paymentCashier/batchReview': form => {
        if (form.status?.toString() == '1') {
            return "批量通过钉钉打款"
        }
        else if (form.status?.toString() == '2') {
            return "批量拒绝钉钉打款"
        }
        return ''
    },

    '/voucher/saveMergePayment': '新增钉钉合并打款',
    '/voucher/modifyMergePayment': '修改钉钉合并打款',
    '/voucher/cancelMergePayment': '取消修改钉钉合并打款',
    '/voucher/auditMergePayment': '审核钉钉合并打款修改',
    '/voucher/deleteMergePayment': '删除钉钉合并打款',
    '/voucher/replenishMergePayment': '钉钉合并打款补充凭证图片',
    '/voucher/modifyNote': '钉钉打款修改了备注',

    '/paymentCashier/autoCompletePuchasement': '自动点单',

    '/transit/save': form => ['新增在途资金', '到账金额 ' + form.received_amount],
    '/transit/modify': form => ['修改在途资金', '修改原因 ' + form.application_reason],
    '/transit/cancel': '取消修改在途资金',
    '/transit/audit': '审核在途资金修改',
    '/transit/delete': '删除在途资金',
    '/transit/replenish': '在途资金补充凭证图片',
    '/transit/arrival': form => ['到账在途资金', '到账金额 ' + form.received_amount + " " + form.received_currency],

    '/transferAccounts/save': form => ['新增银行转账', '转账金额 ' + form.origin_amount + " " + form.currency],
    '/transferAccounts/replenish': '银行转账补充凭证图片',
    '/transferAccounts/modify': form => ['修改银行转账', '修改原因 ' + form.application_reason],
    '/transferAccounts/cancel': '取消修改银行转账',
    '/transferAccounts/audit': '审核银行转账修改',
    '/transferAccounts/delete': '删除银行转账',

    '/payout/addPayout': '新增支出',
    '/payout/editPayout': form => ['修改支出', '修改原因 ' + form.application_reason],
    '/payout/cancelEditPayout': '取消修改支出',
    '/payout/auditEditPayout': '审核支出修改',
    '/payout/deletePayout': '删除支出',
    '/payout/replenish': '支出补充凭证图片',

    '/incomeRecord/save': '新增收入',
    '/incomeRecord/modify': form => ['修改收入', '修改原因 ' + form.application_reason],
    '/incomeRecord/cancel': '取消修改收入',
    '/incomeRecord/audit': '审核收入修改',
    '/incomeRecord/delete': '删除收入',
    '/incomeRecord/replenish': '收入补充凭证图片',

    '/creditCard/review': '核销信用卡',
    '/creditCard/modifyNote': '信用卡修改了备注',
    '/creditCard/exportList': '导出信用卡核销账单信息',
    '/creditCard/checkReview': '复核信用卡账单',
    '/creditCard/reimburse': '信用卡报销',
    '/creditCard/addDetail': '新增信用卡账单',

    '/account/inventory': '盘账',
    '/account/editVoucherNo': '编辑凭证号',

    '/paymentCashier/updatePaymentAbnormal': form => ["打款异常", form.purchase_number + " " + form.payment_error_msg]

}

export const recordUrls = () => {
    return Object.keys(relations)
}

export const shouldRecord = (url) => {
    let pathName
    if (!url.startsWith('http')) {
        pathName = url
    } else {
        pathName = (new URL(url)).pathname
    }
    if (relations[pathName]) {
        return true
    }
    return false
}