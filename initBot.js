const {Telegraf} = require('telegraf')

const initBot = () => {
	if (process.env.BOT_TOKEN === undefined) {
  		throw new TypeError('УКАЖИТЕ ВАЛИДНЫЙ BOT_TOKEN')
	}
	return new Telegraf(process.env.BOT_TOKEN)
}

module.exports = initBot


