const logger = require('../util/logger')

const isGroup = async (ctx,next) => {
	if(ctx.update.message.chat.type === 'group' || ctx.update.message.chat.type === 'supergroup') {
		if(!ctx.update.new_chat_member) {
			logger.info('Эта группа')
			return next()
		}
	}
}

module.exports = {isGroup}