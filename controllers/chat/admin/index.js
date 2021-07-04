const { Telegraf, Markup, Scenes: {BaseScene, Stage} } = require('telegraf')

const logger = require('../../../util/logger')
const User = require('../../../model/User')
const Group = require('../../../model/Group')

const { getAdminKeyboard } = require('../../../util/keyboards')

const { getTemplateForGroup, getSettingsButtonsForGroup } = require('./helpers')

const telegram = require('../../../telegram')

const getGroups = async ctx => {
	console.log('Получают все группы')
	const groups = await Group.find({})
	if(!groups.length) {
		await ctx.reply(ctx.i18n.t('scenes.admin.groups.groupsIsEmpty'), getAdminKeyboard(ctx))
	} else {
		ctx.session.idxG = 0 
		await ctx.reply(getTemplateForGroup(ctx, groups[0]), {...getSettingsButtonsForGroup(ctx, groups[0], groups.length), parse_mode: 'html'})
	}
}

const sendMessageToGroupScena = new BaseScene('sendMessageToGroupScena')
sendMessageToGroupScena.enter(async ctx => {
	const groupId = JSON.parse(ctx.callbackQuery.data).g
	ctx.session.groupId = +groupId
	console.log(groupId)
	const buttons = Markup.inlineKeyboard([
		[Markup.button.callback(ctx.i18n.t('settings.back_to_settings'), JSON.stringify({a: 'back_to_settings', g: groupId }) )]
	])
	await ctx.deleteMessage()
	await ctx.reply(ctx.i18n.t('scenes.sendMessageToGroup.input_message'), buttons )
})
sendMessageToGroupScena.on('text', async ctx => {
	try {
		await telegram.sendMessage(ctx.session.groupId, ctx.message.text)
		await ctx.reply(ctx.i18n.t('notify.group_message_sent'));
	}catch(e) {
		await ctx.reply(ctx.i18n.t('notify.group_is_not_valid'));
		ctx.scene.leave()
	}
	ctx.scene.leave()
})

sendMessageToGroupScena.leave(async ctx => {})

module.exports = {getGroups, sendMessageToGroupScena}
