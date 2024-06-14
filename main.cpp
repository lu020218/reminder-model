#include <iostream>
#include <thread>
#include <chrono>
#include <functional>
#include <map>
#include <mutex>
#include <condition_variable>
#include <atomic>
#include <vector>

class TaskScheduler {
public:
    using Task = std::function<void()>;

    TaskScheduler() : stop_(false) {}

    ~TaskScheduler() {
        stop();
    }

    void add_task(const std::chrono::system_clock::time_point& time, Task task) {
        {
            std::unique_lock<std::mutex> lock(mutex_);
            tasks_.emplace(time, task);
            cond_var_.notify_one();
        }
    }

    void remove_task(const std::chrono::system_clock::time_point& time, Task task) {
        std::unique_lock<std::mutex> lock(mutex_);
        auto range = tasks_.equal_range(time);
        for (auto it = range.first; it != range.second; ++it) {
            if (it->second.target_type() == task.target_type()) {
                tasks_.erase(it);
                break;
            }
        }
    }

    void start() {
        scheduler_thread_ = std::thread([this]() { run(); });
    }

    void stop() {
        {
            std::unique_lock<std::mutex> lock(mutex_);
            stop_ = true;
            cond_var_.notify_all();
        }
        if (scheduler_thread_.joinable()) {
            scheduler_thread_.join();
        }
    }

private:
    void run() {
        while (true) {
            std::vector<Task> tasks_to_run;
            {
                std::unique_lock<std::mutex> lock(mutex_);
                if (tasks_.empty()) {
                    cond_var_.wait(lock, [this]() { return stop_ || !tasks_.empty(); });
                }

                if (stop_) break;

                auto now = std::chrono::system_clock::now();
                auto it = tasks_.begin();
                while (it != tasks_.end() && it->first <= now) {
                    tasks_to_run.push_back(it->second);
                    it = tasks_.erase(it);
                }

                if (tasks_.empty() && !stop_) {
                    cond_var_.wait(lock);
                } else if (!tasks_.empty()) {
                    cond_var_.wait_until(lock, tasks_.begin()->first);
                }
            }
            for (const auto& task : tasks_to_run) {
                task();
            }
        }
    }

    std::multimap<std::chrono::system_clock::time_point, Task> tasks_;
    std::thread scheduler_thread_;
    std::mutex mutex_;
    std::condition_variable cond_var_;
    std::atomic<bool> stop_;
};

// 示例任务函数
void example_task() {
    std::cout << "Task executed at: "
              << std::chrono::system_clock::to_time_t(std::chrono::system_clock::now())
              << std::endl;
}

int main() {
    TaskScheduler scheduler;
    scheduler.start();

    auto time_point = std::chrono::system_clock::now() + std::chrono::seconds(5);
    scheduler.add_task(time_point, example_task);
    scheduler.add_task(time_point, [] {
        std::cout << "Another task executed at: "
                  << std::chrono::system_clock::to_time_t(std::chrono::system_clock::now())
                  << std::endl;
    });

    std::this_thread::sleep_for(std::chrono::seconds(10));
    scheduler.stop();

    return 0;
}