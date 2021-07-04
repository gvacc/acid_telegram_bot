const { Markup } = require('telegraf')

const sliceString = (text) => {
	let sliced = text.slice(0,30);
	if (sliced.length < text.length) sliced += '...';
	return sliced
}

const getLanguageKeyboard = () => {
  const buttons = Markup.inlineKeyboard([
  	Markup.button.callback(`US 🇺🇸`, JSON.stringify({ a: 'languageChange', p: 'en' })),
  	Markup.button.callback(`RU 🇷🇺`, JSON.stringify({ a: 'languageChange', p: 'ru' }))
  ])

  return buttons
}

const getSettingsButtonsForGroup = (ctx, group, groupsLength) => {

	const buttonsArray = [
		[Markup.button.callback(ctx.i18n.t('settings.groupSettings.welcome_message'), JSON.stringify({a: 'seeWelMessageSet', g: group.groupId}) )],
		[Markup.button.callback(ctx.i18n.t('settings.groupSettings.send_message_to_group'), JSON.stringify({a: 'sendMGroup', g: `${group.groupId}`}) )],
	]
	
	if(group.isCaptchaWork) {
		buttonsArray.push([Markup.button.callback(ctx.i18n.t('settings.groupSettings.captcha.disable_captcha'), JSON.stringify({a: 'changeCaptcha', d: `off:${group.groupId}`}) )])
	} else {
		buttonsArray.push([Markup.button.callback(ctx.i18n.t('settings.groupSettings.captcha.enable_captcha'), JSON.stringify({a: 'changeCaptcha', d: `on:${group.groupId}`}) )])
	}

	if(group.groupType === 'private') {
		buttonsArray.push([Markup.button.callback(ctx.i18n.t('settings.groupSettings.change_type'), JSON.stringify({a: 'changeType', d: `public:${group.groupId}`}))])
	} else {
		buttonsArray.push([Markup.button.callback(ctx.i18n.t('settings.groupSettings.change_type'), JSON.stringify({a: 'changeType', d: `private:${group.groupId}`}))])
	}

	if(groupsLength > 1) {
		if(isNaN(ctx.session.idxG)) ctx.session.idxG = 0 
		buttonsArray.push([Markup.button.callback(`${ctx.session.idxG + 1}/${groupsLength} ` + ctx.i18n.t('settings.groupSettings.next_group'), `next_group` )])
	}

	return Markup.inlineKeyboard(buttonsArray)
}


const getSettingsButtonsWelcomeMessages = (ctx) => {
	const groupId = JSON.parse(ctx.callbackQuery.data).g
	const buttons = Markup.inlineKeyboard([
		[Markup.button.callback(ctx.i18n.t('settings.welcomeMessageSettings.change_welcome_message'), JSON.stringify({a: 'chng_welc_msg', g: groupId }) )],
		[Markup.button.callback(ctx.i18n.t('settings.welcomeMessageSettings.see_welcome_messsage'), JSON.stringify({a: 'see_welc_msg', g: groupId }) )],
		[Markup.button.callback(ctx.i18n.t('settings.welcomeMessageSettings.add_delete_buttons'), JSON.stringify({a: 'add_del_button', g: groupId }) )],
		[Markup.button.callback(ctx.i18n.t('settings.back_to_settings'), JSON.stringify({a: 'back_to_settings', g: groupId }) )]
	])

	return buttons
}

const getTemplateForGroup = (ctx, group) => {
return `
${ctx.i18n.t('messagesText.groupInfo.name')}: <b>${sliceString(group.groupName)}</b>
${ctx.i18n.t('messagesText.groupInfo.username')}: <b>${group.groupUsername !== 'отсутсвует' ? '@' + group.groupUsername : ctx.i18n.t('other.missing') }</b>
${ctx.i18n.t('messagesText.groupInfo.type')}: <b>${group.groupType}</b>
${ctx.i18n.t('messagesText.groupInfo.captcha')}: ${group.isCaptchaWork ? '✅' : '❌'}
`
}

module.exports = {getTemplateForGroup, getSettingsButtonsForGroup, getSettingsButtonsWelcomeMessages}