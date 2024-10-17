import { log } from "console"
import { ipcMain } from "electron"
import fs from "fs"
import { type } from "os"
import _ from "sqlite3"
import { URL } from "url"

export class OperateDataBase {
    win = null
    relations = {

        '/passport/changePws': '修改了密码',
        '/voucher/uploadVoucher': '新增钉钉打款',
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

        '/paymentCashier/autoCompletePuchasement': '自动点单',

        '/transit/save': form => ['新增在途资金', '到账金额 ' + form.received_amount],
        '/transit/modify': form => ['修改在途资金', '修改原因 ' + form.application_reason],
        '/transit/cancel': '取消修改在途资金',
        '/transit/audit': '审核在途资金修改',
        '/transit/delete': '删除在途资金',
        '/transit/replenish': '在途资金补充凭证图片',
        '/transit/arrival': form => ['到账在途资金', '到账金额 ' + form.received_amount + " " + form.received_currency],

        '/transferAccounts/save': form=>['新增银行转账', '转账金额 ' + form.origin_amount + " " + form.currency],
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


    async getRecords(userId) {
        const now = Date.now()
        const start = now - 3600 * 24 * 1000 * 15
        const sql = `SELECT * FROM operate_log WHERE user_id=${userId} AND create_time <= ${now} AND create_time >=  ${start}`
        return await this.query(sql)
    }

    _getRecordTitle(pathName, data) {
        const title = this.relations[pathName]
        if (!title) return
        if (typeof title === 'string') {
            return title
        }
        else if (typeof title === 'function') {
            const t = title(data.log_params ?? {}, data)
            return t
        }

    }

    record(data) {
        const { url } = data
        let pathName
        if (!url.startsWith('http')) {
            pathName = url
        } else {
            pathName = (new URL(url)).pathname
        }
        const title = this._getRecordTitle(pathName, data)
        if (title) {
            let t
            if(title instanceof Array){
                t = title[0]
                detail = title.slice(1).join(' ') + (data.log_text ?? '' )
            }else{
                t = title
                detail = data.log_text ?? null
            }
            const d = {
                url: pathName,
                title: t,
                detail,
                user_id: data.user_id,
                create_time: data.create_time,
                creator: data.creator,
                status: data.status,
                statusMsg: data.statusMsg,
                operate_data: JSON.stringify(data.log_params)
            }
            this.insert('operate_log', d)
            try {
                this.win?.webContents.send('operate-sql:record-event', d)
            } catch (err) {

            }
        }
    }

    constructor(dbPath) {
        const sqlite3 = _.verbose()
        const dbDir = dbPath
        let is_init = fs.existsSync(dbDir)
        this.db = new sqlite3.Database(dbPath, err => {
            if (err) {
                console.error('数据库连接失败:', err.message)
            } else {
                console.log('数据库连接成功.')
            }
        })
        if (!is_init) {
            this.init()
        }
    }


    initHandles(mainWindow) {
        if (!this.win) {
            this.win = mainWindow
        }
        // operatesql
        ipcMain.handle('operate-sql-query', async (event, sql, params) => {
            const result = await this.query(sql, params)
            if (result) return result
        })

        ipcMain.handle('operate-sql-insert', async (event, table, data) => {
            const result = await this.insert(table, data)
            if (result) return result
        })

        ipcMain.handle('operate-sql-update', async (event, table, data, where) => {
            const result = await this.update(table, data, where)
            if (result) return result
        })

        ipcMain.handle('operate-sql-delete', async (event, table, where) => {
            const result = await this.delete(table, where)
            if (result) return result
        })
        ipcMain.on('operate-sql:record', (event, data) => {
            this.record(data)
        })

        ipcMain.handle('operate-sql:getRecords', async (event, userId) => {
            return await this.getRecords(userId)
        })
    }

    async init() {
        try {
            await this.open()
            // 创建表和索引
            await this.query(`
          CREATE TABLE IF NOT EXISTS operate_log (
            id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            url VARCHAR(80) NOT NULL,
            title VARCHAR(50) NOT NULL,
            detail VARCHAR(50) NULL,
            status TINYINT NOT NULL,
            statusMsg VARCHAR(100) NULL,
            operate_data TEXT NULL,
            create_time DATETIME NOT NULL,
            creator VARCHAR(20) NOT NULL
          );
        `)
            await this.query(`  CREATE INDEX idx_createtime ON operate_log (create_time);
                                CREATE INDEX idx_user_id ON operate_log (user_id);
                                CREATE INDEX idx_title ON operate_log (title);
        `)
            console.log("operate db init success ")
        } catch (error) {
            console.error("operate db init fail ", error)
        }
    }

    open() {
        return new Promise((resolve, reject) => {
            this.db.serialize(() => {
                console.log("operate db connect success")
                resolve()
            })
        })
    }

    close() {
        return new Promise((resolve, reject) => {
            this.db.close(err => {
                if (err) {
                    reject(err)
                } else {
                    console.log("数据库已关闭连接.")
                    resolve()
                }
            })
        })
    }

    /**
     * 查询
     * @param {string} sql
     * @param {object|array|null} params
     * @returns
     */
    query(sql, params) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    reject(err)
                } else {
                    resolve(rows)
                }
            })
        })
    }

    /**
     * 插入数据
     * @param {string} table 表名
     * @param {object} data 数据
     * @returns
     */
    insert(table, data) {
        return new Promise((resolve, reject) => {
            try {
                const keys = Object.keys(data)
                const values = Object.values(data)
                const placeholders = keys.map(() => '?').join(',')
                const sql = `INSERT INTO ${table} (${keys.join(',')}) VALUES (${placeholders})`

                this.db.run(sql, values, function (err) {
                    if (err) {
                        reject(err)
                    } else {
                        resolve(this.lastID)
                    }
                })
            } catch (err) {
                console.log('insert fail ', err)
                reject(err)
            }

        })
    }

    /**
     * 更新数据
     * @param {string} table 表名
     * @param {object} data 数据
     * @param {object} where 条件
     * @returns
     */
    update(table, data, where) {
        return new Promise((resolve, reject) => {
            const entries = Object.entries(data).map(([key, _]) => `${key} = ?`).join(",")
            const params = Object.values(data)
            const wheres = Object.entries(where).map(([key, _]) => `${key} = ?`).join(" AND ")
            params.push(...Object.values(where))
            const sql = `UPDATE ${table} SET ${entries} WHERE ${wheres}`
            this.db.run(sql, params, function (err) {
                if (err) {
                    reject(err)
                } else {
                    resolve(this.changes)
                }
            })
        })
    }

    /**
     * 删除数据
     * @param {string} table 表名
     * @param {object} where 条件
     * @returns
     */
    delete(table, where) {
        return new Promise((resolve, reject) => {
            const wheres = Object.entries(where).map(([key, _]) => `${key} = ?`).join(" AND ")
            const params = Object.values(where)
            const sql = `DELETE FROM ${table} WHERE ${wheres}`
            this.db.run(sql, params, (err) => {
                if (err) {
                    reject(err)
                } else {
                    resolve()
                }
            })
        })
    }
}
