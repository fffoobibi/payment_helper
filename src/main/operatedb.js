import { ipcMain } from "electron"
import fs from "fs"
import _ from "sqlite3"

export class OperateDataBase {
    constructor(dbPath) {
        // const fs = require('fs')
        // const sqlite3 = require('sqlite3').verbose()
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

    initHandles() {
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
        ipcMain.on('operate-sql:record', (event, data)=>{
            this.insert('operate_log', data)
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
            operate_title VARCHAR(50) NOT NULL,
            operate_data VARCHAR(400) NULL,
            create_time DATETIME NOT NULL,
            creator VARCHAR(20) NOT NULL
          );
        `)
            await this.query(`CREATE INDEX idx_createtime ON operate_log (create_time);
                        CREATE INDEX idx_user_id ON operate_log (user_id);
        `)
            console.log("数据库初始化完成.")
        } catch (error) {
            console.error("数据库打开失败:", error)
        }
    }

    open() {
        return new Promise((resolve, reject) => {
            this.db.serialize(() => {
                console.log("数据库连接成功.")
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
