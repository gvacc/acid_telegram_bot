const ms = require('ms')
const logger = require('../../../util/logger')
const Group = require('../../../model/Group')
const User = require('../../../model/User')
const Button = require('../../../model/Button')
const {saveToSession} = require('../../../util/session')
const {sheduleDeleteMessage} = require('./helpers')

const dict = {
	"ru": {
		"captcha_not_for_you": "Это сообщение не для вас",
		"captcha_confirm": "Спасибо, что ознакомились!"
	}
}

const confirmNotRobot = async ctx => {
	try {
		logger.info('Потверждают что не робот')
		const originalId = JSON.parse(ctx.callbackQuery.data).d
		const clickedId = ctx.update.callback_query.from.id
		const messageId = ctx.update.callback_query.message.message_id
		const firstName = ctx.update.callback_query.from.first_name.substring(0, 15)
		if(originalId === clickedId) {

			//await ctx.answerCbQuery(dict['ru']['captcha_confirm']);
			await ctx.promoteChatMember(originalId)
			await ctx.deleteMessage(messageId)
			const sentConfirmMessage = await ctx.replyWithMarkdown(`[${firstName}](tg://user?id=${clickedId}), Спасибо что ознакомились, отправьте пожалуйста ваш номер телефона`)
			saveToSession(ctx, 'phoneScene', true)
			saveToSession(ctx, 'phoneSceneMessages', [sentConfirmMessage.message_id])
			
			await User.findOneAndUpdate(
			    { telegramId: clickedId },
			    { 
			    	isRulesReaded: true
			    },
			    { new: true }
			)

			sheduleDeleteMessage(ctx, sentConfirmMessage.message_id, ms('3m'))
		} else {
			await ctx.answerCbQuery(dict['ru']['captcha_not_for_you']);
		}
	} catch(e) {
		console.log('ERRROR', e)
		logger.error('Ошибка при потверждении робота', e)
	}
}

module.exports = {confirmNotRobot}