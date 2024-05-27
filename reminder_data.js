const SQLiteWrapper = require('./sqliteWrapper');
const fs = require('fs');

let ReminderData = {
    dbPath: '',
    sqlite: undefined,
    // 创建 SQLiteWrapper 实例并连接数据库
    Connect: function(dbPath) {
        this.dbPath = dbPath;
        let flag = 0;
        this.sqlite = new SQLiteWrapper(this.dbPath);
        if (this.sqlite) {
            // 判断文件是否存在
            if (fs.existsSync(dbPath)) {
                console.log('Database file exists');
                flag = 1;
            } else {
                console.log('Database file does not exist');
                flag = 0;
            }
            let ret = this.sqlite.connect();
            if (ret) {
                return flag
            }
        }
        return -1;
    },
    // 初始化数据库
    Init: function() {
        if (!this.sqlite) {
            return false;
        }

        // 创建 待办任务标签表
        this.sqlite.createTable(
            't_assistant_remind_tag', 
            [
                'id VARCHAR (64) PRIMARY KEY NOT NULL', 
                'content VARCHAR (512)'
            ]
        );

        // 创建 标签待办任务映射表
        this.sqlite.createTable(
            't_assistant_remind_tag_todo_task', 
            [
                'id VARCHAR (64) PRIMARY KEY', 
                'tag_id VARCHAR (64) NOT NULL', 
                'task_id VARCHAR (64) NOT NULL'
            ]
        );

        // 创建 任务表
        this.sqlite.createTable(
            't_assistant_todo_task', 
            [
                'id VARCHAR (64) PRIMARY KEY NOT NULL', 
                'task_type BIGINT (6)', 
                'title VARCHAR (128)', 
                'content VARCHAR (512)', 
                'start_time BIGINT (20)', 
                'end_time BIGINT (20)', 
                'advanced_time VARCHAR (128)', 
                'repetition_type VARCHAR (32)',
                'user_id VARCHAR (32)',
                'delete_flag BOOLEAN',
                'message_type BIGINT (6)',
                'end_type VARCHAR (32)',
                'end_value BIGINT (20)',
                'total_end_time BIGINT (20)',
                'target_data_address VARCHAR (128)',
                'reminder_type VARCHAR (32)'
            ]
        );

        // 创建 任务改动记录表
        this.sqlite.createTable(
            't_assistant_todo_task_change_record',
            [
                'id VARCHAR (64) PRIMARY KEY NOT NULL',
                'task_id VARCHAR (64) NOT NULL',
                'before_exec_time BIGINT (20)',
                'after_exec_time BIGINT (20)',
                'user_id VARCHAR (32)',
                'create_time BIGINT (20)'
            ]
        );

        // 创建 提醒事件表
        this.sqlite.createTable(
            't_assistant_reminder_event',
            [
                'id VARCHAR (64) PRIMARY KEY NOT NULL',
                'task_id VARCHAR (64) NOT NULL',
                'title VARCHAR (128)',
                'cron VARCHAR (32)',
                'content VARCHAR (512)',
                'reminder_type VARCHAR (32)',
                'scheduled_id VARCHAR (64)',
                'start_time BIGINT (20)',
                'end_time BIGINT (20)',
                'created_time BIGINT (20)',
                'updated_time BIGINT (20)',
                'status VARCHAR (32)',
                'trigger_time BIGINT (20)',
                'target_data_address VARCHAR (128)'
            ]
        );

        // 创建 提醒事件历史表
        this.sqlite.createTable(
            't_assistant_reminder_event_history',
            [
                'id VARCHAR (64) PRIMARY KEY NOT NULL',
                'task_id VARCHAR (64) NOT NULL',
                'reminder_id VARCHAR (64)',
                'content VARCHAR (512)',
                'reminder_type VARCHAR (32)',
                'scheduled_id VARCHAR (64)',
                'reminder_time BIGINT (20)',
                'created_time BIGINT (20)',
                'updated_time BIGINT (20)'
            ]
        );

        return true;
    },
    // 插入标签数据
    InsertTag: function(datas) {
        if (!this.sqlite) {
            return false;
        }

        datas.forEach(element => {
            this.sqlite.insert('t_assistant_remind_tag', element);
        });

        return true;
    },
    // 插入任务数据
    InsertTodoTask: function(datas) {
        if (!this.sqlite) {
            return false;
        }

        datas.forEach(data => {
            this.sqlite.insert('t_assistant_todo_task', data);
        });

        return true;
    },
    // 插入任务标签映射关系
    InsertTag2TodoTask: function(datas) {
        if (!this.sqlite) {
            return false;
        }

        datas.forEach(data => {
            this.sqlite.insert('t_assistant_remind_tag_todo_task', data);
        });

        return true;
    },
    // 插入任务改动记录
    InsertTodoTaskChangeRecord: function(datas) {
        if (!this.sqlite) {
            return false;
        }

        datas.forEach(data => {
            this.sqlite.insert('t_assistant_todo_task_change_record', data);
        });

        return true;
    },
    // 插入提醒事件数据
    InsertReminderEvent: function(datas) {
        if (!this.sqlite) {
            return false;
        }

        datas.forEach(data => {
            this.sqlite.insert('t_assistant_reminder_event', data);
        });

        return true;
    },
    // 插入提醒事件历史记录
    InsertReminderEventHistory: function(datas) {
        if (!this.sqlite) {
            return false;
        }

        datas.forEach(data => {
            this.sqlite.insert('t_assistant_reminder_event_history', data);
        });

        return true;
    },
    // 更新标签
    UpdateTag: function(datas, conditions) {
        if (!this.sqlite) {
            return false;
        }

        datas.forEach(data => {
            this.sqlite.update('t_assistant_tag', data, conditions);
        });
        
        return true;
    },
    // 更新任务
    UpdateTodoTask: function(datas, conditions) {
        if (!this.sqlite) {
            return false;
        }

        datas.forEach(data => {
            this.sqlite.update('t_assistant_todo_task', data, conditions);
        });

        return true;
    },
    // 更新任务标签映射
    UpdateTag2TodoTask: function(datas, conditions) {
        if (!this.sqlite) {
            return false;
        }

        datas.forEach(data => {
            this.sqlite.update('t_assistant_remind_tag_todo_task', data, conditions);
        });

        return true;
    },
    // 更新任务改动记录
    UpdateTodoTaskChangeRecord: function(datas, conditions) {
        if (!this.sqlite) {
            return false;
        }

        datas.forEach(data => {
            this.sqlite.update('t_assistant_todo_task_change_record', data, conditions);
        });

        return true;
    },
    // 更新提醒事件
    UpdateReminderEvent: function(datas, conditions) {
        if (!this.sqlite) {
            return false;
        }

        datas.forEach(data => {
            this.sqlite.update('t_assistant_reminder_event', data, conditions);
        });

        return true;
    },
    // 插入提醒事件历史记录
    UpdateReminderEventHistory: function(datas, conditions) {
        if (!this.sqlite) {
            return false;
        }

        datas.forEach(data => {
            this.sqlite.update('t_assistant_reminder_event_history', data, conditions);
        });

        return true;
    },
    // 查询标签
    QueryTag: function(conditions) {
        if (!this.sqlite) {
            return undefined;
        }

        return this.sqlite.select('t_assistant_tag', conditions);
    },
    // 查询任务
    QueryTodoTask: function(conditions) {
        if (!this.sqlite) {
            return undefined;
        }

        return this.sqlite.select('t_assistant_todo_task', conditions);
    },
    // 查询任务标签映射
    QueryTag2TodoTask: function(conditions) {
        if (!this.sqlite) {
            return undefined;
        }

        return this.sqlite.select('t_assistant_remind_tag_todo_task', conditions);
    },
    // 查询任务改动记录
    QueryTodoTaskChangeRecord: function(conditions) {
        if (!this.sqlite) {
            return undefined;
        }

        return this.sqlite.select('t_assistant_todo_task_change_record', conditions);
    },
    // 查询提醒事件
    QueryReminderEvent: function(conditions) {
        if (!this.sqlite) {
            return undefined;
        }

        return this.sqlite.select('t_assistant_reminder_event', conditions);
    },
    // 查询提醒事件历史记录
    QueryReminderEventHistory: function(conditions) {
        if (!this.sqlite) {
            return undefined;
        }

        return this.sqlite.select('t_assistant_reminder_event_history', conditions);
    },
    // 删除标签
    DeleteTag: function(conditions) {
        if (!this.sqlite) {
            return false;
        }

        this.sqlite.delete('t_assistant_tag', conditions);

        return true;
    },
    // 删除任务
    DeleteTodoTask: function(conditions) {
        if (!this.sqlite) {
            return false;
        }

        this.sqlite.delete('t_assistant_todo_task', conditions);

        return true;
    },
    // 删除标签任务映射
    DeleteTag2TodoTask: function(conditions) {
        if (!this.sqlite) {
            return false;
        }

        this.sqlite.delete('t_assistant_remind_tag_todo_task', conditions);

        return true;
    },
    // 删除任务改动记录
    DeleteTodoTaskChangeRecord: function(conditions) {
        if (!this.sqlite) {
            return false;
        }

        this.sqlite.delete('t_assistant_todo_task_change_record', conditions);

        return true;
    },
    // 删除提醒事件
    DeleteReminderEvent: function(conditions) {
        if (!this.sqlite) {
            return false;
        }

        this.sqlite.delete('t_assistant_reminder_event', conditions);

        return true;
    },
    // 删除标签
    DeleteReminderEventHistory: function(conditions) {
        if (!this.sqlite) {
            return false;
        }

        this.sqlite.delete('t_assistant_reminder_event_history', conditions);

        return true;
    },
    // 关闭数据库
    Close: function() {
        if (!this.sqlite) {
            return false;
        }

        this.sqlite.close();
    }
}

module.exports = ReminderData;