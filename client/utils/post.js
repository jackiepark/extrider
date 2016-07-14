'use strict';

import $ from 'jquery' ;

function post(url, data, done) {
  $.ajax({
    url: url,
    type: 'POST',
    data: data,
    dataType: 'json',
    success: function (data, ts, xhr) {
      done(null);
    },
    error: function (xhr, ts, e) {
      if (xhr && xhr.responseText) {
        const data = $.parseJSON(xhr.responseText);
        e = data.errors[0];
      }
      done(e);
    }
  });
}

export default post;
