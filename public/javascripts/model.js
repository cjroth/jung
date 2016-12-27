var Model = function(data, $element) {
  var self = this;
  this.$element = $element;
  this.data = data;
  this.render();
};

Model.constructor = function(data, $element) {
  var self = this;
  this.$element = $element;
  this.data = data;
  this.render();
};

Model.prototype.set = function(key, value) {
  this.data[key] = value;
  this.render();
};

Model.prototype.get = function(key) {
  return this.data[key];
};

Model.prototype.views = {};

Model.prototype._attachEventListeners = function() {
  // do it here
};

Model.prototype.render = function(view, options) {
  var html = this.views[view || 'default'](this.data);
  this.$element.replaceWith(html);
  this.$element = $('.' + this.name + '[data-id=' + this.id + ']');
  this._attachEventListeners();
};