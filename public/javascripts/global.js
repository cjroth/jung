var renderGaugeScore = ejs.compile($('#gauge-score-template').text());

(function() {

  $('.question').each(function() {
    var $element = $(this);
    var data = $element.data();
    new Question(data, $element);
  });

  // $('.spectrum').each(function() {
  //   var $element = $(this);
  //   var data = $element.data();
  //   new Spectrum(data, $element);
  // });

  $('#clear-answers').click(function() {
    var url = $(this).attr('href');
    $.post(url, function(data) {
      alert('Your answers were cleared!');
      window.location.reload(true);
    });
    return false;
  });

})();