const LOG_LEVELS = { ERROR: 'ERROR', WARN: 'WARN', INFO: 'INFO' };

function formatLog(level, context, message, meta = {}) {
  const timestamp = new Date().toISOString();
  const entry = {
    timestamp,
    level,
    context,
    message,
    ...meta,
  };
  return JSON.stringify(entry);
}

export function logError(context, message, error = null) {
  const meta = {};
  if (error) {
    meta.errorName = error.name || 'Error';
    meta.errorMessage = error.message || String(error);
    if (error.code) meta.errorCode = error.code;
    if (error.status) meta.httpStatus = error.status;
    if (process.env.NODE_ENV === 'development' && error.stack) {
      meta.stack = error.stack;
    }
  }
  console.error(formatLog(LOG_LEVELS.ERROR, context, message, meta));
}

export function logWarn(context, message, meta = {}) {
  console.warn(formatLog(LOG_LEVELS.WARN, context, message, meta));
}

export function logInfo(context, message, meta = {}) {
  console.log(formatLog(LOG_LEVELS.INFO, context, message, meta));
}

export function logRequest(context, request, meta = {}) {
  const url = request?.url || 'unknown';
  const method = request?.method || 'unknown';
  logInfo(context, method + ' ' + url, { ...meta, method, url });
}
