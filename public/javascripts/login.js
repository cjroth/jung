(function() {
  
  var $forms = $('.form');

  $forms.submit(function() {
    var url = $(this).attr('action');
    var data = $(this).serialize();
    $.post(url, data, function(data) {
      if (data.result) {
        window.location = '/';
      }
    });
    return false;
  });

})();