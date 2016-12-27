var Question = function(object) {
  var self = this;
  this.$element = null;
  this.question_id = object.id;
  this.answerable = false;
  this.compact = false;
  this.answer = null;
  this.answers = [];
  this.draggable = false;
  this.scoring = [];
  if (object.nodeName || object.jquery) {
    this.$element = $(object);
    this.question_id = this.$element.data('question-id');
    this.question = this.$element.find('h3').text();
    this.answerable = this.$element.hasClass('answerable');
    this.compact = this.$element.hasClass('compact');
    this.answer = this.$element.data('answer');
    this.draggable = this.$element.hasClass('draggable');
    this.$element.find('.answers .answer').each(function() {
      var answer = $(this).val();
      self.answers.push(answer);
    });
    this.$element.find('.spectrum-score input').each(function() {
      var score = $(this).val();
      self.scoring.push(score);
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

Question.prototype.views = {
  'question': ejs.compile($('#question-template').text()),
  'question-gauge': ejs.compile($('#question-gauge-template').text()),
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
  if (this.$element.hasClass('question-set-spectrum')) {
    this.$element.find('.spectrum-score').each(function() {
      $(this).raty({
        path: '/raty/img',
        score: $(this).data('score')
      });
    });
  }
};

Question.prototype.getAnswers = function() {
  return this.answers;
};

Question.prototype.render = function(view) {
  view = view || 'question';
  var html = this.views[view]({
    id: this.question_id,
    question: this.question,
    answers: this.getAnswers(),
    answer: this.answer,
    answerable: this.answerable,
    compact: this.compact,
    scoring: this.scoring
  });
  this.$element.replaceWith(html);
  this.$element = $('.question[data-question-id=' + this.question_id + ']')
  this._attachEventListeners();
};