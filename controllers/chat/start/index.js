const logger = require('../../../util/logger')
const User = require('../../../model/User')
const {isAdmin} = require('../../../util/isAdmin')
const {getLanguageKeyboard} = require('./helpers')
const {languageChangeAction} = require('./actions')
const {getAdminKeyboard} = require('../../../util/keyboards')
const {getLanguage} = require('../../../util/language')

const start = async ctx => {
	logger.logCommand(ctx)
	const id = ctx.from.id
	const user = await User.findOne({telegramId: id})
	
	if (user) {
		logger.info(`Повторно нажали /start ${id}`) 
		await getLanguage(ctx)
		if(await isAdmin(ctx)) {
			await ctx.reply(ctx.i18n.t('scenes.admin.welcome_description'), getAdminKeyboard(ctx))
			return 
		} else {
			await ctx.reply(ctx.i18n.t('scenes.start.welcome_back'));
		}
	} else {
		const newUser = new User({
			telegramId: id,
			fromGroup: false
		})
		await newUser.save()
		logger.info(`Создали нового пользователя ${id}`)
		await ctx.reply('Choose language / Выберите язык', getLanguageKeyboard());
	}
}

const changeLanguage = async ctx => {
	logger.logCommand(ctx)
	await ctx.reply('Choose language / Выберите язык', getLanguageKeyboard());
}

module.exports = {start, languageChangeAction, changeLanguage}