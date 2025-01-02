import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logsDir = path.join(__dirname, '../logs');

// Ensure logs directory exists
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

export class Logger {
  static log(type, message, data = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      type,
      message,
      ...data
    };

    // Console output
    console.log(`[${timestamp}] ${type}: ${message}`, data);

    // File output
    const date = timestamp.split('T')[0];
    const logFile = path.join(logsDir, `${date}.log`);
    
    fs.appendFileSync(
      logFile,
      JSON.stringify(logEntry) + '\n'
    );
  }

  static userAction(userId, action, data = {}) {
    this.log('USER_ACTION', action, { userId, ...data });
  }

  static chatEvent(userId, partnerId, event, data = {}) {
    this.log('CHAT_EVENT', event, { userId, partnerId, ...data });
  }

  static error(error, context = {}) {
    this.log('ERROR', error.message, { 
      stack: error.stack,
      ...context
    });
  }
}