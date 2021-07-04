const logger = require('./logger')

const saveToSession = (ctx, field, data) => {
  if(!ctx.session) ctx.session = {}
  logger.info(`Сохранение ${field} в сессию`);
  ctx.session[field] = data;
}

const deleteFromSession = (ctx, field) => {
  logger.info(`Удаление ${field} из сессии`);
  delete ctx.session[field];
}

module.exports = {saveToSession, deleteFromSession}