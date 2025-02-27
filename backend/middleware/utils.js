export function wrapControllerWithTryCatch(fn) {
  return async function (req, res, next) {
    try {
      await fn(req, res, next);
    } catch (error) {
      console.log(`Error in ${fn.name} function: `, error.message);
      next(error);
    }
  };
}
