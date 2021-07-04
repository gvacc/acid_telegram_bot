const logger = require('../../../util/logger')
const { updateLanguage } = require('../../../util/language')
const { getAdminKeyboard } = require('../../../util/keyboards')
const { getTemplateForGroup, getSettingsButtonsForGroup, getSettingsButtonsWelcomeMessages } = require('./helpers')
const Group = require('../../../model/Group')

const changeCaptchaSettings = async (ctx) => {
  logger.info('Админ меняет статус каптчи')
  const parsedJSON = JSON.parse(ctx.callbackQuery.data)
  const groupId = parsedJSON.d.split(':')[parsedJSON.d.split(':').length - 1]
  const captchaStatus = parsedJSON.d.split(':')[0] === 'on' ? true : false 

  const group = await Group.findOne({groupId})
  group.isCaptchaWork = captchaStatus
  await group.save()	    

  const groups = await Group.find({})

  await ctx.editMessageText(getTemplateForGroup(ctx, group), {...getSettingsButtonsForGroup(ctx, group, groups.length), parse_mode: 'html'})
  
  if(captchaStatus) {
  	await ctx.answerCbQuery(ctx.i18n.t('notify.captcha_enabled'));
  } else {
  	await ctx.answerCbQuery(ctx.i18n.t('notify.captcha_disabled'))
  }
}

const changeLanguageGroupSettings = async (ctx) => {
  logger.info('Админ меняет язык группы')
  const parsedJSON = JSON.parse(ctx.callbackQuery.data)
  const groupId = parsedJSON.d.split(':')[parsedJSON.d.split(':').length - 1]
  const language = parsedJSON.d.split(':')[0]

  const group = await Group.findOne({groupId})
  group.language = language
  await group.save()
  const groups = await Group.find({})
  await ctx.editMessageText(getTemplateForGroup(ctx, group), {...getSettingsButtonsForGroup(ctx, group, groups.length), parse_mode: 'html'})

  if(language == 'en') {
    await ctx.answerCbQuery(ctx.i18n.t('notify.language_changed') + '🇺🇸')
  } else {
    await ctx.answerCbQuery(ctx.i18n.t('notify.language_changed') + '🇷🇺')
  }
}

const changeTypeGroupSettings = async (ctx) => {
  logger.info('Админ меняет тип группы')
  const parsedJSON = JSON.parse(ctx.callbackQuery.data)
  const groupId = parsedJSON.d.split(':')[parsedJSON.d.split(':').length - 1]
  const type = parsedJSON.d.split(':')[0]
  const groups = await Group.find({})

  const group = await Group.findOne({groupId})
  group.groupType = type
  await group.save()
 
  await ctx.editMessageText(getTemplateForGroup(ctx, group), {...getSettingsButtonsForGroup(ctx, group, groups.length), parse_mode: 'html'})

  await ctx.answerCbQuery(ctx.i18n.t('notify.type_changed'))
}

const nextGroup = async (ctx) => {
  const groups = await Group.find({})

  if(isNaN(ctx.session.idxG)) {
    ctx.session.idxG = 0
  }

  ctx.session.idxG = ++ctx.session.idxG % groups.length

  const idx = ctx.session.idxG

  await ctx.editMessageText(getTemplateForGroup(ctx, groups[idx]), {...getSettingsButtonsForGroup(ctx, groups[idx], groups.length), parse_mode: 'html'})

  await ctx.answerCbQuery()

}

const seeWelcomeMessageSettings = async (ctx) => {
  logger.info('Админ зашел в настройки приветсвенного сообщения')
  await ctx.editMessageText(ctx.update.callback_query.message.text, {...getSettingsButtonsWelcomeMessages(ctx), entities: ctx.update.callback_query.message.entities})
}

const backToSettings = async (ctx) => {
  const groupId = JSON.parse(ctx.callbackQuery.data).g
  const group = await Group.findOne({groupId})
  const groups = await Group.find({})
  try {
    ctx.scene.leave()
  } catch(e){}
  await ctx.editMessageText(getTemplateForGroup(ctx, group), {...getSettingsButtonsForGroup(ctx, group, groups.length), parse_mode: 'html'})
  await ctx.answerCbQuery(ctx.i18n.t('notify.back_to_settings'))
}

module.exports = {changeCaptchaSettings, changeLanguageGroupSettings, changeTypeGroupSettings, nextGroup, seeWelcomeMessageSettings, backToSettings}