var express = require('express');
var util = require('./lib/utility');
var partials = require('express-partials');
var bodyParser = require('body-parser');
var bcrypt = require('bcrypt-nodejs');
var cookieParser = require('cookie-parser');
var passport = require('passport');
var session = require('express-session');


var db = require('./app/config');
var Users = require('./app/collections/users');
var User = require('./app/models/user');
var Links = require('./app/collections/links');
var Link = require('./app/models/link');
var Click = require('./app/models/click');


// var passport = require('passport');
var app = express();
app.use(cookieParser());
app.use(passport.initialize());
app.use(passport.session());

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(partials());
// Parse JSON (uniform resource locators)
app.use(bodyParser.json());
// Parse forms (signup/login)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));
app.use(session({
  secret: 'secret',
  resave:false,
  saveUninitialized: true
}));

passport.serializeUser(function(user, done) {
  done(null, user);
});
passport.deserializeUser(function(obj, done) {
  done(null, obj);
})

app.get('/', util.checkUser,
function(req, res) {
  res.render('index');
});

app.get('/create', util.checkUser,
function(req, res) {
  res.render('index');
});

app.get('/signup',
function(req, res) {
  res.render('signup');
});

app.get('/login',
function(req, res) {
  res.render('login');
});

app.get('/links', 
function(req, res) {
  Links.reset().fetch().then(function(links) {
    res.send(200, links.models);
  });
});

app.post('/links', 
function(req, res) {
  var uri = req.body.url;

  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.send(404);
  }

  new Link({ url: uri }).fetch().then(function(found) {
    if (found) {
      res.send(200, found.attributes);
    } else {
      util.getUrlTitle(uri, function(err, title) {
        if (err) {
          console.log('Error reading URL heading: ', err);
          return res.send(404);
        }

        Links.create({
          url: uri,
          title: title,
          base_url: req.headers.origin
        })
        .then(function(newLink) {
          res.send(200, newLink);
          console.log(newLink);
        });
      });
    }
  });
});

/************************************************************/
// Write your authentication routes here
/************************************************************/
app.post('/signup', 
function(req, res) {
  var username = req.body.username;
  var password = req.body.password;
  new User({username: username}).fetch().then(function(found) {
    if(found) {
      //redirect to /logins
      var message = {message: "<div>Sorry!  You already have an account!</div>"};
      res.render('signup', message);
    } else {
      bcrypt.hash(req.body.password, null, null, function(err, hash) {
        var user = new User({username: username, password_hash: hash});
        user.save().then(function(newUser) {
          Users.add(newUser);
          req.session.isAuthenticated = true;
          res.redirect('/');
        });
      });
    }
  });
});

app.post('/login', 
function(req, res) {
  var p = req.body.password;
  new User({username: req.body.username}).fetch().then(function(user) {
    if(user) {
      bcrypt.compare(p, user.attributes.password_hash, function(err, result) {
        if(result) {
          req.session.isAuthenticated = true;
          res.redirect('/');
        } else {
          var message = {message: '<div class="alert alert-danger">Password is incorrect!</div>'};
          res.render('login', message);
        }
      });
     
    } else {
          var message = {message: '<div class="alert alert-danger">Username does not exist!</div>'};
          res.render('login', message);
      }
  });
});


/************************************************************/
// Handle the wildcard route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/*', function(req, res) {
  new Link({ code: req.params[0] }).fetch().then(function(link) {
    if (!link) {
      res.redirect('/');
    } else {
      var click = new Click({
        link_id: link.get('id')
      });

      click.save().then(function() {
        link.set('visits', link.get('visits')+1);
        link.save().then(function() {
          return res.redirect(link.get('url'));
        });
      });
    }
  });
});

console.log('Shortly is listening on 4568');
app.listen(4568);
