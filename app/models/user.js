var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');



var User = db.Model.extend({
  tablename:'users',
  initialize: function() {
    
    // this.on('creating', function(model, attrs, options){
    //   var salt = bcrypt.genSaltSync(10);
    //   var userPassword = model.get('password');
    //   var hash = bcrypt.hashSync(userPassword, salt);
    //   //model gets password
    //   //models sets 
    //   model.set('password', hash);
    //   model.set('salt', salt);
    // });
  }
});

module.exports = User;