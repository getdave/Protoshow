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
			nextText			: "Next",
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
		this.manTransitionTime	=	this.options.manTransitionTime;
		this.currentSlideID 	= 	this.options.initialSlide - 1;		
		this.nextSlideID		=	this.currentSlideID + 1;
		this.playText			=	this.options.playText;
		this.nextText			=	this.options.nextText;
		this.previousText		=	this.options.previousText;
		this.stopText			=	this.options.stopText;
		this.mode				= 	this[this.options.mode];							// Get play "mode" (forward, backward, random...etc)
		this.autoPlay			=	this.options.autoPlay;

		



		// define variables before use
		this.running			=	false;
		this.masterTimer		=	false;
		this.animating			=	false;	// boolean for "animating" status
		this.loopCount			=	0;
		this.slideWidth			=	0;
		this.slideHeight		=	0;
		this.slideIntervals		=	[];
		this.currentSlideEle	=	this.slides[this.currentSlideID];
		this.nextSlideEle		=	this.slides[this.nextSlideID];


		//run some initial setup
		this.setupTransitions(this.options.transitionType);
		this.setupSlides();
		this.setupControls();

		// let's get things going!				
		this.play();
		
	},


	/* DIRECTIONAL CONTROLS
	------------------------------------------------*/

	

	play: function() {
		// Role: Starts the show and initialises master timer
		console.log("Playing");
		var _this = this;	
		
		this.running = true;

		this.toggleMasterTimer(true);	
		this.updateControls(true);
		
		console.log("Play function says isPlaying() is: " + _this.isPlaying());	
	},

	stop: function() {
		// Completely stops the show and clears the master timer
		var _this = this;
		console.log("Stopping");
		
		this.running = false;

		this.toggleMasterTimer(false);
		this.updateControls(false);
		
		console.log("Stop function says isPlaying() is: " + _this.isPlaying());
	},

	toggleMasterTimer: function(boolean) {
		var _this = this;

		if (boolean) {
			// Check if custom interval has been defined by user as data attribute in HTML
			var slideInterval = (this.slideIntervals[this.currentSlideID]) ? this.slideIntervals[this.currentSlideID] : this.interval;
			console.log(slideInterval);
			// Set Master time which controls progress of show			
			this.masterTimer	=	new PeriodicalExecuter(function(pe) {
			  	_this.mode();		    
			}, slideInterval/1000);
			this.loopCount++;
		} else {
			_this.masterTimer && _this.masterTimer.stop();
			_this.masterTimer = null;
		}
	},

	forward: function(transTime) {
		// Role: Runs slideshow "forwards"
		console.log("Forward");
		this.goMaster( this.currentSlideID + 1, transTime);
	},

	backward: function(transTime) {
		// Role: Runs slideshow "backwards"
		console.log("Backward");		
		this.goMaster( this.currentSlideID - 1, transTime );	
	},

	next: function() {
		this.forward(this.manTransitionTime);
	},

	previous: function() {
		this.backward(this.manTransitionTime);
	},

	goMaster: function(next,transTime) {
		// Role: Master function - controls delegation of slide swapping	
		
		var _this = this;

		//this.stop();
		// First thing's first, we hault the show whatever the circumstances
		this.toggleMasterTimer(false); 

		if(this.isAnimating()) {
			return false;
		}

		// Set the transistion speed to transTime arg (if set) else fallback to standard transitionTime
		var transTime = (transTime) ? transTime : _this.transitionTime;

		

		this.toggleAnimating(true);		
		this.setNextIndex(next);  // set this.nextSlideID correctly		
		this.reportSlides();


		this.transitionType(this.currentSlideEle,this.nextSlideEle, {
			transitionTime		:   transTime,
			transitionFinish	:	function() {	// pass a callback to ensure play can't resume until transition has completed
				_this.toggleAnimating(false);
				_this.currentSlideEle.removeClassName('active-slide');
				_this.nextSlideEle.addClassName('active-slide');
				
				_this.currentSlideID 	= 	_this.nextSlideID;	// update current slide to be the slide we're just moved to
				_this.currentSlideEle	=	_this.slides[_this.nextSlideID];


				if (_this.autoPlay && _this.running ) {
					//_this.play();
					// if we're autoplaying and we're not explicity stopped
					// otherwise show Master Timer is not permitted to restart itself
					_this.toggleMasterTimer(true);	
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

		// If we're on the last slide transition then reset to first slide position
		if (this.currentSlideID == this.slidesLength-1) {
			moveLeft = -(this.slideWidth * (this.slidesLength-1));	// double negative equals positive
		} 

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


	/* SETUP METHODS
	------------------------------------------------*/

	setupSlides: function() {		
		var _this = this;

		// Ensure first slide is visible and has active class
		this.slides[this.currentSlideID].show().addClassName('active-slide');

		// Get and set user defined custom intervals
		this.slides.each(function(e, index) {			
			var slideInt = e.readAttribute('data-slide-interval');			
			slideInt = (slideInt.blank()) ? undefined : slideInt;	// check slideInt is not a blank string

			_this.slideIntervals.push(slideInt);	// push intervals into array for use later
		});		
	},
	
	setupTransitions: function(transType) {
		// Role: Setup basics for transitions
		var _this = this;
		
		if (typeof(transType) == "function") {	// user has defined custom transition function
			// If function then user has passed in custom transition function to be used
			this.transitionType		=	transType;
			this.element.addClassName('transition-custom');
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

	setupControls: function() {
		// Role: Setup controls

		var _this = this;
	
		this.protoControls	=  this.element.down('.proto-controls');    // Stop/Forward/Back buttons

		if (typeof this.protoControls==="undefined" ) {

			var controlsEle		 =	new Element('ol', { 'class': 'proto-controls'});
			var controlsTemplate = 	new Template('<li class="#{htmlclass}"><a href="javascript:void(0)" title="#{title}">#{text}</a></li>');
			
			var startStop		 = 	controlsTemplate.evaluate({
										htmlclass: "proto-control start-stop",
										text:  this.playText,
										title: "Pause the show"
									});
			var backward		 = 	controlsTemplate.evaluate({
										htmlclass: "proto-control backward",
										text:  this.previousText,
										title: "Go to Previous slide and play backwards"
									});
			var forward			 = 	controlsTemplate.evaluate({
										htmlclass: "proto-control forward",
										text:  this.nextText,
										title: "Go to Next slide and play forwards"
									});
			
			// Build a DOM fragment from all the above
			controlsEle.insert(startStop,'bottom').insert(backward,'bottom').insert(forward,'bottom');
			this.element.insert(controlsEle,'bottom');	// add into DOM		
			this.protoControls = $(controlsEle);	// extend the DOM fragment		
		} 

		// If the controls already exists in the DOM
		this.controlStartStop    	=	this.protoControls.down('.start-stop');
		this.controlForward      	=	this.protoControls.down('.forward');
		this.controlBackward     	=	this.protoControls.down('.backward');


		// define "lock" variable to stop abuse of controls
		var handlingClick	= false;

		this.protoControls.on("click", ".proto-control", function(event, element) {
			event.stop();

			// make sure we're not processing multiple click events 
			if (handlingClick) {
				return false;
			}

			handlingClick = true;
			
			//console.info(element);
			
			if(element === _this.controlForward) {
				_this.next();
			} else if (element === _this.controlBackward) {
				_this.previous();
			} else {	
					
				if (_this.running) {
					_this.stop();	//  if we're "Playing" then stop the show				
				} else {
					_this.play();	// else if we're not "Playing" then start the show 				
				}
			}



			handlingClick = false;
		});
		
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
		this.nextSlideEle = this.slides[this.nextSlideID];
	},

	updateControls: function(status) {
		var _this = this;
		// Role: Updates the status of the Play/Pause button		
		if (status) {			// The show has been started so update the button to "Pause"
			this.controlStartStop.down('a').update(_this.stopText);
		} else {			
			// The show has been stopped so update the button to "Play"
			this.controlStartStop.down('a').update(_this.playText);
		}
		
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




