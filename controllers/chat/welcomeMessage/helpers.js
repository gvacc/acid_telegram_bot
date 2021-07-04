const { Markup } = require('telegraf')
const Button = require('../../../model/Button')
const Group = require('../../../model/Group')

const getButtons = async (groupId, ctx, forGroup=false, member_id) => {
	const fetchButtons = await Button.find({groupId})
	
	let countRow = Math.ceil(fetchButtons.length / 3)
	let buttonsArray = []

	for(let row = 0; row < countRow; row++) {
		buttonsArray.push([])
	}

	row = 0 

	fetchButtons.forEach((b, idx) => {
		if(idx !== 0 && idx % 3 === 0) row++
		
		buttonsArray[row].push(Markup.button.url(b.text, b.url))
	})

	if(member_id) {
		buttonsArray.push([Markup.button.callback('Ознакомился', JSON.stringify({a: "cfNR", d: member_id, l: 'ru'}))])  
	}

	if(forGroup) {
		buttonsArray.push([Markup.button.callback(ctx.i18n.t('notify.back_to_settings'), JSON.stringify({a: 'back_to_settings', g: groupId }) )])
	}

	return Markup.inlineKeyboard(buttonsArray)
}

const getAddDelInlineKeyboard = async (groupId, ctx) => {
	const fetchButtons = await Button.find({groupId})
	const group = await Group.findOne({groupId})

	return Markup.inlineKeyboard([
		[Markup.button.callback(ctx.i18n.t('scenes.buttonsInlineMenu.add_button'), JSON.stringify({a: 'add_button', g: groupId })    )],
		[Markup.button.callback(ctx.i18n.t('scenes.buttonsInlineMenu.delete_button'), JSON.stringify({a: 'del_button', g: groupId })     )],
		[Markup.button.callback(ctx.i18n.t('notify.back_to_settings'), JSON.stringify({a: 'back_to_settings', g: groupId }) )],
	])
}

module.exports = {getButtons, getAddDelInlineKeyboard}
