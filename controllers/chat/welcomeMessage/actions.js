const logger = require('../../../util/logger')

const Group = require('../../../model/Group')
const Button = require('../../../model/Button')
const { getAdminKeyboard } = require('../../../util/keyboards')
const { getButtons } = require('./helpers')

const { getAddDelInlineKeyboard } = require('./helpers')
const { getTemplateForGroup } = require('../admin/helpers')

const seeWelcomeMessage = async ctx => {
	logger.info('Нажали на посмотреть сообщение')
	const groupId = JSON.parse(ctx.callbackQuery.data).g

	const group = await Group.findOne({groupId})

	const buttons = await getButtons(groupId, ctx, true)
	
	await ctx.editMessageText(group.welcomeMessage, buttons)
}

const seeAddDelInlineKeyboard = async ctx => {
	console.log('Зашли в меню - добавить/удалить клавиатуру')
	const groupId = JSON.parse(ctx.callbackQuery.data).g
	const keyboard = await getAddDelInlineKeyboard(groupId, ctx)
	const group = await Group.findOne({groupId}) 

	await ctx.editMessageText(getTemplateForGroup(ctx, group), {...keyboard, parse_mode:'html'})
}


module.exports = {seeWelcomeMessage, seeAddDelInlineKeyboard}