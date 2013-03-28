(function() {
  
  var $forms = $('.form');

  $forms.submit(function() {
    var url = $(this).attr('action');
    var success = $(this).data('success');
    var data = $(this).serialize();
    $.post(url, data, function(data) {
      if (!data.errors) {
        window.location = success.replace(':id', data.id);
      }
    });
    return false;
  });
  
  $('.get-gauge-score').click(function() {

    var $tr = $(this).parents('tr');
    var $gauge = $tr.find('.gauge');

    var gauge_id = $gauge.data('gauge-id');

    $.get('/score/' + gauge_id, function(data) {
      var html = renderGaugeScore(data.score);
      $tr.find('td.gauge-score').html(html);
    });

    return false;

  });

})();