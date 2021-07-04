const {Schema, model, Types} = require('mongoose')

const schema = new Schema({
	telegramId: {type: Number, required: true, unique: true},
})

module.exports = model('Admin', schema)