import user from './user' // 用户接口
import transit from './transit' // 在途资金
import transfer from './transfer' // 内部银行转账

const api = { // 导出所有API接口
  ...user,
  transit,
  transfer
}

export default api