'use strict';

const ansi_up = require('ansi_up');

module.exports = function () {
  return function (input, plaintext) {
    if (!input) return '';
    // handle the characters for "delete line" and "move to start of line"
    const startswithcr = /^[^\n]*\r[^\n]/.test(input);
    input = input.replace(/^[^\n\r]*\u001b\[2K/gm, '')
              .replace(/\u001b\[K[^\n\r]*/g, '')
              .replace(/[^\n]*\r([^\n])/g, '$1')
              .replace(/^[^\n]*\u001b\[0G/gm, '');
    if (startswithcr) input = '\r' + input;
    if (plaintext) return ansi_up.ansi_to_text(input);
    return ansi_up.ansi_to_html(ansi_up.escape_for_html(input));
  };
};
