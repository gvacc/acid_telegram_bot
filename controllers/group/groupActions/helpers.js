const logger = require('../../../util/logger')
const {saveToSession, deleteFromSession} = require('../../../util/session')

const getTemplateForWelcomeMessage = (message, first_name, last_name, telegramId) => {
	return message.replace('{name}', first_name).replace('{fullname}', `${first_name} ${last_name}`).replace('{userId}', `<a href="tg://user?id=${telegramId}">${first_name.substring(0, 15)}</a>`)
}

const getTemplateForSavedNumber = (ctx) => {
return `
<code>Отправлен номер телефона:</code>
Имя: <b>${ctx.update.message.from.first_name} ${ctx.update.message.from.last_name ? ctx.update.message.from.last_name : '' }</b>
Юзернейм: <b>${ctx.update.message.from.username ? '@' + ctx.update.message.from.username : 'Отсутсвует'}</b>
Номер телефона: <b>${ctx.update.message.text}</b>
`
}

const generateCaptcha = () => {
	const getRandomInt = (min, max) => {
	  min = Math.ceil(min);
	  max = Math.floor(max);
	  return Math.floor(Math.random() * (max - min)) + min; 
	}

	const type = {
		0: '-',
		1: '+'
	}
	const action = type[getRandomInt(0,2)]

	let n1 = null
	let n2 = null
	let answer = null
	let example = ''

	if(action === '-') {
		n1 = getRandomInt(20, 30)
		n2 = getRandomInt(1, 19)
		answer = n1 - n2
		example = `${n1}-${n2}`
	} else {
		const n1 = getRandomInt(1, 20)
		const n2 = getRandomInt(1, 20)
		answer = n1 + n2
		example = `${n1}+${n2}`
	}

	return {answer, example}
}

const sheduleDeleteMessage = (ctx, msgId, ms, type='welcome message') => {
	setTimeout(async () => {
			try{
				await ctx.deleteMessage(msgId)
				logger.info(`Удалили сообщения ${type}`)
			}catch(e) {
				logger.info(`Сообщение не удалилось, видимо уже было удалено ${type}`)
			}
	}, ms)
}

const deleteAllMessages = async (ctx, messagesId, sessionField) => {
	messagesId = messagesId.forEach(async id => {
		try {
			if(!!id) {
				await ctx.deleteMessage(id)
				logger.info(`Удалили мусорное сообщение ${messagesId}`)
			}
		}catch(e){
			logger.info(`Сообщение для удаления не нашлось, скорее уже было удалено ${id}`)
		}
	})
	deleteFromSession(ctx, sessionField)

	return messagesId
}

const sheduleUnban = async (ctx, id, ms) => {
	try {
		setTimeout(async () => {
			await ctx.unbanChatMember(id)
			logger.info(`Разбанили пользователя ${id}`)
		}, ms)
	}catch(e) {
		logger.info('Пользователь для разбана не обнаружен')
	}
}

const kickUser = async (ctx, user) => {
	try {
		user.kickedCount += 1
		user.incorrectAnswers = 0
		await ctx.kickChatMember(user.telegramId)
		await user.save() 
	} catch(e){
		logger.info('Пользователь для кика не обнаружен')
	}
}


module.exports = {getTemplateForWelcomeMessage,getTemplateForSavedNumber,  generateCaptcha, sheduleDeleteMessage, deleteAllMessages, sheduleUnban, kickUser}