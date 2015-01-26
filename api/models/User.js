/**
* User.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {

  
  /*
  * Here we define our model attributes
  */	
  attributes: {

  	name: {
  		type: 'string'
  	},

  	online: {
  		type: 'boolean',
  		defaultsTo: true
  	},

  	color: {
  		type: 'string'
  	}

  },

  /*
  * Before create hook called before a user is created
  * we are going to assign a random color
  */
  beforeCreate: function(params, next) {
  		// comes from bootstrap labels and colors
  		var options = ['default', 'primary', 'success', 'info', 'warning', 'danger'],
  		// we use lodashes random number generator. It is an inclusive opperation, hence, options - 1
  		index = _.random(options.length - 1);
  		// now we set the color
  		params.color = options[index];
  		// we call next
  		next();
  }
};

