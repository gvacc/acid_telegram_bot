const { Telegraf, Markup, Scenes: {BaseScene, Stage} } = require('telegraf')
const {getAddDelInlineKeyboard} = require('./helpers')
const { getTemplateForGroup, getSettingsButtonsForGroup } = require('../admin/helpers')
const Group = require('../../../model/Group')
const Button = require('../../../model/Button')

const addButtonScena = new BaseScene('addButtonScena')
const addTextScena = new BaseScene('addTextScena')
const changeWelcomeMessageScena = new BaseScene('changeWelcomeMessageScena')

addButtonScena.enter(async ctx => {
	const groupId = JSON.parse(ctx.callbackQuery.data).g
	ctx.session.groupId = +groupId
	const buttons = Markup.inlineKeyboard([
		[Markup.button.callback(ctx.i18n.t('settings.back_to_settings'), JSON.stringify({a: 'back_to_settings', g: groupId }) )]
	])
	await ctx.deleteMessage()
	await ctx.reply(ctx.i18n.t('scenes.addButton.enter_url'), buttons )
})

addTextScena.enter(async ctx => {
	const buttons = Markup.inlineKeyboard([
		[Markup.button.callback(ctx.i18n.t('settings.back_to_settings'), JSON.stringify({a: 'back_to_settings', g: ctx.session.groupId }) )]
	])
	ctx.reply(ctx.i18n.t('scenes.addButton.enter_name'))
})

changeWelcomeMessageScena.enter(async ctx => {
	const groupId = JSON.parse(ctx.callbackQuery.data).g
	ctx.session.groupId = +groupId

	const buttons = Markup.inlineKeyboard([
		[Markup.button.callback(ctx.i18n.t('settings.back_to_settings'), JSON.stringify({a: 'back_to_settings', g: groupId }) )]
	])
	await ctx.deleteMessage()
	await ctx.reply(ctx.i18n.t('scenes.changeWelcomeMessage.input_message'), {...buttons, parse_mode:'html'})
})


addButtonScena.on('text', async ctx => {
	const re = /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/

	const buttons = Markup.inlineKeyboard([
		[Markup.button.callback(ctx.i18n.t('settings.back_to_settings'), JSON.stringify({a: 'back_to_settings', g: ctx.session.groupId }) )]
	])

	if(ctx.message.text.match(re)) {
		ctx.session.enteredUrl = ctx.message.text
		ctx.scene.enter('addTextScena')
	} else {
		ctx.reply(ctx.i18n.t('scenes.addButton.not_valid_url'), buttons)
	}
})

addTextScena.on('text', async ctx => {
	ctx.session.enteredText = ctx.message.text
	const button = new Button({
		groupId: ctx.session.groupId,
		url: ctx.session.enteredUrl,
		text: ctx.session.enteredText
	})
	await button.save()
	ctx.scene.leave()
})

changeWelcomeMessageScena.on('text', async ctx => {
	await Group.findOneAndUpdate(
	    { groupId: ctx.session.groupId },
	    { welcomeMessage: ctx.message.text },
	    { new: true }
	);

	const group = await Group.findOne({groupId: ctx.session.groupId})
	const groups = await Group.find({})
	ctx.session.groupId = null
	await ctx.reply(ctx.i18n.t('scenes.addButton.saved'))
	await ctx.reply(getTemplateForGroup(ctx, group), {...getSettingsButtonsForGroup(ctx, group, groups.length), parse_mode: 'html'})
	ctx.scene.leave()
})

addButtonScena.leave(async ctx => {})
addTextScena.leave(async ctx => {
	const group = await Group.findOne({groupId: ctx.session.groupId})
	const groups = await Group.find({})
	ctx.session.enteredUrl = ctx.session.enteredUrl = ctx.session.groupId = null
	await ctx.reply(ctx.i18n.t('scenes.addButton.saved'))
	await ctx.reply(getTemplateForGroup(ctx, group), {...getSettingsButtonsForGroup(ctx, group, groups.length), parse_mode: 'html'})
})

changeWelcomeMessageScena.leave(async ctx => {
	
})

const sendDeleteButton = async ctx => {
	const groupId = JSON.parse(ctx.callbackQuery.data).g
	let buttons = await Button.find({groupId})
	buttons = buttons.map((b, idx, array) => {
		return [Markup.button.callback(b.text, JSON.stringify({a: 'dl_btn', d: b._id }) )]
	})
	const keyboard = Markup.inlineKeyboard([
		...buttons,
		[Markup.button.callback(ctx.i18n.t('settings.back_to_settings'), JSON.stringify({a: 'back_to_settings', g: groupId }) )]

	])
	ctx.editMessageText(ctx.i18n.t('scenes.removeButton.which_delete'), keyboard)
}

const deleteButton = async ctx => {
	const buttonId = JSON.parse(ctx.callbackQuery.data).d
	let reply_markup = ctx.update.callback_query.message.reply_markup.inline_keyboard
	
	await Button.findByIdAndRemove(buttonId)

	reply_markup = reply_markup.filter(b => {
		if(JSON.parse(b[0].callback_data).d != buttonId) return b
	})

	ctx.editMessageText(ctx.i18n.t('scenes.removeButton.which_delete'), Markup.inlineKeyboard(reply_markup))
	ctx.answerCbQuery(ctx.i18n.t('scenes.removeButton.deleted'))
}

module.exports = {addButtonScena, addTextScena, sendDeleteButton, deleteButton, changeWelcomeMessageScena}