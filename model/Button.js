const {Schema, model, Types} = require('mongoose')

const schema = new Schema({
	text: { type: String },
	url: { type: String },
	groupId: {type: Number, ref: 'Group'},
})

module.exports = model('Button', schema)