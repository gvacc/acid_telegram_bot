const { Markup } = require('telegraf')

const getLanguageKeyboard = () => {
  const buttons = Markup.inlineKeyboard([
  	Markup.button.callback(`EN 🇺🇸`, JSON.stringify({ a: 'languageChange', p: 'en' })),
  	Markup.button.callback(`RU 🇷🇺`, JSON.stringify({ a: 'languageChange', p: 'ru' }))
  ])

  return buttons
}

module.exports = {getLanguageKeyboard}