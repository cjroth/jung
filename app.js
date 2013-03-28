
/**
 * Module dependencies.
 */

var express = require('express')
  , http = require('http')
  , ejs = require('ejs')
  , engine = require('ejs-locals')
  , Sequelize = require('sequelize')
  , passport = require('passport')
  , LocalStrategy = require('passport-local').Strategy
  , RedisStore = require('connect-redis')(express)
  , bcrypt = require('bcrypt')
  , moment = require('moment')
  , path = require('path')
  , jsYaml = require('js-yaml')
  , fs = require('fs')
  , config = require('./config.yml')
  , pg = require('pg')
  , mysql = require('mysql')
  , async = require('async')
  , _ = require('underscore')
  ;

var mysql_connection = mysql.createConnection({
  host     : config.sql.config.host,
  port     : config.sql.config.port,
  user     : config.sql.username,
  password : config.sql.password,
  database : config.sql.database
});

mysql_connection.connect();

var app = express().engine('ejs', engine);

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser('your secret here'));
  app.use(express.session({ store: new RedisStore(config.redis), secret: 'keyboard cat' }));
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function() {
  app.use(express.errorHandler());
});

var question_template = fs.readFileSync(__dirname + '/views/_question.ejs').toString();
var gauge_template = fs.readFileSync(__dirname + '/views/_gauge.ejs').toString();
var gauge_score_template = fs.readFileSync(__dirname + '/views/_gauge-score.ejs').toString();
var question_gauge_template = fs.readFileSync(__dirname + '/views/_question-gauge.ejs').toString();

/*
 * SEQUELIZE
 */

var sequelize = new Sequelize(config.sql.database, config.sql.username, config.sql.password, config.sql.config);

sequelize._renderQuestion = ejs.compile(question_template);

var User = sequelize.import(__dirname + '/models/user');
var Question = sequelize.import(__dirname + '/models/question');
var Answer = sequelize.import(__dirname + '/models/answer');
var Gauge = sequelize.import(__dirname + '/models/gauge');

var GaugeQuestionMap = sequelize.import(__dirname + '/models/gauge-question-map');


Gauge.hasMany(Question);
Question.hasMany(Gauge);

Question.hasMany(Answer, { foreignKey: 'question_id' });
Answer.belongsTo(Question);

User.hasMany(Answer, { foreignKey: 'answered_by' });
Answer.belongsTo(User);

User.hasMany(Question, { foreignKey: 'created_by' });
Question.belongsTo(User);

sequelize.sync().error(function(errors) {
  console.log(errors);
});

/*
 * PASSPORT
 */

passport.use(new LocalStrategy(function(username, password, done) {

  password = bcrypt.hashSync(password, config.salt);

  User
    .find({ where: { email: username, password: password } })
    .success(function(user) {
      done(undefined, user);
    })
    .error(function(error) {
      done(error);
    })
}));

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User
    .find(id)
    .success(function(user) {
      done(undefined, user);
    })
    .error(function(error) {
      done(error);
    });
});

passport.authorize = function(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect('/login')
};


var getNextQuestionSet = function(user_id, gauge_id, callback) {

  if (!callback) {
    callback = gauge_id;
    gauge_id = null;
  }

  var gauge_clause = gauge_id ? ' and gauge_id = ?' : '';

  mysql_connection.query('select * from questions where id not in (select answers.question_id from answers where answered_by = ? and deleted_at is null' + gauge_clause + ')', [user_id, gauge_id], function(err, rows) {
    if (err) return callback(err);
    var questions = [];
    for (var i in rows) {
      var row = rows[i];
      row.answerable = true;
      questions.push(new QuestionModel(row));
    }
    return callback(err, questions);
  });

};

var getAnsweredQuestions = function(user_id, gauge_id, callback) {

  if (!callback) {
    callback = gauge_id;
    gauge_id = null;
  }

  var gauge_clause = gauge_id ? ' and gauge_id = ?' : '';

  mysql_connection.query('select * from answers join questions on answers.question_id = questions.id where answered_by = ?' + gauge_clause, [user_id, gauge_id], function(err, rows) {
    if (err) return callback(err);
    var questions = [];
    for (var i in rows) {
      var row = rows[i];
      questions.push(new QuestionModel(row));
    }
    return callback(err, questions);
  });
};

