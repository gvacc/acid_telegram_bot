const {Markup} = require('telegraf')
const ms = require('ms')
const telegram = require('../../../telegram')
const logger = require('../../../util/logger')
const Group = require('../../../model/Group')
const User = require('../../../model/User')
const Admin = require('../../../model/Admin')
const {getButtons} = require('../../chat/welcomeMessage/helpers')
const {getTemplateForWelcomeMessage, getTemplateForSend, generateCaptcha, sheduleDeleteMessage, deleteAllMessages, sheduleUnban, kickUser} = require('./helpers')
const {saveToSession, deleteFromSession} = require('../../../util/session')

const newMember = async ctx => {
	logger.info('Новый участник')
	if(!!ctx.update.message.new_chat_member.is_bot && ctx.update.message.new_chat_member.id === ctx.botInfo.id) {
		logger.info('Добавили нашего бота')
		const candidateGroup = await Group.findOne({groupId: ctx.message.chat.id})
		if(!!candidateGroup) {
			logger.info('Такой бот уже есть в базе данных, пропускаем...')
			return
		}
		const group = new Group({
			groupId:  ctx.message.chat.id,
			groupName: ctx.message.chat.title,
			groupUsername: ctx.message.chat.username || 'отсутсвует',
			isCaptchaWork: true
		})

		await group.save()
		logger.info('Добавили группу в базу данных')
	} else {
		const inviter = ctx.update.message.from.id

		const telegramId = ctx.update.message.new_chat_member.id 
		const messageId = ctx.update.message.message_id
		
		const first_name = ctx.update.message.new_chat_member.first_name
		const last_name = !!ctx.update.message.new_chat_member.last_name ? ctx.update.message.new_chat_member.last_name : ''

		const groupId = ctx.update.message.chat.id
		const group = await Group.findOne({groupId})

		let user = await User.findOne({telegramId: telegramId})
		let captcha = null 
		
		if(!user) {
			captcha = generateCaptcha()
			user = new User({
				telegramId,
				fromGroup: true,
				captchaAnswer: captcha.answer,
				captchaExample: captcha.example
			})
			await user.save()
			logger.info(`${telegramId} сохранен в бд`)
		} else {
			logger.info(`Пользователь есть в бд`)
		}

		const welcomeMessage = getTemplateForWelcomeMessage(group.welcomeMessage, first_name, last_name, telegramId)

		if(group.groupType === 'public') {
			const buttons = await getButtons(groupId, ctx)
			const sentWelcomeMessage = await ctx.replyWithHTML(welcomeMessage, {...buttons, reply_to_message_id: messageId })
			sheduleDeleteMessage(ctx, sentWelcomeMessage.message_id, ms('30s'))

			if(group.isCaptchaWork && !user.isCaptchaSolved) { 
					if(inviter === telegramId) {
						const sentCaptchaMessage = await ctx.replyWithHTML(`Потвердите, что вы не робот🤖\nОтправьте в группу ответ на пример: <code>${user.captchaExample}</code>`, {reply_to_message_id: messageId})
						saveToSession(ctx, 'captchaScene', true)
						saveToSession(ctx, 'captchaSceneMessages', [sentCaptchaMessage.message_id, sentWelcomeMessage.message_id])
						setTimeout(async () => {
							try {
								const user = await User.findOne({telegramId: telegramId})
								if(!user.isCaptchaSolved) {
									await kickUser(ctx, user)
									logger.info(`Кикнули пользователя ${user.telegramId}, не решившего каптчу`)

									if(user.kickedCount >= 3) {
										logger.info(`Пользователь ${user.telegramId} был кикнут много раз (${user.kickedCount}, кикаем навсегда`)
									} else {
										logger.info(`Пользователь ${user.telegramId} был кикнут, (количесто раз: ${user.kickedCount}`)
										sheduleUnban(ctx, user.telegramId, ms('2s'))
									}
								} else {
									logger.info(`Пользователь ${ user.telegramId } решил каптчу, не кикаем.`)
								}

								await deleteAllMessages(ctx, ctx.session.captchaSceneMessages, 'captchaSceneMessages')
							} catch(e) {
								logger.error('Ошибка в сборщике каптчи')
							}
						}, ms('1m'))
					} else {}
			}
		} else {
			if(!user.isRulesReaded) {
				await ctx.restrictChatMember(telegramId)
				const buttons = await getButtons(groupId, ctx, false, telegramId)
				const sentWelcomeMessage = await ctx.replyWithHTML(welcomeMessage, {...buttons, reply_to_message_id: messageId})
				sheduleDeleteMessage(ctx, sentWelcomeMessage.message_id, ms('5m'))
			}
		}
	}
}

