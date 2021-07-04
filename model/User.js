const {Schema, model, Types} = require('mongoose')

const schema = new Schema({
	telegramId: {type: Number, required: true, unique: true},
	created: {type: Date, default: Date.now},
	lastActivity: {type: Date, default: Date.now},
	language: {type: String, default: 'en'},
	fromGroup: {type: Boolean, required: true},
	isCaptchaSolved: {type: Boolean, default: false},
	isRulesReaded: {type: Boolean, default: false},
	captchaAnswer: {type: Number},
	captchaExample: {type: String},
	kickedCount: {type: Number, default: 0},
	messagesForDelete: {type: Array},
	incorrectAnswers: {type: Number, default: 0},
	phone: {type: String, default: ''}
})

module.exports = model('User', schema)