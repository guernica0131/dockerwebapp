/**
 * UserController
 *
 * @description :: Server-side logic for managing Users
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

module.exports = {


    register: function(req, res) {
        // lets pull our simple user name
        var name = req.param('name');
        // now we will create a model for record keeping
        User.create({
            name: name
        }).exec(function(err, user) {
            if (err)
                return res.serverError(err);
            // we set the user into session
            req.session.user = user;
            // now we shoot our new users out to the sockets
            User.publishCreate(user);
            if (req.isSocket)
                User.watch(req);
            // and send back the data
            res.send(user);

        });


    },

    /*
    * This controller is used to end a session
    */
    end: function(req, res) {
    	req.session.user = null;
    	req.session.save();
    	res.send({success: 'undefined user'});
    },

    /*
     * We user terminate to pull the user from the session
     */
    terminate: function(req, res) {

        var sessionID = 0;

        if (req.session.user && req.session.user.id)
            sessionID = req.session.user.id;

        var id = req.param('id') || sessionID;

        if (!id)
            return res.badRequest();
        // update the user
        User.update({
            id: id
        }, {online:false}).exec(function(err, user) {
            if (err)
                res.severError(err);
            
            if (!_.isEmpty(user))
                return res.send({warning: 'No user found with this id'});

            if (user[0].id === sessionID)
	            req.session.user = null;
            // now we shoot our new users out to the sockets
            User.publishUpdate(user[0].id,  {online:false});
            
            res.send({
                success: user
            });
        });

    },
    /*
     * This action allows user to pull the session data
     */
    session: function(req, res) {
    	var user = req.session.user;
        return res.send(user ? user : {warning: 'user undefined'});
    }


};