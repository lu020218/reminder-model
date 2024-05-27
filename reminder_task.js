const ReminderData = require('./reminder_data');
const cronParser = require('cron-parser');
// const UniqueArray = require('./UniqueArray');
import { v4 as uuidv4 } from 'uuid';

// 依据任务开始时间、提前提醒时间以及重复类型生成cron表达式
function generateCronExpression(timestamp, advanceTimeInSeconds, repeatType) {
    const startDate = new Date(timestamp - advanceTimeInSeconds * 1000);
    
    const minute = startDate.getUTCMinutes();
    const hour = startDate.getUTCHours();
    const day = startDate.getUTCDate();
    const month = startDate.getUTCMonth() + 1; // getUTCMonth returns 0-11
    const dayOfWeek = startDate.getUTCDay(); // getUTCDay returns 0-6 (Sunday-Saturday)
  
    let cronExpression = '';
  
    switch (repeatType) {
      case 'daily':
        // 每天
        cronExpression = `${minute} ${hour} * * *`;
        break;
      case 'weekday':
        // 每个工作日 (周一到周五)
        cronExpression = `${minute} ${hour} * * 1-5`;
        break;
      case 'weekly':
        // 每周
        cronExpression = `${minute} ${hour} * * ${dayOfWeek}`;
        break;
      case 'monthly':
        // 每月
        cronExpression = `${minute} ${hour} ${day} * *`;
        break;
      case 'yearly':
        // 每年
        cronExpression = `${minute} ${hour} ${day} ${month} *`;
        break;
      default:
        throw new Error('Invalid repeat type');
    }
  
    return cronExpression;
}

// 解析cron表达式，获取指定时间范围内的任务触发时间戳数组
// function generateTimestampsFromCronExpression(cronExpression, startDate, endDate) {
//     const options = {
//         currentDate: startDate,
//         endDate: endDate,
//         iterator: true,
//     };

//     const timestamps = [];
//     const interval = cronParser.parseExpression(cronExpression, options);

//     while (true) {
//         try {
//             const next = interval.next();
//             if (!next || next.getTime() > endDate.getTime()) break;
//             timestamps.push(next.getTime());
//         } catch (error) {
//             console.error('Error parsing cron expression:', error.message);
//             break;
//         }
//     }

//     return timestamps;
// }

// 依据cron表达式获取指定时间段内的任务开始时间戳数组
function getTimestampsFromCronExpression(taskStartTime, advanceTimeInSeconds, repeatType, rangeStartTime, rangeEndTime) {
    const cronExpression = generateCronExpression(taskStartTime, advanceTimeInSeconds, repeatType);
  
    const options = {
      currentDate: new Date(rangeStartTime),
      endDate: new Date(rangeEndTime),
      iterator: true,
    };
  
    const timestamps = [];
    const interval = cronParser.parseExpression(cronExpression, options);
  
    while (true) {
      try {
        const obj = interval.next();
        const taskTimestamp = obj.value.getTime() + (advanceTimeInSeconds * 1000);
        if (taskTimestamp > rangeEndTime) break;
        timestamps.push(taskTimestamp);
      } catch (error) {
        break;
      }
    }

    return timestamps;
}

function getTimestampThreeMonthsAgo() {
    const now = new Date();
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
    return threeMonthsAgo.getTime();
}

function getNextCronTime(cronExpression) {
    try {
      // 使用 cron-parser 解析 Cron 表达式
      const interval = cronParser.parseExpression(cronExpression);
      // 获取下一个执行时间
      const nextExecution = interval.next();
      // 返回时间戳
      return nextExecution.getTime();
    } catch (err) {
      console.error('Error parsing cron expression:', err.message);
      return null;
    }
}

function getTaskData(begin, end) {

}

