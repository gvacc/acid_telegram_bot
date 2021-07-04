const logger = require('../util/logger')

const isBotChat = async (ctx,next) => {
	if(ctx.update.message.chat.type === 'private') {
		logger.info('Это бот')
		return next()
	}
	logger.info('Это не бот')
}

module.exports = {isBotChat}