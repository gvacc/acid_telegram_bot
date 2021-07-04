const log4js = require('log4js');
log4js.configure({
	appenders: {
		console: {
			type: 'console',
			layout: {
                type: 'pattern',
                pattern: '%[[%d{yyyy-MM-dd hh:mm:ss}] [%p] %c -%] %m',
            },
		},
		hatiHelper: {type: 'file', filename: './logs/hatiHelper.log' }
	},
	categories: {
		hatiHelper: {appenders: ['console', 'hatiHelper'], level: 'trace'},
		default: { appenders: ['console', 'hatiHelper'], level: 'trace' }
	}
})

const prepareMessage = (ctx) => {
	if (ctx && ctx.from) {
		const id = !!ctx.from.id ? `id:${ctx.from.id}` : ''
		const username = !!ctx.from.username ? `/@${ctx.from.username}` : ''
		return `Получена команда "${ctx.message.text}" от ${id}${username}`
	}

	return `Контекст был пустой, не удалось распознать отправителя | ${ctx.message.text} ${ctx}`
}

const logger = log4js.getLogger('hatiHelper')

logger.logCommand = function(ctx) {
	this.info(prepareMessage(ctx))
}

module.exports = logger