'use strict';

export default function () {
  return function (input, prec) {
    if (!input && parseInt(input) !== 0) return '';
    const by = Math.pow(10, prec || 1);
    return parseInt(parseFloat(input) * by, 10)/by + '%';
  };
};