var getUserQuestions = function(user_id, callback) {
  mysql_connection.query('select * from questions where created_by = ?', [user_id], function(err, rows) {
    if (err) return callback(err);
    var questions = [];
    for (var i in rows) {
      var row = rows[i];
      questions.push(new QuestionModel(row));
    }
    return callback(err, questions);
  });
};

var getUserGauges = function(user_id, callback) {
  mysql_connection.query('select * from gauges where created_by = ?', [user_id], function(err, rows) {
    if (err) return callback(err);
    var gauges = [];
    for (var i in rows) {
      var row = rows[i];
      gauges.push(new GaugeModel(row));
    }
    return callback(err, gauges);
  });
};

var getGaugeQuestions = function(gauge_id, callback) {
  mysql_connection.query('select questions.*, gauge_question_maps.scoring from questions join gauge_question_maps on questions.id = gauge_question_maps.question_id where gauge_id = ?', [gauge_id], function(err, rows) {
    if (err) return callback(err);
    var questions = [];
    for (var i in rows) {
      var row = rows[i];
      questions.push(new QuestionModel(row));
    }
    return callback(null, questions);
  });
};

var getGaugeScore = function(gauge_id, user_id, callback) {
  mysql_connection.query('select * from answers join questions on answers.question_id = questions.id join gauge_question_maps on questions.id = gauge_question_maps.question_id where answered_by = ? and gauge_id = ?', [user_id, gauge_id], function(err, rows) {
    // @todo handle err

    if (err) return callback(err);

    var scores = [];

    for (var i in rows) {
      var row = rows[i];
      var answers = row.answers.split(',');
      var answer_value = row.answer;
      var answer_index = answers.indexOf(answer_value);
      var scoring = row.scoring.split(',');
      var answer_score = scoring[answer_index];
      scores.push(answer_score);
      //if (i == 2) {
        console.log(scoring, answer_score, answer_index);
      //}
    }

    var sum = 0;

    for (var i in scores) {
      var score = scores[i];
      sum += parseInt(score);
    }

    var mean = sum / scores.length;

    //res.json({ total: sum, score: mean, scores: scores, answers: rows });
    return callback(null, { score: mean, answers: scores.length });

  });
};


var QuestionModel = function(row) {
  this.answerable = false;
  this.compact = false;
  for (var i in row) {
    this[i] = row[i];
  }
};

QuestionModel.prototype.getAnswers = function() {
  return this.answers.toString().split(',');
};

QuestionModel.prototype.getScoring = function() {
  if (!this.scoring) return false;
  return this.scoring.toString().split(',');
};

QuestionModel.prototype.views = {
  'default': ejs.compile(question_template),
  'gauge': ejs.compile(question_gauge_template)
};

QuestionModel.prototype.render = function(view) {
  return this.views[view || 'default']({
    id: this.id,
    question: this.question,
    answers: this.getAnswers(),
    scoring: this.getScoring(),
    answer: this.answer,
    answerable: this.answerable,
    compact: this.compact
  });
};

var GaugeModel = function(row) {
  for (var i in row) {
    this[i] = row[i];
  }
};

GaugeModel.prototype.getLabel = function(side) {
  switch (side) {
    case 'left':
      return this.name.split(',')[0];
    case 'right':
      return this.name.split(',')[1];
    default:
      return false;
  }
};

GaugeModel.prototype.views = {
  'default': ejs.compile(gauge_template),
  'score': ejs.compile(gauge_score_template)
};

GaugeModel.prototype.render = function(view, options) {
  return this.views[view || 'default'](_.extend(this, {
    loaded: false,
  }, options));
};


/*
 * ROUTES
 */

app.get('/javascripts/ejs.min.js', function(req, res) {
  res.sendfile(__dirname + '/node_modules/ejs/ejs.min.js');
});

app.get('/', function(req, res) {
  return req.user ? res.redirect('/home') : res.render('index');
});

app.get('/login', function(req, res) {
  res.render('login');
});

