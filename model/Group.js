const {Schema, model, Types} = require('mongoose')

const schema = new Schema({
	groupId: {type: Number, required: true, unique: true},
	groupName: {type: String},
	groupType: {type: String, default: 'private'},
	groupUsername: {type: String},
	isCaptchaWork: {type: Boolean, default: true},
	language: {type: 'String', default:'en'},
	welcomeMessage: {type: 'String', default:'Hello. Welcome!!!'},
	buttons: [
		{type: Number, ref: 'Button'}
	],
})

module.exports = model('Group', schema)