const newMessage = async ctx => {
	try {
		const telegramId = ctx.update.message.from.id
		const messageId = ctx.update.message.message_id
		const messageText = ctx.update.message.text
		const groupId = ctx.update.message.chat.id

		if(ctx.session) {
			if(ctx.session.captchaScene) {
				const group = await Group.findOne({groupId})

				if(group.groupType === 'public') {
					const user = await User.findOne({telegramId})
					if(!user.isCaptchaSolved) {
						saveToSession(ctx, 'captchaSceneMessages', [...ctx.session.captchaSceneMessages, messageId])
						if(!isNaN(messageText)) {
							if(+messageText === user.captchaAnswer) {
								logger.info(`Пользователь ${telegramId} ответил правильно на каптчу, верефицируем.`)
								user.isCaptchaSolved = true
								user.save()
								deleteFromSession(ctx, 'captchaScene')

								const sentConfirmMessage = await ctx.reply('Вы успешно решили каптчу!', {reply_to_message_id: messageId })
								saveToSession(ctx, 'captchaSceneMessages', [...ctx.session.captchaSceneMessages, sentConfirmMessage.message_id])
								
								setTimeout(async () => {
									await deleteAllMessages(ctx, ctx.session.captchaSceneMessages, 'captchaSceneMessages')
								}, ms('2s'))
							} else {
								logger.info(`Пользователь ${telegramId} ответил не правильно на каптчу`)
								if(user.incorrectAnswers >= 2) {
									await kickUser(user)
									logger.info(`Кикнули пользователя ${user.telegramId}, не решившего каптчу за количество попыток: ${user.incorrectAnswers}`)
									
									if(user.kickedCount >= 3) {
										logger.info(`Пользователь ${user.telegramId} много раз накосячил, бан!`)
									} else {
										sheduleUnban(ctx, user.telegramId, ms('2s'))
									}
									
									await deleteAllMessages(ctx, ctx.session.captchaSceneMessages, 'captchaSceneMessages')
								} else {
									const captcha = generateCaptcha()

									user.captchaAnswer = captcha.answer
									user.captchaExample = captcha.example
									user.incorrectAnswers += 1
									await user.save()

									const sentIncorrectMessage = await ctx.replyWithHTML(`Вы ответили не верно! Попробуйте еще раз: <code>${captcha.example}</code>` , {reply_to_message_id: messageId})
									saveToSession(ctx, 'captchaSceneMessages', [...ctx.session.captchaSceneMessages, sentIncorrectMessage.message_id])
								}	
							}
						} else {
							logger.info(`Пользователь ${telegramId} написал в группу и не решил каптчу, удаляем сообщение`)
							try {
								await ctx.deleteMessage(messageId)
							} catch(e) {
								logger.info('Сообщения для удаления не нашлось')
							}
						}
					}
				}
			}

			if(ctx.session.phoneScene) {
				const firstName = ctx.update.message.from.first_name.substring(0, 15)
				const group = await Group.findOne({groupId})
				if(group.groupType === 'private') {
					if(messageText.match(/^(\s*)?(\+)?([- _():=+]?\d[- _():=+]?){10,14}(\s*)?$/)) {
						saveToSession(ctx, 'phoneSceneMessages', [...ctx.session.phoneSceneMessages, messageId])
						await deleteAllMessages(ctx, ctx.session.phoneSceneMessages, 'phoneSceneMessages')
						await User.findOneAndUpdate(
						    { telegramId },
						    { phone: messageText },
						    { new: true }
						)

						deleteFromSession(ctx, 'phoneScene')
						saveToSession(ctx, 'phone', messageText)


						const sentPhoneConfirmMessage = await ctx.replyWithMarkdown(`[${firstName}](tg://user?id=${telegramId}), Спасибо, номер сохранен!\nОсталось отправить вашу почту!`)
						sheduleDeleteMessage(ctx, sentPhoneConfirmMessage.message_id, ms('2m'))
						
						saveToSession(ctx, 'mailScene', true)
						saveToSession(ctx, 'mailSceneMessages', [])
						saveToSession(ctx, 'mailSceneMessages', [sentPhoneConfirmMessage.message_id])
					} else {
						const sentPhoneNotConfirmMessage = await ctx.replyWithMarkdown(`[${firstName}](tg://user?id=${telegramId}), Вы указали некорректный номер, попробуйте еще раз`, {reply_to_message_id: messageId})
						saveToSession(ctx, 'phoneSceneMessages', [...ctx.session.phoneSceneMessages, sentPhoneNotConfirmMessage.message_id, messageId])
						sheduleDeleteMessage(ctx, sentPhoneNotConfirmMessage.message_id, ms('2m'))
						sheduleDeleteMessage(ctx, messageId, ms('2m'))
					}
				}
			} else if(ctx.session.mailScene) {
				const firstName = ctx.update.message.from.first_name.substring(0, 15)
				const group = await Group.findOne({groupId})
				if(group.groupType === 'private') {
					if(messageText.match(/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/)) {
						saveToSession(ctx, 'mailSceneMessages', [...ctx.session.mailSceneMessages, messageId])
						await deleteAllMessages(ctx, ctx.session.mailSceneMessages, 'mailSceneMessages')
						await User.findOneAndUpdate(
						    { telegramId },
						    { mail: messageText },
						    { new: true }
						)
						deleteFromSession(ctx, 'mailScene')

						const sentMailConfirmMessage = await ctx.replyWithMarkdown(`[${firstName}](tg://user?id=${telegramId}), Спасибо, почта сохранена!\n`)
						sheduleDeleteMessage(ctx, sentMailConfirmMessage.message_id, ms('3s'))
						try{
                            await telegram.sendMessage(1049739112, getTemplateForSend(ctx), {parse_mode: 'html'})
                            await telegram.sendMessage(685876340, getTemplateForSend(ctx), {parse_mode: 'html'})
                       	} catch(e) {
                            logger.info(`Не удалось отправить номер администратору ${e}`)
                       	}
					} else {
						const sentMailNotConfirmMessage = await ctx.replyWithMarkdown(`[${firstName}](tg://user?id=${telegramId}), Вы указали некорректную почту, попробуйте еще раз`, {reply_to_message_id: messageId})
						sheduleDeleteMessage(ctx, sentMailNotConfirmMessage.message_id, ms('2m'))
						sheduleDeleteMessage(ctx, messageId, ms('2m'))
						saveToSession(ctx, 'mailSceneMessages', [...ctx.session.mailSceneMessages, sentMailNotConfirmMessage.message_id, messageId])
					}
				}
			}
		} 
	}catch(e) {
	 	logger.error('Ошибка при получении нового сообщения', e)
	}		
}

const newTitle = async ctx => {
	logger.info('Сменилось название группы')
	await Group.findOneAndUpdate(
	    { groupId: ctx.message.chat.id },
	    { groupName: ctx.message.new_chat_title },
	    { new: true }
	);
}

module.exports = {newMember, newTitle, newMessage}