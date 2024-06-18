#ifndef ILOGGER_H
#define ILOGGER_H

#include <string>

#ifdef _WIN32
#ifdef MYLOGGER_EXPORTS
    #define ILOGGER_API __declspec(dllexport)
  #else
    #define ILOGGER_API __declspec(dllimport)
  #endif
#else
#define ILOGGER_API
#endif

class ILOGGER_API ILogger {
public:
    static ILogger& getInstance();
    void logDebug(const std::string& message, const char* file, int line);
    void logInfo(const std::string& message, const char* file, int line);
    void logWarn(const std::string& message, const char* file, int line);
    void logError(const std::string& message, const char* file, int line);

    void setLogFilePath(const std::string& logFilePath);
private:
    ILogger();
    ~ILogger();

    // Disable copy constructor and assignment operator
    ILogger(const ILogger&) = delete;
    ILogger& operator=(const ILogger&) = delete;

    class Impl;
    Impl* pImpl;
};

#define LOG_DEBUG(msg) ILogger::getInstance().logDebug(msg, __FILE__, __LINE__)
#define LOG_INFO(msg) ILogger::getInstance().logInfo(msg, __FILE__, __LINE__)
#define LOG_WARN(msg) ILogger::getInstance().logWarn(msg, __FILE__, __LINE__)
#define LOG_ERROR(msg) ILogger::getInstance().logError(msg, __FILE__, __LINE__)

#endif // ILOGGER_H