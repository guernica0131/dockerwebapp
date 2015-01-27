/*
 * Our app.js file will contains all custom js
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
    .factory('app', ['$rootScope', '$sails', '$window', 'Chat', 'lodash',
        function($rootScope, $sails, $window, Chat, _) {
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
                        /*
                         * @todo:: place in object and simplify
                         */
                        if (message.id) // find the index
                            var index = _.indexOf(_.pluck($rootScope.users, 'id'), message.id);

                        switch (message.verb) {

                            case 'updated':
                                // if we have a case where the booted user is YOU,
                                // we kick you out      
                                if (message.id == $rootScope.user.id) {
                                    $rootScope.user = null;
                                    return user.killSession().then(function(res) {
                                        $window.location.href = '/';
                                    });
                                }
                                // and splice
                                if (index > -1) // we found our user
                                    $rootScope.users.splice(index, 1);

                                break;
                            case 'created':
                                // we have a creation event
                                if (index === -1) // if the index is not there
                                    $rootScope.users.push(message.data); // push
                                break;
                        }

                    });
                    // we listen for chat changes
                    chat.listen(function(message) {

                        if (message.id)
                        // we find the index
                            var index = _.indexOf(_.pluck($rootScope.chats, 'id'), message.id);

                        switch (message.verb) {
                            case 'created':
                                // -1 meaning it is not in the chat array
                                if (index === -1)
                                    $rootScope.chats.push(message.data);
                                break;
                            case 'destroyed':
                                // we find the index
                                $rootScope.chats.splice(index, 1); // and splice
                                break;
                        }

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
                }, function() {
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
                }, function() {
                    alert("There was a problem registering you to the webserver")
                });

            };

        }
    ])
    /*
     * Controller formanaging active and online user
     */
    .controller('UserController', ['$scope', 'User',
        function($scope, User) {

            var user = new User();
            $scope.bootUser = function(u) {
                //console.log('Biit ', u);
                user.terminate(u.id);
            };

        }
    ])

       /*
     * Controller formanaging active and online user
     */
    .controller('ChatsController', ['$scope', 'Chat', 'lodash',
        function($scope, Chat, _) {

            var chat = new Chat();
            $scope.remove = function(c) {
                chat.destroy(c);
            };
            // sets the color for the chats
            $scope.setColor = function(u) {

                var color;
                if (u.color) // if the object has the color
                    color = u.color;
                else { // new objects will only contain the user id, so we search
                    var color = $scope.users[_.indexOf(_.pluck($scope.users, 'id'), u)].color;
                }
                // return the color
                return 'alert-' + color;
            };

        }
    ])  

    /*
     * Controller for managing active and online user
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

                }, function(why) { // there was an error
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
    .service('Model', ['$rootScope', '$q', '$sails', 'lodash',
        function($rootScope, $q, $sails, _) {

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



            return Model;
        }
    ])

    /*
     * A user model definition
     */
    .service('User', ['$q', 'Model',
        function($q, Model) {
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

            return User;

        }
    ])

    /*
     * Service for managing chat models
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
                    success: function(chat) {
                        $rootScope.chats.push(chat);
                        deferred.resolve(chat);
                    },
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
                    success: function(dead) {
                        var index = _.indexOf(_.pluck($rootScope.chats, 'id'), chat.id);
                        $rootScope.chats.splice(index, 1);
                        deferred.resolve(dead);
                    },
                    error: deferred.reject
                });

                return deferred.promise;

            };


            return Chat;

        }
    ])

 

}());