app.get('/home', function(req, res) {
  async.parallel([function(callback) {
    getNextQuestionSet(req.user.id, function(err, questions) {
      callback(err, questions);
    })
  }, function(callback) {
    getAnsweredQuestions(req.user.id, function(err, questions) {
      callback(err, questions);
    })
  }], function(err, results) {

    var questions = results[0];
    var answers = results[1]
    var current_question = questions[0];
    var next_questions = _.rest(questions, 1);

    res.render('home', {
      user: req.user,
      current_question: current_question,
      next_questions: next_questions,
      answers: answers,
      question_template: question_template,
      question_gauge_template: question_gauge_template,
      gauge_score_template: gauge_score_template
    });
  });
});

app.post('/login', function(req, res, next) {
  passport.authenticate('local', function(error, user, info) {
    if (error) return res.json({ result: false, errors: [error] });
    if (!user) return res.json({ result: false, errors: ['incorrect username or password'] });
    req.logIn(user, function(error) {
      if (error) return res.json({ result: false, errors: [error] });
      return res.json({ result: true });
    });
  })(req, res, next);
});

app.get('/logout', function(req, res) {
  req.logout();
  res.redirect('/');
});

app.post('/signup', function(req, res) {

  req.body.password = bcrypt.hashSync(req.body.password, config.salt);

  var user = User.build(req.body);

  errors = user.validate();

  if (errors) {
    res.json({ result: false, errors: errors });
    return;
  }

  user.save()
    .success(function(user) {
      res.json({ result: true });
    })
    .error(function(error) {
      res.json({ result: false, errors: [error] });
    });

});

app.get('/gauge/new', passport.authorize, function(req, res) {
  getUserGauges(req.user.id, function(err, gauges) {
    // @todo handle err
    res.render('gauge/new', {
      user: req.user,
      question_template: question_template,
      gauges: gauges,
      question_gauge_template: question_gauge_template,
      gauge_score_template: gauge_score_template
    });
  });
});

app.post('/gauge/new', passport.authorize, function(req, res) {
  Gauge
    .create({
      name: req.body.name,
      description: req.body.description,
      created_by: req.user.id
    })
    .success(function(gauge) {
      res.json(gauge);
    })
    .error(function(error) {
      console.error(error);
      res.json({ result: false, errors: [error] });
    });
});

app.get('/gauge/:id', function(req, res) {

  var gauge_id = req.params.id;
  var editable = false;

  Gauge.find(gauge_id)
    .success(function(gauge) {

      if (gauge.created_by == req.user.id || user.role == 'admin') {
        editable = true;
      }

      async.parallel([function(callback) {
        if (editable) {
          getGaugeQuestions(gauge_id, function(err, questions) {
            callback(err, questions);
          });
          return;
        }
        getNextQuestionSet(req.user.id, gauge_id, function(err, questions) {
          callback(err, questions);
        });
      }, function(callback) {
        getAnsweredQuestions(req.user.id, gauge_id, function(err, questions) {
          callback(err, questions);
        });
      }], function(err, results) {

        var questions = results[0];
        var answers = results[1]
        var current_question = questions[0];
        var next_questions = _.rest(questions, 1);

        res.render('gauge/single', {
          user: req.user,
          gauge: new GaugeModel(gauge),
          questions: questions,
          current_question: current_question,
          question_template: question_template,
          question_gauge_template: question_gauge_template,
          gauge_score_template: gauge_score_template

        });

      });

    })
    .error(function(err) {
      // @todo handle error...
    });

});

app.get('/question/search', passport.authorize, function(req, res) {
  var query = '%' + req.query.query + '%';
  Question.findAll({ where: ['question like ?', query] })
  .success(function(questions) {
    res.json(questions);
  })
  .error(function(error) {
    // @todo handle error
    console.log(error);
  });

});

app.get('/question/new', passport.authorize, function(req, res) {
  getUserQuestions(req.user.id, function(err, questions) {
    // @todo handle error
    return res.render('question/new', {
      user: req.user,
      questions: questions,
      question_template: question_template,
      question_gauge_template: question_gauge_template
    });
  });
});

app.post('/question/new', passport.authorize, function(req, res) {
  Question
    .create({
      question: req.body.question,
      created_by: req.user.id,
      answers: req.body.answers.toString()
    })
    .success(function() {
      res.json({ result: true });
    })
    .error(function(error) {
      console.error(error);
      res.json({ result: false, errors: [error] });
    });
});

