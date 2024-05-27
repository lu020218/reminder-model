const SQLiteWrapper = require('./sqliteWrapper');

// 创建 SQLiteWrapper 实例并连接数据库
const dbPath = 'example.db';
const sqlite = new SQLiteWrapper(dbPath);
sqlite.connect();

// 创建数据表
sqlite.createTable('users', ['id INTEGER PRIMARY KEY', 'name TEXT', 'age INTEGER']);

// 插入数据
sqlite.insert('users', { name: 'Alice', age: 30 });

// 查询数据
const users = sqlite.select('users');
console.log('Users:', users);

// 更新数据
sqlite.update('users', { age: 31 }, 'name = "Alice"');

// 删除数据
sqlite.delete('users', 'name = "Alice"');

// 关闭数据库连接
sqlite.close();
