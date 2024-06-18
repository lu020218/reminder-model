//
// Created by 陆海山 on 24-6-18.
//
#include "ILogger.h"
#include <log4cpp/Category.hh>
#include <log4cpp/FileAppender.hh>
#include <log4cpp/PatternLayout.hh>
#include <log4cpp/PropertyConfigurator.hh>
#include <iostream>

class ILogger::Impl {
public:
    Impl() : rootCategory(log4cpp::Category::getRoot()) {
        configureLogger("application.log");  // Default log file
    }

    ~Impl() {
        log4cpp::Category::shutdown();
    }

    void logDebug(const std::string& message, const char* file, int line) {
        rootCategory.debug(createLogMessage(message, file, line));
    }

    void logInfo(const std::string& message, const char* file, int line) {
        rootCategory.info(createLogMessage(message, file, line));
    }

    void logWarn(const std::string& message, const char* file, int line) {
        rootCategory.warn(createLogMessage(message, file, line));
    }

    void logError(const std::string& message, const char* file, int line) {
        rootCategory.error(createLogMessage(message, file, line));
    }

    void setLogFilePath(const std::string& logFilePath) {
        configureLogger(logFilePath);
    }

private:
    log4cpp::Category& rootCategory;

    void configureLogger(const std::string& logFilePath) {
        log4cpp::Appender* appender = new log4cpp::FileAppender("default", logFilePath);
        log4cpp::PatternLayout* layout = new log4cpp::PatternLayout();
        layout->setConversionPattern("%d [%t] %-5p %c - %m%n");
        appender->setLayout(layout);

        rootCategory.setAppender(appender);
        rootCategory.setPriority(log4cpp::Priority::DEBUG);
    }

    std::string createLogMessage(const std::string& message, const char* file, int line) {
        std::ostringstream oss;
        oss << file << ":" << line << " - " << message;
        return oss.str();
    }
};

ILogger::ILogger() : pImpl(new Impl()) {}
ILogger::~ILogger() { delete pImpl; }

ILogger& ILogger::getInstance() {
    static ILogger instance;
    return instance;
}

void ILogger::logDebug(const std::string& message, const char* file, int line) {
    pImpl->logDebug(message, file, line);
}

void ILogger::logInfo(const std::string& message, const char* file, int line) {
    pImpl->logInfo(message, file, line);
}

void ILogger::logWarn(const std::string& message, const char* file, int line) {
    pImpl->logWarn(message, file, line);
}

void ILogger::logError(const std::string& message, const char* file, int line) {
    pImpl->logError(message, file, line);
}

void ILogger::setLogFilePath(const std::string& logFilePath) {
    pImpl->setLogFilePath(logFilePath);
}