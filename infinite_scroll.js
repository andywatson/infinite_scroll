
//
// infinite scroll
mcrmade = {};

mcrmade.infiniteScroll = function(el, options) {

	if (el) {

		this.init(el, options);
	}
}

$.extend(mcrmade.infiniteScroll.prototype, {

	// plugin name
	name: 'mcrmade_infiniteScroll',

	defaults: {
	},

	// initialise the plugin
	init: function(el, options) {

		this.options = $.extend(true, {}, this.defaults, options);

		this.element = $(el);

		if (this.options.elements) {

			this.children = $(this.options.elements, this.element);
		} else {

			this.children = this.element.children();
		}

		if (!this.element.data('name')) {

			this.createStyles();

			this.setThreshold();

			this.duplicateChildren();

			this.bind();

			$.data(this.element, this.name, this);
			this.element.data('name', this.name);
		}

		if (
			this.options.callback &&
			typeof(this.options.callback) === 'function'
		) {

			this.options.callback.call();
		}

		return this;
	},

	// bind events to this instance's methods
	bind: function() {

		this.element.bind('destroyed', $.proxy(this.teardown, this));

		// no modernizr
		// modernizr but no touch
		//
		// always add mousewheel functionality
		this.element.bind('mousewheel', $.proxy(this.mouseScroll, this));

		//
		// bind mousemove to element
		this.element.bind('mousemove', $.proxy(this.mouseTrack, this));

		//
		// test for touch functionality
		if (
			!Modernizr ||
			(
				Modernizr &&
				$('html').hasClass('no-touch')
			)
		) {

			this.element.bind('touchstart', $.proxy(this.touchStart, this));
			this.element.bind('touchmove', $.proxy(this.touchMove, this));
			this.element.bind('touchend', $.proxy(this.touchEnd, this));
		}

		$(window).on('throttledresize', $.proxy(this.reCalc, this));
	},

	// call destroy to teardown whilst leaving the element
	destroy: function() {

		this.element.unbind('destroyed', this.teardown());

		this.teardown();
	},

	// remove plugin functionality
	teardown: function() {

		$.removeData(this.element, this.name);

		this.unbind();

		this.element = null;
	},

	unbind: function() {

		$(window).off('throttledresize', $.proxy(this.reCalc, this));
	},

	createStyles: function() {

		if (this.element.css('overflow') !== 'hidden') {

			this.element.css({
				overflow: 'hidden'
			});
		}

		for (var i = 0; i < this.children.length; i++) {

			if (this.children.eq(i).css('position') !== 'relative') {

				this.children.eq(i).css({
					position: 'relative'
				});
			}
		}
	},

	duplicateChildren: function() {

		var last_element = this.children.last(),
			last_bottom = last_element.position().top + last_element.height();

		while (last_bottom <= this.threshold) {

			this.element.append(this.children.clone().wrap());

			last_element = this.element.children().last();

			last_bottom = last_element.position().top + last_element.height();
		}

		this.resetChildren();

		for (var i = 0; i < this.children.length; i++) {

			this.children.eq(i).data('top', 0);
		}
	},

	resetChildren: function()
	{

		this.children = $(this.options.elements, this.element);
	},

	setThreshold: function() {

		this.threshold = this.element.position().top + this.element.height();
	},

	mouseScroll: function(e, delta, deltaX, deltaY) {

		if (deltaY > 0) {

			if (this.children.last().position().top >= this.threshold) {

				for (var i = 0; i < this.children.length; i++) {

					this.children.eq(i).data('top', parseInt(this.children.eq(i).data('top') - this.children.last().height()));

					this.children.eq(i).css({
						top: this.children.eq(i).data('top')
					});
				}

				this.element.prepend(this.children.last());

				this.resetChildren();
			}

		} else {

			if (this.children.first().position().top + this.children.first().height() <= 0) {

				for (var i = 0; i < this.children.length; i++) {

					this.children.eq(i).data('top', parseInt(this.children.eq(i).data('top') + this.children.first().height()));

					this.children.eq(i).css({
						top: this.children.eq(i).data('top')
					});
				}

				this.element.append(this.children.first());

				this.resetChildren();
			}
		}

		for (var i = 0; i < this.children.length; i++) {

			this.children.eq(i).data('top', parseInt(this.children.eq(i).data('top') + deltaY));

			this.children.eq(i).css({
				top: this.children.eq(i).data('top')
			});
		}



		// get element that has moved under the mouse
		this.elementTrack();
	},

	touchStart: function() {

		event.preventDefault();

		var touch = event.targetTouches[0],
			date = new Date(),
			time = date.getTime(),
			origin = {
				x: touch.screenX,
				y: touch.screenY,
				t: time
			};

		this.child.scroll_content.data('origin', origin);
		this.child.scroll_content.data('last_vector', origin);
	},

	touchMove: function() {

		event.preventDefault();

		var changed = event.changedTouches[0],
			date = new Date(),
			time = date.getTime(),
			last_vector = this.child.scroll_content.data('last_vector'),
			increment = {
				x: changed.screenX - last_vector.x,
				y: changed.screenY - last_vector.y,
				t: time - last_vector.t
			},
			this_vector = {
				x: changed.screenX,
				y: changed.screenY,
				t: time
			};

		this.child.scroll_content.data('last_vector', this_vector);

		var position = this.child.scroll_content.position().top += increment.y;

		if (
			position >= this.scrollParameters.scroll_content_max_y &&
			position <= 0
		) {

			this.child.scroll_content.css({
				top: position
			});
		}

		this.setScrolled('content');
	},

	touchEnd: function() {

		event.preventDefault();

		var changed = event.changedTouches[0],
			date = new Date(),
			time = date.getTime(),
			last_vector = this.child.scroll_content.data('last_vector'),
			increment = {
				x: changed.screenX - last_vector.x,
				y: changed.screenY - last_vector.y,
				t: time - last_vector.t
			},
			speed = increment.y / increment.t;
	},

	reCalc: function() {

		this.setThreshold();
	},

	mouseTrack: function(e)
	{

		this.element.data('mouse_x', e.pageX);
		this.element.data('mouse_y', e.pageY);
	},

	elementTrack: function()
	{

		for (var i = 0; i < this.children.length; i++) {

			if (
				this.element.data('mouse_y') > this.children.eq(i).offset().top &&
				this.element.data('mouse_y') <= parseInt(this.children.eq(i).offset().top + this.children.eq(i).height())
			) {

				if (!this.scrolled_over_element) {

					debug.log('initial setting of scrolled_over_element');

					this.scrolled_over_element = this.children.eq(i);
				}

				if (this.scrolled_over_element.get(0) !== this.children.eq(i).get(0)) {

					debug.log('scrolled_over_element has changed');

					this.scrolled_out_element = this.scrolled_over_element;

					this.scrolled_over_element = this.children.eq(i);

					debug.log(this.scrolled_out_element);
					debug.log(this.scrolled_over_element);

					if ('mouseout' in $._data(this.scrolled_out_element[0], 'events')) {

						// debug.log('has mouseout event');
						this.scrolled_out_element.trigger('mouseout');
					}

					if ('mouseover' in $._data(this.scrolled_out_element[0], 'events')) {

						// debug.log('has mouseover event');
						this.scrolled_over_element.trigger('mouseover');
					}
				}
			}
		}
	}
});



//
// make plugin
$.pluginMaker(mcrmade.infiniteScroll);
