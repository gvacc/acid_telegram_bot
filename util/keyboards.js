const { Markup } = require('telegraf')

const getAdminKeyboard = ctx => {
  const adminKeyboardStatistics = ctx.i18n.t('keyboards.admin_keyboard.statistics')
  const adminKeyboardGroups = ctx.i18n.t('keyboards.admin_keyboard.groups')
  const adminKeyboardSendMessage = ctx.i18n.t('keyboards.admin_keyboard.send_message')
  const adminKeyboardChangeLanguage = ctx.i18n.t('keyboards.admin_keyboard.change_language')

  const adminKeyboard = Markup.keyboard([
    [adminKeyboardGroups],
    [adminKeyboardChangeLanguage]
  ])

  return adminKeyboard
}

module.exports = {getAdminKeyboard}