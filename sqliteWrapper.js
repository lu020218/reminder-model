const Database = require('better-sqlite3');

class SQLiteWrapper {
  constructor(dbPath) {
    this.db = new Database(dbPath);
  }

  // 连接数据库
  connect() {
    try {
      this.db = new Database(dbPath);
      console.log('Connected to the database.');
      return true;
    } catch (error) {
      console.error('Error connecting to the database:', error.message);
      return false;
    }
  }

  // 创建数据表
  createTable(tableName, columns) {
    try {
      const columnDefinitions = columns.join(', ');
      const sql = `CREATE TABLE IF NOT EXISTS ${tableName} (${columnDefinitions})`;
      this.db.exec(sql);
      console.log(`Table "${tableName}" created successfully.`);
    } catch (error) {
      console.error(`Error creating table "${tableName}":`, error.message);
    }
  }

  // 插入数据
  insert(tableName, data) {
    try {
      const keys = Object.keys(data);
      const values = Object.values(data);
      const placeholders = keys.map(() => '?').join(', ');
      const sql = `INSERT INTO ${tableName} (${keys.join(', ')}) VALUES (${placeholders})`;
      this.db.prepare(sql).run(...values);
      console.log('Data inserted successfully.');
    } catch (error) {
      console.error('Error inserting data:', error.message);
    }
  }

  // 查询数据
  select(tableName, conditions) {
    try {
      const whereClause = conditions ? ` WHERE ${conditions}` : '';
      const sql = `SELECT * FROM ${tableName}${whereClause}`;
      const rows = this.db.prepare(sql).all();
      console.log('Selected data:', rows);
      return rows;
    } catch (error) {
      console.error('Error selecting data:', error.message);
      return [];
    }
  }

  // 更新数据
  update(tableName, data, conditions) {
    try {
      const setClause = Object.keys(data).map(key => `${key} = ?`).join(', ');
      const whereClause = conditions ? ` WHERE ${conditions}` : '';
      const values = Object.values(data);
      const sql = `UPDATE ${tableName} SET ${setClause}${whereClause}`;
      this.db.prepare(sql).run(...values);
      console.log('Data updated successfully.');
    } catch (error) {
      console.error('Error updating data:', error.message);
    }
  }

  // 删除数据
  delete(tableName, conditions) {
    try {
      const whereClause = conditions ? ` WHERE ${conditions}` : '';
      const sql = `DELETE FROM ${tableName}${whereClause}`;
      this.db.prepare(sql).run();
      console.log('Data deleted successfully.');
    } catch (error) {
      console.error('Error deleting data:', error.message);
    }
  }

  // 关闭数据库连接
  close() {
    try {
      this.db.close();
      console.log('Closed the database connection.');
    } catch (error) {
      console.error('Error closing the database connection:', error.message);
    }
  }
}

module.exports = SQLiteWrapper;
