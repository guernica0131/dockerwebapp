/**
 * sessionAuth
 *
 * @module      :: Policy
 * @description :: Simple policy to a registered user to access the chat room
 *
 */
module.exports = function(req, res, next) {
  // User is active, proceed
  if (req.session.user) {
    return next();
  }

  // otherwise
  return res.redirect('/register');  
};
