/*
 * Our app.js file will contains all custom client-side js
 */
(function() {
    'use strict';

    angular.module('modit', [
        'ngSails'
    ])
    // first we create a factory for lodash
    .factory('lodash', ['$window',
        function($window) {
            return $window._;
        }
    ])
    // init factory.
    .factory('app', ['$rootScope', '$window', 'Chat', 'lodash',
        function($rootScope, $window, Chat, _) {

            // function is used to bootrap the application once the web sockets connect
            var bootstrap = (function(user) {
                //  we find it our user already has a active session
                user.session().then(function(sessionUser) {
                    // if we have no user we'll recieve a warning
                    if (sessionUser.warning)
                        return;
                    // we now set the sessionUser as the site users
                    $rootScope.user = sessionUser;
                    // we now create a to object to pull this data as well
                    var chat = new Chat();
                    // now we pull a model for all of the users and chats
                    user.pull({
                        online: true
                    }) // only pull online users
                    .then(function(users) {
                        $rootScope.users = users;
                    }, function() { // error
                        alert("There was a problem pulling users");
                    });
                    chat.pull()
                        .then(function(chats) {
                            $rootScope.chats = chats;
                        }, function() { //error
                            alert("There was a problem pulling users");
                        });

                    // we listen to the web sockets
                    user.listen(function(message) {
                        user.actions($rootScope, message);
                    });
                    // we listen for chat changes
                    chat.listen(function(message) {
                        chat.actions($rootScope, message);
                    });

                });

            });

            return {
                bootstrap: bootstrap
            }

        }
    ])


    //////////////////////////////
    //// Controllers
    //////////////////////////////

    // our application cotroller will manage the connection to sails sockets
    .controller('AppController', ['$scope', '$sails', '$window', 'app', 'User',
        function($scope, $sails, $window, app, User) {
            // we set our ready state to false
            $scope.ready = false;
            // create a user instance
            var user = new User();
            // wrap in a closure
            (function() {
                // once the socket connects we'll set our ready 
                // parameter to true
                if ($sails.socket.connected)
                    return $scope.ready = true;
                // otherwise we need to listen for the
                // connection event
                $sails.on('connect', function() {
                    $scope.ready = true;
                });

            }()); // end function

            // once the socket connects, we can bootstrap our app
            $scope.$watch('ready', function(ready) {
                // return when false
                if (!ready)
                    return;
                // now bootstrap
                app.bootstrap(user);

            });

            /*
             * Logs the user out of the session
             * @todo: place in directive
             */
            $scope.terminate = function() {
                // we terminate the user's id
                var id = $scope.user.id;
                user.terminate(id).then(function() {
                    $window.location.href = '/'
                }, function(why) {
                    console.error(why);
                    alert("There was an error removing your user from session");
                });

            };




        }
    ])

    /*
     * Controller for managine the registration page
     */
    .controller('RegController', ['$scope', '$rootScope', '$window', 'User',
        function($scope, $rootScope, $window, User) {

            $scope.empty = false;
            // our register is an onclick event function
            $scope.register = function() {
                // if there is no data in the name model return error
                if (!$scope.name)
                    return $scope.empty = true;

                $scope.empty = false;
                // now we send the registration data
                var user = new User();
                user.register($scope.name).then(function(user) {
                    $rootScope.user = user;
                    $window.location.href = '/'
                }, function(why) {
                    console.error(why);
                    alert("There was a problem registering you to the webserver")
                });

            };

        }
    ])
    /*
     * Controller for managing active and online user
     * @todo: place in directive
     */
    .controller('UserController', ['$scope', 'User',
        function($scope, User) {

            var user = new User();
            $scope.bootUser = function(u) {
                user.terminate(u.id);
            };

        }
    ])

    /*
     * Controller for managing the chats 
     * @todo: place in directive
     */
    .controller('ChatsController', ['$scope', 'Chat', 'lodash',
        function($scope, Chat, _) {

            var chat = new Chat();
            $scope.remove = function(c) {
                chat.destroy(c).then(function(dead) {
                    // we find the undex in the model
                    var index = _.indexOf(_.pluck($scope.chats, 'id'), dead.id);
                    $scope.chats.splice(index, 1); // then splice
                }, function(why) {
                    console.error(why);
                });
            };
            // sets the color for the chats
            $scope.setColor = function(u) {
                // our u param is either an object or id
                var uId = _.isObject(u) ? u.id : u;
                // now we find the user in the active users model
                var user = $scope.users[_.indexOf(_.pluck($scope.users, 'id'), uId)];
                // if there is no user send the offline class                
                return 'alert-' + ((user && user.color) ? user.color : 'offline');
            };

        }
    ])

    /*
     * Controller for managing the chat box
     * @todo: place in directive
     */
    .controller('ChatController', ['$scope', 'Chat',
        function($scope, Chat) {
            // create the chat object
            var chat = new Chat();
            $scope.createChat = function(e, element) {
                // if we are typing and our event is not an Enter Event, return
                if (element === 'key' && e.keyCode !== 13) return;
                // if we have no chat or user, return
                if (!$scope.chat || !$scope.user || !$scope.user.id)
                    return;
                // we want to clear the chat model
                var chatText = $scope.chat;
                $scope.chat = '';
                // now we create the chat area
                chat.create(chatText, $scope.user.id).then(function(chat) {
                    $scope.chats.push(chat);
                }, function(why) { // there was an error
                    console.error(why);
                    alert("I had a problem creating your chat");
                });



            };
        }
    ])


    //////////////////////////////
    //// Models
    //////////////////////////////

    /*
     * Used as a base model whereby the others models can inherit actions
     */
    .service('Model', ['$q', '$sails', 'lodash',
        function($q, $sails, _) {

            var Model = function(url) {
                this.url = url;
            };
            /*
             * used for a generic connection function
             * @param {Object} connect params
             */
            Model.prototype.connect = function(params) {

                var url = this.url;
                // if we have a url param we append
                if (params.url)
                    url += params.url;

                $sails[params.method](url, params.params)
                    .success(params.success)
                    .error(params.error);
            };

            /*
             * Here we define a method for listening to the sails sockets
             *
             * @param {Function} callback - callsback on a message
             */
            Model.prototype.listen = function(callback) {
                $sails.on(this.url.replace('/', ''), callback);
            };


            /*
             * Pulls all existing users and online users
             */
            Model.prototype.pull = function(params) {
                var deferred = $q.defer();

                this.connect({
                    method: 'get',
                    params: params,
                    success: deferred.resolve,
                    error: deferred.reject
                });

                return deferred.promise;

            };

            /*
             * Default socket actions for the models
             *
             * @param {Object} scope - the angular scope object
             * @param {Object} message - the socket message
             */
            Model.prototype.socketActions = function(scope, message) {

                var models = this.url.replace('/', '') + 's', // we want the model name
                    // we search to find its current location
                    index = _.indexOf(_.pluck(scope[models], 'id'), message.id); 
                // build the object
                var defaultActions = {
                    destroyed: function() {
                        if (index > -1) // we found our user
                            scope[models].splice(index, 1);
                    },
                    created: function() {
                        if (index === -1)
                            scope[models].push(message.data);
                    }
                    // @TODO: ADD CRUD

                }

                return {
                    defaults: defaultActions
                }
            };



            return Model;
        }
    ])




    /*
     * A user model definition
     */
    .service('User', ['$q', '$window', 'Model',
        function($q, $window, Model) {
            // we inherit the base Model for our user
            var User = function() {
                Model.call(this, '/user');
            };
            // create the prototype
            User.prototype = Object.create(Model.prototype);
            /*
             * Sends the user's name to the webserver for registration.
             *
             * @param {String} name - the user's inputed name
             */
            User.prototype.register = function(name) {
                var deferred = $q.defer();

                this.connect({
                    method: 'get',
                    url: '/register',
                    params: {
                        name: name
                    },
                    success: deferred.resolve,
                    error: deferred.reject
                });

                return deferred.promise;

            };
            /*
             * Used to find if a user is already in session
             */
            User.prototype.session = function() {

                var deferred = $q.defer();

                this.connect({
                    method: 'get',
                    url: '/session',
                    success: deferred.resolve,
                    error: deferred.reject
                });

                return deferred.promise;

            };

            /*
             * Used to find if a user is already in session
             */
            User.prototype.killSession = function() {

                var deferred = $q.defer();

                this.connect({
                    method: 'get',
                    url: '/end',
                    success: deferred.resolve,
                    error: deferred.reject
                });

                return deferred.promise;

            };


            /*
             * Removes a user out of the session
             *
             * @param {Number} id - the user id for termination
             */
            User.prototype.terminate = function(id) {

                var deferred = $q.defer();

                this.connect({
                    method: 'get',
                    url: '/terminate',
                    params: {
                        id: id
                    },
                    success: deferred.resolve,
                    error: deferred.reject
                });

                return deferred.promise;

            };

            /*
             * Socket action for user
             *
             * @param {Object} scope - the angular scope object
             * @param {Object} message - the socket message
             */
            User.prototype.actions = function(scope, message) {
                // pull the defauts
                var socketActions = this.socketActions(scope, message),
                    self = this,
                    actions = { // override for update
                        updated: function() {
                            if (message.id == scope.user.id)
                                return self.killSession().then(function(res) {
                                    scope.user = null;
                                    $window.location.href = '/';
                                });

                            socketActions.defaults.destroyed();

                        },
                        created: socketActions.defaults.created
                    }
                    // if it exists, run it
                if (_.isFunction(actions[message.verb]))
                    actions[message.verb]();

            };

            return User;

        }
    ])

    /*
     * Chat model definitions
     */
    .service('Chat', ['$rootScope', '$q', 'lodash', 'Model',
        function($rootScope, $q, _, Model) {
            // constructor
            var Chat = function() {
                Model.call(this, '/chat');
            };
            // create the prototype
            Chat.prototype = Object.create(Model.prototype);

            //////////////////////////////////////
            //// @todo: put CRUD actions in Model
            ////////////////////////////////////// 

            /*
             * Creates a new Chat object
             *
             * @param {String} chat - chat text
             * @param {Number} user - the user id
             *
             */
            Chat.prototype.create = function(chat, user) {
                var deferred = $q.defer();

                this.connect({
                    method: 'post',
                    params: {
                        text: chat,
                        user: user
                    },
                    success: deferred.resolve,
                    error: deferred.reject
                });

                return deferred.promise;

            };

            /*
             * Destroys new Chat object
             *
             * @param {Object} chat - chat object
             *
             */
            Chat.prototype.destroy = function(chat) {
                var deferred = $q.defer();

                this.connect({
                    method: 'delete',
                    params: {
                        id: chat.id,
                    },
                    success: deferred.resolve,
                    error: deferred.reject
                });

                return deferred.promise;

            };
            /*
             * Socket actions chat
             *
             * @param {Object} scope - the angular scope object
             * @param {Object} message - the socket message
             */
            Chat.prototype.actions = function(scope, message) {
                // pull the defaults
                var socketActions = this.socketActions(scope, message);
                // if it exists, run it
                if (_.isFunction(socketActions.defaults[message.verb]))
                    socketActions.defaults[message.verb]();

            };


            return Chat;

        }
    ])

}());