app.get('/question/next', function(req, res) {
  getNextQuestionSet(req.user.id, function(err, questions) {
    if (err) return res.json({ result: false, errors: [err] });
    res.json(questions);
  });
});

app.get('/question/all', function(req, res) {
  getUserQuestions(req.user.id, function(err, questions) {
    if (err) return res.json({ result: false, errors: [err] });
    res.json(questions);
  });
});

app.get('/answer/all', function(req, res) {
  getAnsweredQuestions(req.user.id, function(err, rows) {
    // @todo handle error
    return res.json(rows);
  });
});

app.post('/gauge/add-question', function(req, res) {

  var gauge_id = req.body['gauge-id'];
  var question_id = req.body['question-id'];

  mysql_connection.query('select count(*) as count from gauge_question_maps where gauge_id = ? and question_id = ?', [gauge_id, question_id], function(err, rows) {
  
    if (rows[0].count) return res.json({ result: false, errors: ['that question is already part of this gauge']});

    GaugeQuestionMap.create({
      gauge_id: gauge_id,
      question_id: question_id,
      scoring: req.body.scoring.toString()
    })
    .success(function() {
      res.json({ result: true });
    })
    .error(function(error) {
      console.error(error);
      res.json({ result: false, errors: [error] });
    });

  });

});

app.post('/answer/clear-all', passport.authorize, function(req, res) {
  Answer
    .findAll({
      where: ['answered_by = ?', req.user.id]
    })
    .success(function(answers) {
      for (var i in answers) {
        var answer = answers[i];
        answer.destroy();
      }
      res.json(answers);
    })
    .error(function(error) {
      // handle the error...
    });
});

app.post('/answer/:question_id', passport.authorize, function(req, res) {
  Answer
    .create({
      question_id: req.params.question_id,
      answer: req.body.answer,
      answered_by: req.user.id
    })
    .success(function() {
      res.json({ result: true });
    })
    .error(function(error) {
      console.error(error);
      res.json({ result: false });
    });
});

app.get('/charts', function(req, res) {

  res.render('charts', {
    user: req.user,
          question_template: question_template,
      question_gauge_template: question_gauge_template
  });

});

app.get('/chart/:id', function(req, res) {

  var chart_id = req.params.id;

  res.render('charts/' + chart_id, {
    user: req.user,
          question_template: question_template,
      question_gauge_template: question_gauge_template  });

});

app.get('/user/:id', function(req, res) {

  var user_id = req.params.id;

  async.parallel([function(callback) {

    mysql_connection.query('select * from users where id = ?', [user_id], function(err, rows) {
      callback(err, rows[0]);
    });

  }, function(callback) {

    mysql_connection.query('select count(*) as gauges_created from gauges where created_by = ?', [user_id], function(err, rows) {
      callback(err, rows[0].gauges_created);
    });

  }, function(callback) {

    mysql_connection.query('select count(*) as questions_answered from answers where answered_by = ?', [user_id], function(err, rows) {
      callback(err, rows[0].questions_answered);
    });

  }, function(callback) {

    mysql_connection.query('select count(*) as questions_written from questions where created_by = ?', [user_id], function(err, rows) {
      callback(err, rows[0].questions_written);
    });

  }], function(err, results) {

    var user = results[0];
    var gauges_created = results[1];
    var questions_answered = results[2];
    var questions_written = results[3];

    res.render('user/single', {
      user: req.user,
      target_user: user,
      gauges_created: gauges_created,
      questions_answered: questions_answered,
      questions_written: questions_written,
      question_template: question_template,
      question_gauge_template: question_gauge_template
    });

  });

});

app.get('/question', function(req, res) {

  mysql_connection.query('select * from questions where id = 1', function(err, rows) {
    var question = new QuestionModel(rows[0]);
    res.render('question', {
      user: req.user,
      question_template: question_template,
      question_gauge_template: question_gauge_template,
      question: question
    });
  });

});

app.get('/score/:gauge_id', function(req, res) {

  var user_id = req.user.id;
  var gauge_id = req.params.gauge_id;

  getGaugeScore(gauge_id, user_id, function(err, score) {
    // @todo handle error
    res.json({ result: true, score: score });
  });

});

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
