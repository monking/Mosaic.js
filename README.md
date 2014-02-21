Mosaic.js
=========

A masonry layout engine whose first priority is eliminating gaps.

Usage
-----

In your HTML document's `<head>`, or wherever you choose to include your scripts:

	<script src="//ajax.googleapis.com/ajax/libs/jquery/1.11.0/jquery.min.js"></script>
	<script src="mosaic.min.js"></script>

In your script, included after the above:

	new Mosaic({
		container: 'section.gallery'
	});

Or, using the jQuery plugin:

	$('section.gallery').mosaic();

Options
-------

### container (jQuery Object/DOM Element/String)

Default: `$(document.body)`

### itemSelector (String:

Default: `'> *'`

By default, this selects all the immediate children of the container. Change it
to any SizzleJS (jQuery) selector string, to be used within the container.

### fixed (String)

Default: `'width'`

The dimension which the items will wrap against. The default `'width'` means
that content will flow downwards. If you set `'height'`, content will extend
left to right.

### updateOnResize (Boolean)

Default: `true`

### gutter (Number)

Default: `4`

### init (Function)

Default: `null`

Mosaic begins sifting items as soon as it is created. Use this option to attach
event listeners before any have fired. It is called so that `this` refers to
the Mosaic object.

For example:

	var maxItemsVisible, beforeUpdateListener;

	beforeUpdateListener = function() {
		var len;
		for (i = 0, len = this.items.length; i < len; i++) {
			items[i].hidden = (i < maxItemsVisible);
		}
	};

	$('section.gallery').mosaic({
		init: function() {
			this.bind(this.BEFORE_UPDATE, beforeUpdateListener);
		}
	});

`BEFORE_ITEMS`: triggered when a redraw is about to happen, but items have not
been gathered yet.

`BEFORE_UPDATE`: triggered after items have been gathered, but before Mosaic
measures and places them.

`AFTER_UPDATE`: triggered after items have been placed and the container has
been resized to fit them.

`REDRAW_CANCELED`: triggered if a redraw is requested, but no changes have been
made which require redrawing. This is useful if the `updateOnResize` option is
enabled, and something should happen on resizing the window without changing
the dimension specified in the `fixed` option.

Methods
-------

`applyOptions` accepts a new options object to override the current options,
and triggers a redraw.

`bind` a shorthand for jQuery's [`.bind()`](http://api.jquery.com/bind/) on the
Mosaic object.

`unbind` a shorthand for jQuery's [`.unbind()`](http://api.jquery.com/unbind/)
on the Mosaic object.

`redraw` requests a redraw. Pass `true` to redraw even if conditions have not
changed.

Properties
----------

You can access several properties of the Mosaic object.

`items`: an array of all the items, updated on each redraw. Each item has the
following properties:

> `element`: (jQuery Object) containing the item's DOM element

> `x`: (Number) position in the `fixed` dimension (left, by default)

> `y`: (Number) position in the `flex` dimension (top, by default)

> `fixed`: (Number) breadth in the `fixed` dimension (width, by default)

> `flex`: (Number) breadth in the `flex` dimension (height, by default)

> `hidden`: (Boolean) if true, element will have `display:none` and be skipped

`options`: an object containing the default and custom options as you set them.
