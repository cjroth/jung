var views = {
  'question': ejs.compile($('#question-template').text()),
  'question-gauge': ejs.compile($('#question-gauge-template').text())
};

var Question = function(object) {
  var self = this;
  this.$element = null;
  this.question_id = object.id;
  this.answerable = false;
  this.answer = null;
  this.answers = [];
  this.draggable = false;
  if (object.nodeName || object.jquery) {
    this.$element = $(object);
    this.question_id = this.$element.data('question-id');
    this.question = this.$element.find('h2').text();
    this.answerable = this.$element.hasClass('answerable');
    this.answer = this.$element.data('answer');
    this.draggable = this.$element.hasClass('draggable');
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
  if (this.draggable) {
    $(this.$element).draggable({
      revert: true,
      start: function(event, ui) {
        $(this).css('z-index', 100);
      }
    });
  }
  if (this.$element.hasClass('question-gauge')) {
    this.$element.find('button.incrementor').click(function() {
      var operator = parseInt($(this).val());
      var $input = $(this).parents('tr').find('input');
      var value = parseInt($input.val());
      $input.val(value + operator);
    });
  }
};

Question.prototype.getAnswers = function() {
  return this.answers;
};

Question.prototype.render = function(view) {
  view = view || 'question';
  var html = views[view]({
    id: this.question_id,
    question: this.question,
    answers: this.getAnswers(),
    answer: this.answer,
    answerable: this.answerable
  });
  this.$element.replaceWith(html);
  this.$element = $('.question[data-question-id=' + this.question_id + ']')
  this._attachEventListeners();
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
        questions[i].draggable = true;
        var question = new Question(questions[i]);
        question.$element = $('<div>').appendTo($result_container);
        question.render();
      }
    });
  });

  $('.gauge').click(function() {
    var id = $(this).data('gauge-id');
    window.location = '/gauge/' + id;
    return false;
  });

})();