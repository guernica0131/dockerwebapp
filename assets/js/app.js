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

    // our application cotroller will manage the connection to sails sockets
    .controller('AppController', ['$scope', '$rootScope', '$sails', '$window', 'User', 'Chat', 'lodash', '$location', '$anchorScroll',
        function($scope, $rootScope, $sails, $window, User, Chat, _, $location, $anchorScroll) {
            // we set our ready state to false
            $scope.ready = false;
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

            var user = new User();

            $scope.$watch('ready', function(ready) {

                if (!ready)
                    return;

                // now that we've validated our user
                user.session().then(function(sessionUser) {
                    // if we have no user we'll recieve a warning
                    if (sessionUser.warning)
                        return;

                    $rootScope.user = sessionUser;
                    // we now create a to object to pull this data as well
                    var chat = new Chat();
                    // now we pull a model for all of the users and chats
                    user.pull()
                        .then(function(users) {
                            $rootScope.users = users;
                        }, function() {
                            alert("There was a problem pulling users");
                        });
                    chat.pull()
                        .then(function(chats) {
                            $rootScope.chats = chats;
                        }, function() {
                            alert("There was a problem pulling users");
                        });
                    // now we are going to listen to the web sockets
                    user.listen(function(message) {
                        /*
                         * @todo:: place in object and simplify
                         */
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
                                // otherwise we find the index of the item
                                var index = _.indexOf(_.pluck($rootScope.users, 'id'), message.id);
                                // and splice
                                if (index > -1) // we found our user
                                    $rootScope.users.splice(index, 1);

                                break;
                            case 'created':
                                // we have a creation event
                                var index = _.indexOf(_.pluck($rootScope.users, 'id'), message.id);
                                if (index === -1) // if the index is not there
                                    $rootScope.users.push(message.data); // push

                                break;
                        }

                    });
                    chat.listen(function(message) {

                        switch (message.verb) {
                            case 'created':
                                // we find the index
                                var index = _.indexOf(_.pluck($rootScope.chats, 'id'), message.id);
                                // -1 meaning it is not in the chat array
                                if (index === -1) {
                                    $rootScope.chats.push(message.data);
                                }

                                break;
                            case 'destroyed':
                                // we find the index
                                var index = _.indexOf(_.pluck($rootScope.chats, 'id'), message.id);
                                $rootScope.chats.splice(index, 1); // and splice

                                break;
                        }

                    });


                });


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

            // now lets see if we already have an active user


        }
    ])

    .service('User', ['$rootScope', '$q', '$sails', 'lodash',
        function($rootScope, $q, $sails, _) {
            // constructor
            var User = function() {
                this.url = "/user";
            };
            /*
             * Here we define a method for listening to the sails sockets
             *
             * @param {Function} callback - callsback on a message
             */
            User.prototype.listen = function(callback) {
                $sails.on('user', callback);
            };
            /*
             * Sends the user's name to the webserver for registration.
             *
             * @param {String} name - the user's inputed name
             */
            User.prototype.register = function(name) {
                var deferred = $q.defer();
                // we send our request via websockets
                $sails.get(this.url + '/register', {
                    name: name
                }).success(function(user) {
                    deferred.resolve(user);
                }).error(function(why) {
                    console.error(why);
                    deferred.reject(why);
                });
                return deferred.promise;

            };
            /*
             * Used to find if a user is already in session
             */
            User.prototype.session = function() {

                var deferred = $q.defer();
                $sails.get(this.url + '/session').success(function(user) {
                    deferred.resolve(user);
                }).error(function(why) {
                    console.error(why);
                    deferred.reject(why);
                });

                return deferred.promise;

            };

            /*
             * Used to find if a user is already in session
             */
            User.prototype.killSession = function() {

                var deferred = $q.defer();
                $sails.get(this.url + '/end').success(function(user) {
                    deferred.resolve(user);
                }).error(function(why) {
                    console.error(why);
                    deferred.reject(why);
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
                $sails.get(this.url + '/terminate', {
                    id: id
                }).success(function(res) {
                    deferred.resolve(res);
                }).error(function(why) {
                    console.error(why);
                    deferred.reject(why);
                });

                return deferred.promise;

            };

            /*
             * Pulls all existing users and online users
             */
            User.prototype.pull = function() {
                var deferred = $q.defer();
                $sails.get(this.url, {
                    online: true
                }).success(function(users) {
                    deferred.resolve(users);
                }).error(function(why) {
                    console.error(why);
                    deferred.reject(why);
                });

                return deferred.promise;

            };



            return User;

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
     * Service for managing chat models
     */
    .service('Chat', ['$rootScope', '$q', '$sails', 'lodash',
        function($rootScope, $q, $sails, _) {
            // constructor


            var Chat = function() {
                this.url = '/chat';
            };

            /*
             * Here we define a method for listening to the sails sockets
             *
             * @param {Function} callback - callsback on a message
             */
            Chat.prototype.listen = function(callback) {
                $sails.on('chat', callback);
            };

            /*
             * Creates a new Chat object
             *
             * @param {String} chat - chat text
             * @param {Number} user - the user id
             *
             */
            Chat.prototype.create = function(chat, user) {
                var deferred = $q.defer();
                $sails.post(this.url, {
                    text: chat,
                    user: user
                }).success(function(chat) {
                    $rootScope.chats.push(chat);
                    deferred.resolve(chat);
                }).error(function(why) {
                    console.error(why);
                    deferred.reject(why);
                });

                return deferred.promise;

            };

            /*
             * Creates a new Chat object
             *
             * @param {String} chat - chat text
             * @param {Number} user - the user id
             *
             */
            Chat.prototype.destroy = function(chat) {
                var deferred = $q.defer();
                $sails.delete(this.url, {
                    id: chat.id,
                }).success(function(dead) {
                    var index = _.indexOf(_.pluck($rootScope.chats, 'id'), chat.id);

                    $rootScope.chats.splice(index, 1);

                    deferred.resolve(dead);
                }).error(function(why) {
                    console.error(why);
                    deferred.reject(why);
                });

                return deferred.promise;

            };

            /*
             * Pulls all existing users and online users
             */
            Chat.prototype.pull = function() {
                var deferred = $q.defer();
                $sails.get(this.url).success(function(users) {
                    deferred.resolve(users);
                }).error(function(why) {
                    console.error(why);
                    deferred.reject(why);
                });

                return deferred.promise;

            };


            return Chat;

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

            $scope.isUser = function(u) {
                return true;
            };

        }
    ])



    /*
     * Controller formanaging active and online user
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

                }, function(why) {
                    alert("I had a problem creating your chat");
                });



            };
        }
    ])

}());