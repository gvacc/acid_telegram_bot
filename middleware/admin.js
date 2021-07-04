const logger = require('../util/logger')
const Admin = require('../model/Admin')

const isAdmin = async (ctx, next) => {
  const candidate = await Admin.findOne({telegramId: ctx.from.id})

  if (!!candidate) {
    logger.info('Админ валидный')
    return next()
  }
  
  logger.info(`Попытка доступа к админ панеле id:${ctx.from.id}${ctx.from.username ? '/@' + ctx.from.username :''}`)
  return ctx.reply('Вы ведь вкурсе что вы не админ ?');
};

const isActionAdmin = async (ctx, next) => {
	const candidate = await Admin.findOne({telegramId: ctx.update.callback_query.from.id})

	if(!!candidate) return next()
	logger.info(`Попытка не санкционированной отправки actions) id:${ctx.from.id}${ctx.from.username ? '/@' + ctx.from.username :''}`)
}

module.exports = {isAdmin, isActionAdmin}

