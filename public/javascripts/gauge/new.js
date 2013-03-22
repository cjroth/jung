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

})();