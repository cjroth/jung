(function() {

  var gauge_id = $('input[name=gauge-id]').val();

  var question_ids = [];
  $('.questions-list .question').each(function() {
    var question_id = $(this).data('question-id');
    question_ids.push(question_id);
  });

  var $modal = $('#add-question-modal');

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
        if (_.contains(question_ids, question.id)) {
          continue;
        }
        question.$element = $('<div>').appendTo($result_container);
        question.compact = true;
        question.render();
        question.$element.click(function() {
          var $question = $(this);
          var question = new Question($question);
          onQuestionAdded(question);
          return false;
        });
      }
    });
  });

  var onQuestionAdded = function(question) {
    var $container = $modal.find('.modal-body').empty();
    question.$element = $('<div>').appendTo($container);
    question.render('question-gauge');
    $modal.modal('show');
  };

  $modal.find('.modal-save').click(function() {

    var scores = [];

    $modal.find('.spectrum-score input[name=score]').each(function() {
      var score = $(this).val();
      scores.push(score);
    });

    for (var i in scores) {
      var score = scores[i];
      if (!score) {
        alert('you must specify each answer\'s position on the spectrum');
        return;
      }
    }

    $.post('/gauge/add-question', {
      'gauge-id': gauge_id,
      'question-id': $modal.find('.question').data('question-id'),
      scoring: scores
    }, function(data) {
      if (data.errors) {
        alert('there was an error adding the question to the gauge');
        return;
      }
      window.location.reload();
    });

    return false;

  });

})();