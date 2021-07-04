const logger = require('./logger')

const asyncWrapper = (fn) => {
  return async function(ctx, next) {
    try {
      return await fn(ctx);
    } catch (error) {
      logger.error(`Произошла ошибка ${error}`);
      //await ctx.reply('Произошла ошибка, попробуйте снова...');
      return next()
    }
  }
}

module.exports = asyncWrapper