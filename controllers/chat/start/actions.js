const { updateLanguage } = require('../../../util/language')
const { isAdmin } = require('../../../util/isAdmin')
const { getAdminKeyboard } = require('../../../util/keyboards')

const languageChangeAction = async (ctx) => {
  console.log('Меняют язык')
  const langData = JSON.parse(ctx.callbackQuery.data);
  await updateLanguage(ctx, langData.p);
  if(await isAdmin(ctx)) {
  	await ctx.deleteMessage()
  	await ctx.reply(ctx.i18n.t('scenes.admin.welcome_description'), getAdminKeyboard(ctx))
  } else {
  	await ctx.editMessageText(ctx.i18n.t('scenes.start.bot_description'))
  }
  await ctx.answerCbQuery();
};

module.exports = {languageChangeAction}