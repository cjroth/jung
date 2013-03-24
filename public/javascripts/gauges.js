(function() {
  
  $('.gauge-get-score').click(function() {

    var gauge_id = $(this).data('gauge-id');

    $.get('/score/' + gauge_id, function(data) {
      $('.gauge[data-gauge-id=' + gauge_id + '] .description').text(data.score);
    });

    return false;

  });

})();