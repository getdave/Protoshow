/*  ProtoShow JavaScript slide show, 
 *	v 0.7 (beta) - 12/06/11
 *  Copyright(c) 2011 David Smith (web: http://www.aheadcreative.com; twitter: @get_dave)
 *
 *  This work is licenced under the Creative Commons Attribution-No Derivative Works 3.0 Unported License. 
 *	http://creativecommons.org/licenses/by-nd/3.0/ 
 *  
 *	For more information on this project visit:
 * 	http://www.protoshow.net
 *	http://www.deepbluesky.com
 *
 *--------------------------------------------------------------------------*/

/*

Show "swap" process

1) this.play() initialises a timer to run every "x" seconds



*/



if(typeof Prototype=='undefined' || typeof Scriptaculous =='undefined') {
	throw("Protoshow.js requires the Prototype & Scriptaculous  JavaScript framework");
} else {

var protoShow = Class.create({

	initialize: function(element,options) {
		
		// Default options
		this.options = Object.extend({
			selector			: ".slide",					
			interval			: 3000,
			initialSlide		: 1,
			mode				: 'forward',
			autoPlay			: true,
			autoRestart			: true,
			transitionType		: "slide",
			transitionTime		: 1.5,
			manTransitionTime	: 0.5,
			stopText			: "Pause",
			playText			: "Play",
			forwardText			: "Next",
			previousText		: "Previous",
			buildNavigation		: true,
			navElements			: ".proto-navigation li",
			buildControls		: true,
			stopOnHover			: true,
			captions			: false,
			captionsElement		: '.slide-caption',
			timer				: true
			
		}, options || {}); // We use Prototype's Object.extend() to overwrite defaults with user preferences 

		


		// get/set various options
		this.element 			= 	$(element);											// DOM element that contains the slideshow
		this.slides 			= 	this.element.select(this.options.selector);			// Elements that are to be the "Slides"		
		this.slidesLength		=	this.slides.size();		// Total number of Slides
		this.interval 			= 	this.options.interval;	
		this.transitionTime		=	this.options.transitionTime;					
		this.currentSlideID 	= 	this.options.initialSlide - 1;		
		this.nextSlideID		=	this.currentSlideID + 1;
		this.mode				= 	this[this.options.mode];							// Get play "mode" (forward, backward, random...etc)
		this.autoPlay			=	this.options.autoPlay;

		



		// define variables before use
		this.masterTimer		=	false;
		this.animating			=	false;	// boolean for "animating" status
		this.loopCount			=	0;
		this.slideWidth			=	0;
		this.slideHeight		=	0;
		this.slideIntervals		=	[];



		//run some initial setup
		this.setupTransitions(this.options.transitionType);

		this.setupSlides();

		// let's get things going!
		this.slides[this.currentSlideID].show().addClassName('active-slide');		
		this.play();
		
	},


	/* DIRECTIONAL CONTROLS
	------------------------------------------------*/

	play: function() {
		console.info("Loop count: " + this.loopCount)
		console.info("Master timer is: " + this.masterTimer);
		// Role: Starts the show and initialises master timer
		console.log("Playing");

		// Check if custom interval has been defined by user as data attribute in HTML
		var slideInterval = (this.slideIntervals[this.currentSlideID]) ? this.slideIntervals[this.currentSlideID] : this.interval;
		
		var _this = this;		
		this.masterTimer	=	new PeriodicalExecuter(function(pe) {
		  	_this.mode();		    
		}, slideInterval/1000);
		this.loopCount++;
	},

	stop: function() {
		// Completely stops the show and clears the master timer
		var _this = this;
		console.log("Stopping");
		_this.masterTimer.stop();
		_this.masterTimer = null;

	},

	forward: function() {
		// Role: Runs slideshow "forwards"
		console.log("Forward");
		this.goMaster( this.currentSlideID + 1 );
	},

	backward: function() {
		// Role: Runs slideshow "backwards"
		console.log("Backward");		
		this.goMaster( this.currentSlideID - 1 );	
	},

	goMaster: function(next) {
		// Role: Master function - controls delegation of slide swapping	
		var _this = this;
		this.stop();
		this.toggleAnimating(true);
		
		this.setNextIndex(next);  // set this.nextSlideID correctly		
		this.reportSlides();


		this.transitionType(this.slides[this.currentSlideID],this.slides[this.nextSlideID], {
			transitionTime		:   .5,
			transitionFinish	:	function() {	// pass a callback to ensure play can't resume until transition has completed
				_this.toggleAnimating(false);
				_this.slides[_this.currentSlideID].removeClassName('active-slide');
				_this.slides[_this.nextSlideID].addClassName('active-slide');
				
				_this.currentSlideID = _this.nextSlideID;	// update current slide to be the slide we're just moved to
				if (_this.autoPlay) {
					_this.play();
				}				
			}
		});		
	},


	/* TRANSITION FUNCTIONS
	------------------------------------------------*/

	fade: function(current,next,opts) {
		// Role: Transition function
		// Type: Fade - fades slides in and out

		var _this = this;

		next.show();
		current.fade({
			duration	: opts.transitionTime,
			afterFinish	: function() {
				return opts.transitionFinish();
			}
		});	
	},

	slide: function(current,next,opts) {
		// Role: Transition function
		// Type: Slider - slides slides across the screen
		var _this = this;
		var moveLeft = this.slideWidth;

		if (this.currentSlideID == this.slidesLength-1) {
			moveLeft = -(this.slideWidth * (this.slidesLength-1));
		}

		console.log(opts.transitionTime);

		new Effect.Move(_this.showEle, { 
			x: -(moveLeft), 
			y: 0,
			transition: Effect.Transitions.sinoidal,
			duration	: opts.transitionTime,
			afterFinish	: function() {
				return opts.transitionFinish();
			}
		});
	},

	setupSlides: function() {
		
		var _this = this;

		// Get user defined custom intervals
		this.slides.each(function(e, index) {			
			var slideInt = e.readAttribute('data-slide-interval');			
			_this.slideIntervals.push(slideInt);
		});		
		
		
	},
	
	setupTransitions: function(transType) {
		var _this = this;
		// Role: Setup basics for transitions
		if (typeof(transType) == "function") {	// user has defined custom transition function
			// If function then user has passed in custom transition function to be used
			this.transitionType		=	transType;
		} else {	// it's a string
			this.transitionType		=	this[transType];			
			this.element.addClassName('transition-' + transType);
			
			if (transType === "slide") {

				this.showWindow 	=	this.element.down('.show').wrap('div', { 'class': 'show-window' });
				this.showEle		=	this.showWindow.down('.show');
				var slideLayout 	= 	this.slides[0].getLayout();
				this.slideWidth  	= 	slideLayout.get('width');
				this.slideHeight 	= 	slideLayout.get('height');


				this.showWindow.setStyle({
					width	: 	_this.slideWidth + "px",
				  	height	: 	_this.slideHeight + "px"
				});
			}		
		}	
	},



	/* UTILITY FUNCTIONS
	------------------------------------------------*/

	isPlaying: function() {
		return this.masterTimer != null;
	},

	isAnimating: function() {
		return this.animating;
	},

	toggleAnimating: function(boolean) {
		// Role: toggles var to say whether animation is in progress and manipulates DOM
		this.animating = boolean;
		if (boolean) {
			this.element.addClassName("animating");	
		} else {
			this.element.removeClassName("animating");
		}
	},

	setNextIndex: function(next) {
		// Role: Decides on direction and ensures within bounds
		
		if(next === undefined) { // Ensure "next" has a value
			next = this.currentSlideID+1;
		}

		// Ensure we're within bounds
		if (next >= this.slidesLength) {
			next = 0;
		} else if (next < 0 ){
			next = this.slidesLength-1;
		}

		this.nextSlideID = next;	
	},


	
	/* LOGGING FUNCTIONS
	------------------------------------------------*/

	reportSlides: function() {
		console.log("Current slide: " + this.currentSlideID);
		console.log("Next slide: " + this.nextSlideID);	
	},




	cc: function() {
		// catches the comma
	}

		

	
});

Element.addMethods({
	// Make Protoshow available as  method of all Prototype extended elements
	// http://www.prototypejs.org/api/element/addmethods
	protoShow: function(element, options) {
	element = $(element);
		var theShow = new protoShow(element,options);
		return theShow;
	}
});

}




