const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

/**
 * Traffic Capture Middleware
 * Logs all incoming requests and outgoing responses for debugging/auditing.
 */
const trafficLogger = (req, res, next) => {
    const startTime = Date.now();
    const logDir = path.join(__dirname, '../../logs');
    
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir);
    }

    const logFile = path.join(logDir, `traffic_${new Date().toISOString().split('T')[0]}.log`);

    // Capture original end function to log response
    const oldEnd = res.end;
    res.end = function(chunk, encoding) {
        const duration = Date.now() - startTime;
        
        let responseBody = '';
        if (chunk) {
            try {
                // Try to parse as JSON or just convert to string
                const tempBody = chunk.toString();
                responseBody = tempBody.length > 500 ? tempBody.substring(0, 500) + '... (truncated)' : tempBody;
            } catch (e) {
                responseBody = '[Binary Data]';
            }
        }

        const logEntry = {
            timestamp: new Date().toISOString(),
            method: req.method,
            url: req.originalUrl,
            params: req.params,
            query: req.query,
            body: req.method !== 'GET' ? JSON.parse(JSON.stringify(req.body)) : {}, // Sanitize sensitive fields if needed here
            status: res.statusCode,
            duration: `${duration}ms`,
            responseSize: chunk ? chunk.length : 0,
            responsePreview: responseBody
        };

        // Redact sensitive info
        if (logEntry.body.password) logEntry.body.password = '[REDACTED]';
        if (logEntry.body.token) logEntry.body.token = '[REDACTED]';

        fs.appendFile(logFile, JSON.stringify(logEntry) + '\n', (err) => {
            if (err) logger.error('Failed to write traffic log:', err);
        });

        oldEnd.apply(res, arguments);
    };

    next();
};

module.exports = trafficLogger;