let ReminderTask = {
    init: function (data, dbPath) {
        const r = ReminderData.Connect(dbPath);
        let data = undefined;
        if (r == 1) {
            // 连接已存在的数据库文件
            // 读取上一次数据同步时间
            let latest_task = ReminderData.QueryTodoTask('ORDER BY created_at DESC LIMIT 1;');
            let begTime = latest_task.start_time;
            let endTime = new Date('9999-12-31T23:59:59').getTime();
            // 调用同步接口获取上一次数据同步之后的数据
            data = getTaskData(begTime, endTime);
        } else if (r == 0) {
            // 创建新的数据库文件
            // 初始化数据库，创建数据表
            if (ReminderData.Init()) {
                // 调用同步接口获取最近三个月数据
                const currentTimestamp = Date.now();
                const timestampThreeMonthsAgo = getTimestampThreeMonthsAgo();
                data = getTaskData(timestampThreeMonthsAgo, currentTimestamp);
            }
            
        } else {
            // 数据库连接失败
            console.log('database connect failed.');
        }
        
        if (data) {
            let ret = ReminderData.InsertTag(data.tags);
            ret = ReminderData.InsertTag2TodoTask(data.tag_todo_tasks);
            ret = ReminderData.InsertTodoTaskChangeRecord(data.todo_task_change_records);

            let unfinished = this.filterUnfinishedTask(data.tasks);
            ret = ReminderData.InsertTodoTask(unfinished);
            
        }
        
    },
    // 过滤未完成的任务
    filterUnfinishedTask: function (tasks) {
        const currentTimestamp = Date.now();
        const result = tasks.filter(task => task.total_end_time >= currentTimestamp);
        console.log('filterUnfinishedTask: ' + result);
        return result;
    },
    // 过滤改动记录表中的任务生成提醒事件
    filterReminderEventByModifyRecord: function (events) {
        const task_ids = events.map(ent => ent.task_id);
        const conditions = task_ids.map(item => `'${item}'`).join(',');
        let change_records = ReminderData.QueryTodoTaskChangeRecord(`task_id in (${conditions})`);
        const retVal = events.filter(ent => {
            const result = change_records.find(record => {
                return (record.task_id == ent.task_id) && (record.before_exec_time == ent.trigger_time);
            });

            return result === undefined;
        });
        console.log('filterReminderEventByModifyRecord: ' + retVal);
        return retVal;
    },
    // 依据主任务生成提醒事件
    generateReminderEvent: function (task) {
        let reminderEvents = [];
        // 将字符串转换成数组
        let adTimes = task.advanced_time.split(',').map(Number);
        adTimes.forEach(adTime => {
            let cron = generateCronExpression(task.start_time, adTime, task.repetition_type);
            const uuid = uuidv4();
            const currentTimestamp = Date.now();
            const trigger_time = getNextCronTime(cron);

            let reminderEvent = {
                id: uuid,
                task_id: task.id,
                title: task.title,
                cron: cron,
                content: task.content,
                reminder_type: task.reminder_type,
                scheduled_id: uuid,
                created_time: currentTimestamp,
                updated_time: currentTimestamp,
                status: '',
                trigger_time: trigger_time,
                target_data_address: ''
            };

            reminderEvents.push(reminderEvent);
        });
        
        return reminderEvents;
    },
    // 查询任务
    getReminderTask: function (begin, end) {
        // 查询指定时间段内的任务数据
        let tasks = [];
        let todoTasks = ReminderData.QueryTodoTask(`total_end_time >= ${begin} and total_end_time <= ${end}`);
        if (todoTasks) {
            todoTasks.forEach(task => {
                let rangeStartTime = begin >= task.start_time ? begin : task.start_time;
                let rangeEndTime = end >= task.total_end_time ? task.total_end_time : end;
                let timeMillisecond = task.end_time - task.start_time;

                let start_time_nodes = getTimestampsFromCronExpression(task.start_time, 0, task.repetition_type, rangeStartTime, rangeEndTime);
                start_time_nodes.forEach(start_time => {
                    let t = {
                        id: task.id,
                        task_type: task.task_type,
                        title: task.title,
                        content: task.content,
                        start_time: start_time,
                        end_time: start_time + timeMillisecond,
                        advanced_time: task.advanced_time,
                        repetition_type: task.repetition_type,
                        message_type: task.message_type,
                        end_type: task.end_type,
                        end_value: task.end_value,
                        user_id: task.user_id
                    };
    
                    tasks.push(t);
                });
                
            });
        }

        return tasks;
    },
}