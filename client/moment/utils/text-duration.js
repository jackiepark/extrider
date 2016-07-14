'use strict';

import $ from 'jquery' ;

const time_units = [
  {
    ms: 60 * 60 * 1000,
    cls: 'hours',
    suffix: 'h'
  }, {
    ms: 60 * 1000,
    cls: 'minutes',
    suffix: 'm'
  }, {
    ms: 1000,
    cls: 'seconds',
    suffix: 's'
  }, {
    ms: 0,
    cls: 'miliseconds',
    suffix: 'ms'
  }
];

export default function textDuration(duration, el, whole) {
  if (!duration) return $(el).text('');
  let cls = '', text;
  for (let  i=0; i<time_units.length; i++) {
    if (duration < time_units[i].ms) continue;
    cls = time_units[i].cls;
    text = duration + '';
    if (time_units[i].ms) {
      if (whole) text = parseInt(duration / time_units[i].ms);
      else text = parseInt(duration / time_units[i].ms * 10) / 10;
    }
    text += time_units[i].suffix;
    break;
  }
  $(el).addClass(cls).text(text);
};
