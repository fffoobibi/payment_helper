class Database {
  constructor() {
    const fs = require('fs')
    const sqlite3 = require('sqlite3').verbose()
    const os = require('os')
    const dbDir = os.homedir() + import.meta.env.VITE_DB_DIR

    let is_init = fs.existsSync(dbDir)
    if (!is_init) {
      fs.mkdirSync(dbDir)
    }
    this.db = new sqlite3.Database(dbDir + 'local.db')
    if (!is_init) {
      this.init()
    }
  }

  async init() {
    try {
      await this.open()
      // 创建表和索引
      await this.query(`
        CREATE TABLE IF NOT EXISTS dingtalk_submit_log (
          id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
          transaction_number_airwallex VARCHAR(200) NOT NULL,
          bind_approval_number VARCHAR(40) NOT NULL,
          create_time DATETIME NOT NULL,
          update_time DATETIME NOT NULL,
          bind_type VARCHAR(10) NOT NULL,
          creator VARCHAR(20) NOT NULL
        );
      `)
      await this.query(`CREATE INDEX idx_createtime ON dingtalk_submit_log (create_time);`)
      console.log("Database initialized.")
    } catch (error) {
      console.error("Error opening database:", error)
    }
  }

  open() {
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        console.log("Connected to the database.")
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
          console.log("Database closed.")
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
   * @param {string} condition 条件
   * @returns
   */
  update(table, data, condition) {
    return new Promise((resolve, reject) => {
      const entries = Object.entries(data)
        .map(([key, _]) => `${key} = ?`)
        .join(",")
      const params = Object.values(data)
      const sql = `UPDATE ${table} SET ${entries} WHERE ${condition}`

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
   * @param {string} condition 条件
   * @returns
   */
  delete(table, condition) {
    return new Promise((resolve, reject) => {
      const sql = `DELETE FROM ${table} WHERE ${condition}`

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

const db = new Database()
export default db