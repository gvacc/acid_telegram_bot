require('dotenv').config()
const path = require('path')

const initBot = require('./initBot')
const {session, Scenes: {Stage}, Markup} = require('telegraf')
const mongoose = require('mongoose')
const TelegrafI18n = require('telegraf-i18n')
const { match } = require('telegraf-i18n')
const LocalSession = require('telegraf-session-local')
//Подключение utils
const logger = require('./util/logger')
const asyncWrapper = require('./util/asyncWrapper')

//Контроллеры
const {start, languageChangeAction, changeLanguage} = require('./controllers/chat/start')
const {newMember, newTitle, newMessage} = require('./controllers/group/groupActions')
const {getGroups, sendMessageToGroupScena} = require('./controllers/chat/admin')

const {changeCaptchaSettings, changeLanguageGroupSettings, changeTypeGroupSettings,  nextGroup, seeWelcomeMessageSettings, backToSettings} = require('./controllers/chat/admin/actions')
const {seeWelcomeMessage, seeAddDelInlineKeyboard} = require('./controllers/chat/welcomeMessage/actions')
const {addButtonScena, addTextScena, changeWelcomeMessageScena, sendDeleteButton, deleteButton} = require('./controllers/chat/welcomeMessage/')
const {confirmNotRobot} = require('./controllers/group/groupActions/actions')

//Middleware
const {getUserInfo} = require('./middleware/user')
const {isAdmin, isActionAdmin} = require('./middleware/admin')
const {isBotChat} = require('./middleware/isbotchat')
const {isGroup} = require('./middleware/isgroup')

const bot = initBot()

mongoose.connect(process.env.MONGO_URI, {
   useNewUrlParser: true,
   useFindAndModify: false,
   useCreateIndex: true,
   useUnifiedTopology: true
})

mongoose.connection.on('error', err => {
	logger.fatal(`Ошибка подключения к дб ${err}`)
	process.exit(1)
})

mongoose.connection.on('open', () => {
  	const i18n = new TelegrafI18n({
  	    defaultLanguage: 'ru',
  	    directory: path.resolve(__dirname, 'locales'),
  	    useSession: true,
  	    allowMissing: false,
  	    sessionName: 'session'
  	})
	
    const stage = new Stage([
      addButtonScena,
      addTextScena,
      changeWelcomeMessageScena,
      sendMessageToGroupScena
    ])
    stage.hears(match('settings.back_to_settings'), ctx => ctx.scene.leave())

    //bot.use(session())
    bot.use((new LocalSession({ database: 'users.json' })).middleware())
  	bot.use(i18n.middleware());
    bot.use(stage.middleware());
  	bot.use(getUserInfo)

    bot.on('new_chat_member', asyncWrapper(newMember))
  	bot.on('new_chat_title', asyncWrapper(newTitle))
    bot.on('left_chat_member', ctx => logger.info('Вышли с группы'))

  	bot.action(/languageChange/, languageChangeAction);
    bot.action(/back_to_settings/, isActionAdmin, backToSettings)
  	
  	bot.action(/seeWelMessageSet/, isActionAdmin, seeWelcomeMessageSettings)
  	bot.action(/changeCaptcha/, isActionAdmin, changeCaptchaSettings)
  	bot.action(/changeGLanguage/, isActionAdmin, changeLanguageGroupSettings)
    bot.action(/changeType/, isActionAdmin, changeTypeGroupSettings)
    bot.action(/sendMGroup/, isActionAdmin, asyncWrapper(async ctx => ctx.scene.enter('sendMessageToGroupScena')))
  	bot.action(/next_group/, isActionAdmin, nextGroup)

    bot.action(/see_welc_msg/, isActionAdmin, seeWelcomeMessage)
    bot.action(/add_del_button/, isActionAdmin, seeAddDelInlineKeyboard)
    bot.action(/chng_welc_msg/, isActionAdmin, asyncWrapper(async ctx => ctx.scene.enter('changeWelcomeMessageScena')) )

    bot.action(/add_button/, isActionAdmin, asyncWrapper(async ctx => ctx.scene.enter('addButtonScena')))
    bot.action(/del_button/, isActionAdmin, asyncWrapper(sendDeleteButton))

    bot.action(/dl_btn/, isActionAdmin, asyncWrapper(deleteButton))

    bot.action(/cfNR/, confirmNotRobot)

    //admin routes
  	bot.hears(
	    match('keyboards.admin_keyboard.groups'),
      isBotChat,
	    isAdmin,
	    asyncWrapper(getGroups)
  	)
    bot.hears(
      match('keyboards.admin_keyboard.change_language'),
      isBotChat,
      asyncWrapper(changeLanguage)
    )
  	
    bot.start(isBotChat, asyncWrapper(start))
    bot.on('message', isGroup, asyncWrapper(newMessage))

	bot.catch(error => logger.error(`Глобальная ошибка метода bot ${error}`))
	bot.launch()
})


//при нажатии комбинаций клавиш, завершает работа бота
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM')) 