var renderQuestion = ejs.compile($('#question-template').text());

var Question = function(object) {
  var self = this;
  this.$element = null;
  this.question_id = object.id;
  this.answerable = false;
  this.answer = null;
  this.answers = [];
  if (object.nodeName || object.jquery) {
    this.$element = $(object);
    this.question_id = this.$element.data('question-id');
    this.answerable = this.$element.hasClass('answerable');
    this.answer = this.$element.data('answer');
    this.$element.find('.answers button').each(function() {
      var answer = $(this).val();
      self.answers.push(answer);
    });
  } else {
    for (var i in object) {
      this[i] = object[i];
    }
    if (typeof this.answers === 'string') {
      this.answers = this.answers.split(',');
    }
  }
  this._attachEventListeners();
};

Question.detect = function() {
  $('.question').each(function() {
    new Question(this);
  });
};

Question.prototype._attachEventListeners = function() {
  var self = this;
  if (!this.$element) return;
  if (this.$element.hasClass('answerable')) {
    this.$element.find('.answers button').on('click', function(e) {
      var answer = $(this).val();
      $.post('/answer/' + self.question_id, { answer: answer }, function(data) {
        window.location.reload(true);
      });
      return false;
    });
  }
};

Question.prototype.getAnswers = function() {
  return this.answers;
};

Question.prototype.render = function() {
  var html = renderQuestion({
    id: this.question_id,
    question: this.question,
    answers: this.getAnswers(),
    answer: this.answer,
    answerable: this.answerable
  });
  this.$element.html(html);
};

(function() {

  Question.detect();

  $('#clear-answers').click(function() {
    var url = $(this).attr('href');
    $.post(url, function(data) {
      alert('Your answers were cleared!');
      window.location.reload(true);
    });
    return false;
  });

  $('input.question-search').on('keyup', function() {
    var query = $(this).val();
    var $result_container = $($(this).data('results'));
    if (!query) {
      $result_container.empty();
      return;
    }
    $.get('/question/search?query=' + query, function(questions) {
      $result_container.empty();
      for (var i in questions) {
        var question = new Question(questions[i]);
        question.$element = $('<div>').appendTo($result_container);
        question.render();
      }
    });
  });

})();