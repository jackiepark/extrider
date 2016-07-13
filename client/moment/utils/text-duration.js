'use strict';

import $ from 'jquery';

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
  let cls = '', text = '';
  time_units.every(unit => {
    if (duration < unit.ms) return true;
    cls = unit.cls;
    text = duration + '';
    if (unit.ms) {
      if (whole) text = parseInt(duration / unit.ms);
      else text = parseInt(duration / unit.ms * 10) / 10;
    }
    text += unit.suffix;
    return false;
  });
  $(el).addClass(cls).text(text);
};
