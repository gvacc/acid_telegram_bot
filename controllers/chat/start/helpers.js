const { Markup } = require('telegraf')

const getLanguageKeyboard = () => {
  const buttons = Markup.inlineKeyboard([
  	Markup.button.callback(`EN πΊπΈ`, JSON.stringify({ a: 'languageChange', p: 'en' })),
  	Markup.button.callback(`RU π·πΊ`, JSON.stringify({ a: 'languageChange', p: 'ru' }))
  ])

  return buttons
}

module.exports = {getLanguageKeyboard}