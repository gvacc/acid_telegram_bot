const User = require('../model/User');

const getUserInfo = async (ctx, next) => {
  if(!ctx.session) ctx.session = {}
  
  const user = await User.findOne({telegramId: ctx.from.id});

  if (user) {
    ctx.session.language = user.language;
    ctx.i18n.locale(user.language);
  }

  return next();
};

const updateUserTimestamp = async (ctx, next) => {
	await User.findOneAndUpdate(
	    { telegramId: ctx.from.id },
	    { lastActivity: new Date().getTime() },
	    { new: true }
	);

	return next()
}

module.exports = {updateUserTimestamp, getUserInfo}