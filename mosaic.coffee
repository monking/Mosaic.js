###
Mosaic
A masonry layout of items emphasizing filling gaps over order.

@author Christopher Lovejoy <c@lovejoy.info>
@version 0.8.0 2014-02-21
###

$ = jQuery

class Mosaic

	# Events
	BEFORE_ITEMS    : 'mosaic-before-items'
	BEFORE_UPDATE   : 'mosaic-before-update'
	AFTER_UPDATE    : 'mosaic-after-items'
	REDRAW_CANCELED : 'mosaic-redraw-canceled'
	BEFORE_MEASURE  : 'mosaic-before-measure'

	constructor: (options = {}) ->
		@options =
			container      : $(document.body)
			itemSelector   : '> *'
			fixed          : 'width'
			updateOnResize : true
			gutter         : 4
			init           : null

		@constructing = true
		@applyOptions options
		@constructing = false

	applyOptions: (options) ->
		$.extend @options , options

		@options.container = $(@options.container)
		@options.container.css # reset inline/scripted dimensions
			width: ''
			height: ''

		@dimensions =
			fixed : @options.fixed
			flex  : if @options.fixed is "width" then "height" else "width"

		@containerSize =
			fixed : NaN
			flex  : NaN

		@axes =
			x : if @options.fixed is "width" then "left" else "top"
			y : if @options.fixed is "width" then "top" else "left"

		self = @

		if @constructing
			@resizeListener = -> self.redraw()
			if typeof @options.init is 'function' then @options.init.call @

		$ ->
			$(window).unbind('resize', self.resizeListener)
			if self.options.updateOnResize
				$(window).resize -> self.resizeListener()
			self.redraw()

	bind: ->
		$.fn.bind.apply @, arguments

	unbind: ->
		$.fn.unbind.apply @, arguments

	redraw: (force = false) ->
		@drawing = true
		$(@).trigger @BEFORE_MEASURE
		newContainerFixedSize = @options.container[@dimensions.fixed]()

		if @containerSize.fixed isnt newContainerFixedSize or force
			@items = []
			@containerSize.fixed = @options.container[@dimensions.fixed]() # TODO: account for different values of box-sizing

			$(@).trigger @BEFORE_ITEMS
			return if not @drawing

			self = @
			$(@options.itemSelector, @options.container).each ->
				item = $(this)
				self.items.push
					x       : 0
					y       : 0
					fixed   : 0
					flex    : 0
					element : item

			$(@).trigger @BEFORE_UPDATE
			return if not @drawing

			@siftAllItems()
			@updateContainerFlexSize()

			$(@).trigger @AFTER_UPDATE
		else
			$(@).trigger @REDRAW_CANCELED
		@drawing = false

	siftAllItems: () ->
		@firstSlot = [parseInt(@options.container.css("padding-#{@axes.x}")), parseInt(@options.container.css("padding-#{@axes.y}"))]
		@slots = [@firstSlot]
		@barriers = [[@containerSize.fixed + @options.gutter, null, null, null]]

		@sift item for item in @items

	updateContainerFlexSize: () ->
		maxFlex = 0
		maxFlex = Math.max item.y + item.flex, maxFlex  for item in @items
		@containerSize.flex = maxFlex - @firstSlot[1]
		@options.container[@dimensions.flex] @containerSize.flex

	###
	Test whether a a rectangle overlaps with another rectangle, point, or line.

	@param rectA Array [x1, y1, x2, y2]
	@param rectA Array [x1, y1, x2, y2]; only first two for point/line
	@param gutter Number optional padding to right and bottom of bounding box
	@param offset Array [x,y] optional offset to apply to rectA position

	@returns Boolean true if rectA and rectB overlap, otherwise false
	###

	hitTest: (rectA, rectB, gutter = 0, offset = [0, 0]) ->
		rectB.push rectB[0], rectB[1]  if rectB.length is 2
		rectA[0] += offset[0] - gutter + 1
		rectA[1] += offset[1] - gutter + 1
		rectA[2] += offset[0] + gutter - 1
		rectA[3] += offset[1] + gutter - 1
		hitX = true
		hitY = true

		# away -x
		hitX = false  if rectB[0] isnt null and rectA[2] < rectB[0]

		# away +x
		hitX = false  if rectB[2] isnt null and rectA[0] > rectB[2]

		# away -y
		hitY = false  if rectB[1] isnt null and rectA[3] < rectB[1]

		# away +y
		hitY = false  if rectB[3] isnt null and rectA[1] > rectB[3]
		hitX and hitY

	sift: (item) ->
		if item.hidden is true
			item.element.hide()
			return

		item.element.show()
		viableSlotIndices = []
		item.fixed = item.element[@dimensions.fixed]()
		item.flex = item.element[@dimensions.flex]()

		for slot, i in @slots
			slotFail = false

			for barrier in @barriers
				if @hitTest [0, 0, item.fixed, item.flex], barrier, @options.gutter, slot
					slotFail = true
					break

			viableSlotIndices.push i unless slotFail

		self = @
		viableSlotIndices.sort (a, b) ->
			# tries to put the item at minimum x and y
			return  1  if self.slots[a][1] > self.slots[b][1]
			return -1  if self.slots[a][1] < self.slots[b][1]
			return  1  if self.slots[a][0] > self.slots[b][0]
			return -1  if self.slots[a][0] < self.slots[b][0]
			0

		slot = @slots.splice(viableSlotIndices[0], 1)[0]
		item.x = slot[0]
		item.y = slot[1]

		itemCSS =
			position : "absolute"
		itemCSS[@axes.x] = "#{item.x}px"
		itemCSS[@axes.y] = "#{item.y}px"
		item.element.css itemCSS

		# clear slots that this item now blocks
		i = 0
		for slot, i in @slots
			if slot
				@slots.splice i--, 1 if @hitTest([item.x, item.y, item.x + item.fixed, item.y + item.flex], slot)

		# add a slot near the "top right" of the current item
		@slots.push [item.x + item.fixed + @options.gutter, item.y]  if item.x + item.fixed + @options.gutter < @containerSize.fixed
		# add another slot at the "bottom left" of the current item
		@slots.push [item.x, item.y + item.flex + @options.gutter]
		@barriers.push [item.x, item.y, item.x + item.fixed, item.y + item.flex]

window.Mosaic = Mosaic

jQuery.fn.mosaic = (options) ->
	options ?= {}
	$(this).each () ->
		options.container = $(this)
		options.container.data "mosaic", new Mosaic(options)
