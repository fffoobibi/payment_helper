import user from './user' // 用户接口
import payment from './payment' // 钉钉打款
import transit from './transit' // 在途资金
import transfer from './transfer' // 内部银行转账
import bank_account from './bank_account' // 银行账户
import incomeRecord from './income_record' // 银行账户-收入

const api = { // 导出所有API接口
  ...user,
  ...payment,
  transit,
  transfer,
  bank_account, 
  incomeRecord
}

export default api