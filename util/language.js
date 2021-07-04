const User = require('../model/User')
const logger = require('./logger')

const { saveToSession } = require('./session')

const updateLanguage = async (ctx, newLang) => {
  logger.info(`Обновление языка ${newLang}`);

  await User.findOneAndUpdate(
    { telegramId: ctx.from.id },
    {
      language: newLang
    },
    { new: true }
  );

  saveToSession(ctx, 'language', newLang);
  ctx.i18n.locale(newLang);
}

const getLanguage = async (ctx) => {
  logger.info('Получаем язык')

  const user = await User.findOne({telegramId: ctx.from.id})
  
  saveToSession(ctx, 'language', user.language)
  ctx.i18n.locale(user.language)
}

module.exports = {updateLanguage, getLanguage}

