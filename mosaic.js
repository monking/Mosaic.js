/*
Mosaic
A masonry layout of items emphasizing filling gaps over order.

@author Christopher Lovejoy <c@lovejoy.info>
@version 0.8.0 2014-02-21
*/


(function() {
  var $, Mosaic;

  $ = jQuery;

  Mosaic = (function() {
    Mosaic.prototype.BEFORE_ITEMS = 'mosaic-before-items';

    Mosaic.prototype.BEFORE_UPDATE = 'mosaic-before-update';

    Mosaic.prototype.AFTER_UPDATE = 'mosaic-after-items';

    Mosaic.prototype.REDRAW_CANCELED = 'mosaic-redraw-canceled';

    Mosaic.prototype.BEFORE_MEASURE = 'mosaic-before-measure';

    function Mosaic(options) {
      if (options == null) {
        options = {};
      }
      this.options = {
        container: $(document.body),
        itemSelector: '> *',
        fixed: 'width',
        updateOnResize: true,
        gutter: 4,
        init: null
      };
      this.constructing = true;
      this.applyOptions(options);
      this.constructing = false;
    }

    Mosaic.prototype.applyOptions = function(options) {
      var self;
      $.extend(this.options, options);
      this.options.container = $(this.options.container);
      this.options.container.css({
        width: '',
        height: ''
      });
      this.dimensions = {
        fixed: this.options.fixed,
        flex: this.options.fixed === "width" ? "height" : "width"
      };
      this.containerSize = {
        fixed: NaN,
        flex: NaN
      };
      this.axes = {
        x: this.options.fixed === "width" ? "left" : "top",
        y: this.options.fixed === "width" ? "top" : "left"
      };
      self = this;
      if (this.constructing) {
        this.resizeListener = function() {
          return self.redraw();
        };
        if (typeof this.options.init === 'function') {
          this.options.init.call(this);
        }
      }
      return $(function() {
        $(window).unbind('resize', self.resizeListener);
        if (self.options.updateOnResize) {
          $(window).resize(function() {
            return self.resizeListener();
          });
        }
        return self.redraw();
      });
    };

    Mosaic.prototype.bind = function() {
      return $.fn.bind.apply(this, arguments);
    };

    Mosaic.prototype.unbind = function() {
      return $.fn.unbind.apply(this, arguments);
    };

    Mosaic.prototype.redraw = function(force) {
      var newContainerFixedSize, self;
      if (force == null) {
        force = false;
      }
      this.drawing = true;
      $(this).trigger(this.BEFORE_MEASURE);
      newContainerFixedSize = this.options.container[this.dimensions.fixed]();
      if (this.containerSize.fixed !== newContainerFixedSize || force) {
        this.items = [];
        this.containerSize.fixed = this.options.container[this.dimensions.fixed]();
        $(this).trigger(this.BEFORE_ITEMS);
        if (!this.drawing) {
          return;
        }
        self = this;
        $(this.options.itemSelector, this.options.container).each(function() {
          var item;
          item = $(this);
          return self.items.push({
            x: 0,
            y: 0,
            fixed: 0,
            flex: 0,
            element: item
          });
        });
        $(this).trigger(this.BEFORE_UPDATE);
        if (!this.drawing) {
          return;
        }
        this.siftAllItems();
        this.updateContainerFlexSize();
        $(this).trigger(this.AFTER_UPDATE);
      } else {
        $(this).trigger(this.REDRAW_CANCELED);
      }
      return this.drawing = false;
    };

    Mosaic.prototype.siftAllItems = function() {
      var item, _i, _len, _ref, _results;
      this.firstSlot = [parseInt(this.options.container.css("padding-" + this.axes.x)), parseInt(this.options.container.css("padding-" + this.axes.y))];
      this.slots = [this.firstSlot];
      this.barriers = [[this.containerSize.fixed + this.options.gutter, null, null, null]];
      _ref = this.items;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        item = _ref[_i];
        _results.push(this.sift(item));
      }
      return _results;
    };

    Mosaic.prototype.updateContainerFlexSize = function() {
      var item, maxFlex, _i, _len, _ref;
      maxFlex = 0;
      _ref = this.items;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        item = _ref[_i];
        maxFlex = Math.max(item.y + item.flex, maxFlex);
      }
      this.containerSize.flex = maxFlex - this.firstSlot[1];
      return this.options.container[this.dimensions.flex](this.containerSize.flex);
    };

    /*
    	Test whether a a rectangle overlaps with another rectangle, point, or line.
    
    	@param rectA Array [x1, y1, x2, y2]
    	@param rectA Array [x1, y1, x2, y2]; only first two for point/line
    	@param gutter Number optional padding to right and bottom of bounding box
    	@param offset Array [x,y] optional offset to apply to rectA position
    
    	@returns Boolean true if rectA and rectB overlap, otherwise false
    */


    Mosaic.prototype.hitTest = function(rectA, rectB, gutter, offset) {
      var hitX, hitY;
      if (gutter == null) {
        gutter = 0;
      }
      if (offset == null) {
        offset = [0, 0];
      }
      if (rectB.length === 2) {
        rectB.push(rectB[0], rectB[1]);
      }
      rectA[0] += offset[0] - gutter + 1;
      rectA[1] += offset[1] - gutter + 1;
      rectA[2] += offset[0] + gutter - 1;
      rectA[3] += offset[1] + gutter - 1;
      hitX = true;
      hitY = true;
      if (rectB[0] !== null && rectA[2] < rectB[0]) {
        hitX = false;
      }
      if (rectB[2] !== null && rectA[0] > rectB[2]) {
        hitX = false;
      }
      if (rectB[1] !== null && rectA[3] < rectB[1]) {
        hitY = false;
      }
      if (rectB[3] !== null && rectA[1] > rectB[3]) {
        hitY = false;
      }
      return hitX && hitY;
    };

    Mosaic.prototype.sift = function(item) {
      var barrier, i, itemCSS, self, slot, slotFail, viableSlotIndices, _i, _j, _k, _len, _len1, _len2, _ref, _ref1, _ref2;
      if (item.hidden === true) {
        item.element.hide();
        return;
      }
      item.element.show();
      viableSlotIndices = [];
      item.fixed = item.element[this.dimensions.fixed]();
      item.flex = item.element[this.dimensions.flex]();
      _ref = this.slots;
      for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
        slot = _ref[i];
        slotFail = false;
        _ref1 = this.barriers;
        for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
          barrier = _ref1[_j];
          if (this.hitTest([0, 0, item.fixed, item.flex], barrier, this.options.gutter, slot)) {
            slotFail = true;
            break;
          }
        }
        if (!slotFail) {
          viableSlotIndices.push(i);
        }
      }
      self = this;
      viableSlotIndices.sort(function(a, b) {
        if (self.slots[a][1] > self.slots[b][1]) {
          return 1;
        }
        if (self.slots[a][1] < self.slots[b][1]) {
          return -1;
        }
        if (self.slots[a][0] > self.slots[b][0]) {
          return 1;
        }
        if (self.slots[a][0] < self.slots[b][0]) {
          return -1;
        }
        return 0;
      });
      slot = this.slots.splice(viableSlotIndices[0], 1)[0];
      item.x = slot[0];
      item.y = slot[1];
      itemCSS = {
        position: "absolute"
      };
      itemCSS[this.axes.x] = "" + item.x + "px";
      itemCSS[this.axes.y] = "" + item.y + "px";
      item.element.css(itemCSS);
      i = 0;
      _ref2 = this.slots;
      for (i = _k = 0, _len2 = _ref2.length; _k < _len2; i = ++_k) {
        slot = _ref2[i];
        if (slot) {
          if (this.hitTest([item.x, item.y, item.x + item.fixed, item.y + item.flex], slot)) {
            this.slots.splice(i--, 1);
          }
        }
      }
      if (item.x + item.fixed + this.options.gutter < this.containerSize.fixed) {
        this.slots.push([item.x + item.fixed + this.options.gutter, item.y]);
      }
      this.slots.push([item.x, item.y + item.flex + this.options.gutter]);
      return this.barriers.push([item.x, item.y, item.x + item.fixed, item.y + item.flex]);
    };

    return Mosaic;

  })();

  window.Mosaic = Mosaic;

  jQuery.fn.mosaic = function(options) {
    if (options == null) {
      options = {};
    }
    return $(this).each(function() {
      options.container = $(this);
      return options.container.data("mosaic", new Mosaic(options));
    });
  };

}).call(this);
