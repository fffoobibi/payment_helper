import { ipcMain } from "electron"
import fs from "fs"
import _ from "sqlite3"
import { URL } from "url"
import { relations } from "./record_filter"


export class OperateDataBase {
    win = null

    async getRecords(userId) {
        const now = Date.now()
        const start = now - 3600 * 24 * 1000 * 15
        const sql = `SELECT * FROM operate_log WHERE user_id=${userId} AND create_time <= ${now} AND create_time >=  ${start}`
        return await this.query(sql)
    }

    _getRecordTitle(pathName, data) {
        const title = relations[pathName]
        if (!title) return
        if (typeof title === 'string') {
            return title
        }
        else if (typeof title === 'function') {
            const t = title(data.log_params ?? {}, data.log_resp, data)
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
            let detail
            if (title instanceof Array) {
                t = title[0]
                detail = title.slice(1).join(' ') + (data.log_text ?? '')
                if (detail) {
                    detail = detail.slice(0, 250)
                }
            } else {
                t = title
                detail = data.log_text ?? null
                if (detail) {
                    detail = detail.slice(0, 250)
                }
            }
            const dump = data.log_params
            if (dump.log_extra) {
                delete dump.log_extra
            }
            if (dump.log_text) {
                delete dump.log_text
            }
            if (dump.log_resp) {
                delete dump.log_resp
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
                operate_data: JSON.stringify(dump)
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
                const n = Date.now()
                const minte = 60 * 1000
                const day = 24 * 60 * minte
                const delta = 60 * day
            this.deleteRaw('operate_log', `create_time <= ${n} - ${delta}`).then(r => {
                console.log('delete success')
            }).catch(err => {
                console.log('delete fail ', err)
            })
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
            detail VARCHAR(256) NULL,
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
            console.log('delete sql ', sql);
            this.db.run(sql, params, (err) => {
                if (err) {
                    reject(err)
                } else {
                    resolve()
                }
            })
        })
    }

    deleteRaw(table, where) {
        return new Promise((resolve, reject) => {
            const sql = `DELETE FROM ${table} WHERE ${where}`
            console.log('delete sql ', sql);
            this.db.run(sql, (err) => {
                if (err) {
                    reject(err)
                } else {
                    resolve()
                }
            })
        })
    }
}



