#include <iostream>
#include <thread>
#include <chrono>
#include <functional>
#include <map>
#include <mutex>
#include <condition_variable>
#include <atomic>

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

    void remove_task(const std::chrono::system_clock::time_point& time) {
        std::unique_lock<std::mutex> lock(mutex_);
        auto it = tasks_.find(time);
        if (it != tasks_.end()) {
            tasks_.erase(it);
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
            Task task_to_run;
            {
                std::unique_lock<std::mutex> lock(mutex_);
                if (tasks_.empty()) {
                    cond_var_.wait(lock, [this]() { return stop_ || !tasks_.empty(); });
                }

                if (stop_) break;

                auto it = tasks_.begin();
                auto now = std::chrono::system_clock::now();
                if (now >= it->first) {
                    task_to_run = it->second;
                    tasks_.erase(it);
                } else {
                    cond_var_.wait_until(lock, it->first);
                }
            }
            if (task_to_run) {
                task_to_run();
            }
        }
    }

    std::map<std::chrono::system_clock::time_point, Task> tasks_;
    std::thread scheduler_thread_;
    std::mutex mutex_;
    std::condition_variable cond_var_;
    std::atomic<bool> stop_;
};

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

    std::this_thread::sleep_for(std::chrono::seconds(10));
    scheduler.stop();

    return 0;
}