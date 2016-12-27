// var Spectrum = function(data, $element) {
//   var self = this;
//   this.$element = $element;
//   this.data = data;
// };

// Spectrum.prototype.set = function(key, value) {
//   this.data[key] = value;
//   this.render();
// };

// Spectrum.prototype.get = function(key) {
//   return this.data[key];
// };

// Spectrum.views = {
//   'question': ejs.compile($('#question-template').text()),
//   'question-gauge': ejs.compile($('#question-gauge-template').text()),
// };

// Spectrum.detect = function() {
//   $('.spectrum').each(function() {
//     new Spectrum(this);
//   });
// };

// Spectrum.prototype._attachEventListeners = function() {
//   // do it here
// };

// Spectrum.prototype.render = function(view, options) {
//   var html = this.views[view || 'default'](this.data);
//   this.$element.replaceWith(html);
//   this.$element = $('.spectrum[data-id=' + this.id + ']')
//   this._attachEventListeners();
// };

var Spectrum = Model.constructor;

Spectrum.prototype = Model.prototype;

Spectrum.views = {
  'question': ejs.compile($('#question-template').text()),
  'question-gauge': ejs.compile($('#question-gauge-template').text()),
};

Spectrum.prototype._attachEventListeners = function() {
  console.log('test');
  var self = this;
  this.$element.click(function() {
    console.log(this);
    return false;
  });
};

console.log(new Spectrum());