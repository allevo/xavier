'use strict';

var log4js = require('log4js');

var logger = log4js.getLogger();

module.exports = {
  trace: logger.trace.bind(logger),
  debug: logger.debug.bind(logger),
  info: logger.info.bind(logger),
  warn: logger.warn.bind(logger),
  error: logger.error.bind(logger),
  fatal: logger.fatal.bind(logger),
  setLevel : logger.setLevel.bind(logger),
};
