(function() {

  var $gauge = $('.gauge');

  var $modal = $('#add-question-modal');

  var onQuestionAdded = function(question) {
    var $container = $modal.find('.modal-body').empty();
    question.$element = $('<div>').appendTo($container);
    question.render('question-gauge');
    $modal.modal({
      backdrop: false
    });
  };

  var $qlist = $('.questions-list').droppable({
    accept: '.question',
    drop: function(event, ui) {
      onQuestionAdded(new Question(ui.draggable));
    }
  });

  $modal.find('.modal-save').click(function() {

    var scores = [];

    $modal.find('.score').each(function() {
      var score = $(this).val();
      scores.push(score);
    });

    $.post('/gauge/add-question', {
      gauge_id: $gauge.data('gauge-id'),
      question_id: $modal.find('.question').data('question-id'),
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