const Admin = require('../model/Admin')

const isAdmin = async (ctx) => {
  const candidate = await Admin.findOne({telegramId: ctx.from.id})

  if (!!candidate) return true
  return false
};

module.exports = {isAdmin}


