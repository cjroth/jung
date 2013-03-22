(function() {
  
  var $question = $('#question');

  $question.find('.answer').click(function() {
    var question_id = $question.data('question-id');
    var answer = $(this).val();
    $.post('/answer/' + question_id, { answer: answer });
    return false;
  });

})();