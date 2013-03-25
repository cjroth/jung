
      var v = $v = $('#v');
      var w = $v.width();
      var h = $v.height();

      var chris = [-60, 90, 10, -35];
      var sophie = [79, 48, -75, -44];
      var data = sophie;

      var ls = d3.scale.linear()
          .domain([-100, 0, 100])
          .range([0, w / 2, w / 2]);

      var ws = d3.scale.linear()
          .domain([-100, 0, 100])
          .range([w / 2, 0, w / 2]);

      var nls = ['I', 'S', 'F', 'P']
      var nrs = ['E', 'N', 'T', 'J'];

      var nlk = ['Introverted', 'Sensing', 'Feeling', 'Perceiving'];
      var nrk = ['Extraverted', 'Intuitive', 'Thinking', 'Judging'];

      for (var i in data) {
        $v.append('\
          <div class="trait">\
            <div class="label left" data-title="' + Math.abs(data[i]) + '% ' + nlk[i] + '">' + nls[i] + '</div>\
            <div class="label right" data-title="' + Math.abs(data[i]) + '% ' + nrk[i] + '">' + nrs[i] + '</div>\
            <div class="gauge" style="\
             margin-left:   ' + (ls(data[i])) + 'px; \
             width:  ' + (ws(data[i])) + 'px; \
            "></div>\
          </div>\
        ');
      }

      var $d;

      $('.label').hover(function() {
        $d = $('<div class="d"><h1>' + $(this).data('title') + '</div>')
          .appendTo($v);
      }, function() {
        $d.remove();
      });