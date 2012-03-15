/*  ProtoShow JavaScript slide show, 
 *	v 0.9 (beta) - 16/09/11
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
			mode				: "forward",
			autoPlay			: true,
			autoRestart			: true,
			transitionType		: "fade",
			transitionTime		: 1.5,
			manTransitionTime	: 0.5,		
			navigation			: true,
			controls			: true,
			stopText			: "Pause",
			playText			: "Play",
			nextText			: "Next",
			previousText		: "Previous",
			captions			: false, 
			pauseOnHover		: false,
			keyboardControls	: true,
			fireEvents			: true,
			progressTimer		: true,
			swipeEvents			: true
		}, options || {}); // We use Prototype's Object.extend() to overwrite defaults with user preferences 

		// get/set various options
		this.element 			= 	$(element);											// DOM element that contains the slideshow
		this.slides 			= 	this.element.select(this.options.selector);			// Elements that are to be the "Slides"		
		this.slidesLength		=	this.slides.size();									// Total number of Slides
		this.interval 			= 	this.options.interval;	
		this.transitionType		=	this.options.transitionType;
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
		this.progressTimer		=	this.options.progressTimer;
		this.showUniqueID		=	element;											// get a unique ID based on the id attr of the show element
		
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

		// run some initial setup
		this.setupTransitions(this.options.transitionType);
		this.setupSlides();
		this.setupControls();
		this.setupNavigation();
		this.setupCaptions();
		this.setupKeyboardControls();
		this.setupSwipeEvents();
		this.stopOnHover();

		this.setupTimer();

		// let's get things going!				
		this.play();
	},


	/**
	 * PLAY
	 * @description starts the show and initialises master timer
	 */
	play: function() {
		var _this = this;			
		this.running = true;
		this.toggleMasterTimer(true);	
		this.updateControls(true);			
		this.fireCustomEvent("protoShow:started");
	},

	/**
	 * STOP
	 * @description completely stops the show and clears the master timer
	 */
	stop: function() {
		var _this = this;		
		this.running = false;
		this.toggleMasterTimer(false);
		this.updateControls(false);		
		this.fireCustomEvent("protoShow:stopped");
	},

	/**
	 * toggleMasterTimer
	 * @param  {[type]} bln toggles the master time on/off depending on the boolean argument
	 */
	toggleMasterTimer: function(bln) {
		var _this = this;
	
		if (bln) {
			// Check if custom interval has been defined by user as data attribute in HTML
			var slideInterval = (this.slideIntervals[this.currentSlideID]) ? this.slideIntervals[this.currentSlideID] : this.interval;
			this.runProgressTimer();	
			
			// Set Master time which controls progress of show			
			this.masterTimer	=	new PeriodicalExecuter(function(pe) {
			  	_this.mode();		    
			}, slideInterval/1000);
			this.loopCount++;
		} else {
			this.stopProgressTimer();
			_this.masterTimer && _this.masterTimer.stop();
			_this.masterTimer = null;
		}

	},

	/**
	 * FORWARD
	 * @description runs slideshow "forwards"
	 */
	forward: function(transTime) {
		this.goMaster( this.currentSlideID + 1, transTime, "forward");
	},

	/**
	 * BACKWARD
	 * @description runs the slideshow "backwards"
	 */
	backward: function(transTime) {
		this.goMaster( this.currentSlideID - 1, transTime, "backward");	
	},

	/**
	 * NEXT
	 * @description advances the show by x1 slide forward
	 */
	next: function() {
		this.forward(this.manTransitionTime);
	},

	/**
	 * PREVIOUS
	 * @description retreats the show by x1 slide backward
	 */
	previous: function() {
		this.backward(this.manTransitionTime);
	},

	/**
	 * gotoSlide
	 * @description allows you to skip directly to the slide provided
	 * @param  {integar} slide a integar representing the desired slide
	 * @param  {floating point} transTime time in seconds it show take to transition between the two slides
	 */
	gotoSlide: function(slide,transTime) {
		if (slide === this.currentSlideID) {
			return false;
		}
		this.goMaster( slide, this.manTransitionTime );	
	},

	/**
	 * goMaster
	 * @description master method controlling controls delegation of slide swapping	
	 * @param  {integar} next a integar representing the desired slide
	 * @param  {[floating point]} transTime time in seconds it show take to transition between the two slides
	 * @param  {[string]} direction string representing a verbal description of the show direction
	 */
	goMaster: function(next,transTime, direction) {
		var _this = this;

		// First thing's first, we hault the show whatever the circumstances
		this.toggleMasterTimer(false); 

		if(this.isAnimating()) {
			return false;
		}

		// Set the transistion speed to transTime arg (if set) else fallback to standard transitionTime
		var transTime = (transTime) ? transTime : _this.transitionTime;

		this.toggleAnimating(true);		
		this.setNextIndex(next);  // set this.nextSlideID correctly		
		
		this.fireCustomEvent("protoShow:transitionStarted",transTime,direction,_this.nextSlideID);
		_this.updateNavigation(_this.currentSlideID, _this.nextSlideID);

		// Fire the correct transition function
		this.transitionType(this.currentSlideEle,this.nextSlideEle, {
			transitionTime		:   transTime,
			transitionFinish	:	function() {	// pass a callback to ensure play can't resume until transition has completed
				_this.toggleAnimating(false);
				_this.currentSlideEle.removeClassName('active-slide');
				_this.nextSlideEle.addClassName('active-slide');
				
				_this.updateCaptions(_this.nextSlideEle);
				_this.fireCustomEvent("protoShow:transitionFinished");
				_this.currentSlideID 	= 	_this.nextSlideID;	// update current slide to be the slide we're just moved to
				_this.currentSlideEle	=	_this.slides[_this.nextSlideID];				

				if (_this.autoPlay && _this.running ) {
					// if we're autoplaying and we're not explicity stopped
					// otherwise show Master Timer is not permitted to restart itself
					_this.toggleMasterTimer(true);	
				}				
			}
		});		
	},


	/**
	 * FADE
	 * @param  {integar} current ID corresponding to the current slide
	 * @param  {integar} next ID corresponding to the next slide
	 * @param  {[object]} opts configuration and options for the transition method
	 * @description Fade transition function. Fades slides in and out
	 */
	fade: function(current,next,opts) {
		var _this = this;
		next.show();
		current.fade({
			duration	: opts.transitionTime,
			afterFinish	: function() {
				return opts.transitionFinish();
			}
		});	
	},

	/**
	 * SLIDE
	 * @param  {integar} current ID corresponding to the current slide
	 * @param  {integar} next ID corresponding to the next slide
	 * @param  {[object]} opts configuration and options for the transition method
	 * @description Slide transition function. slides slides across the screen
	 */
	slide: function(current,next,opts) {
		var _this = this;			
		
		var leftPos = this.slideWidth * this.nextSlideID;

		// Uses Scriptaculous method
		new Effect.Morph(_this.showEle, {
			style: {
				left: -leftPos + 'px'
			}, 
			duration	: opts.transitionTime,
			afterFinish	: function() {
				return opts.transitionFinish();
			}
		});
	},

	/**
	 * setupSlides
	 * @description basic one time setup tasks for show 
	 */
	setupSlides: function() {		
		var _this = this;		

		this.slides.each(function(e, index) {	
			if (_this.options.transitionType !== "slide") {
				e.hide();		
			}

			// Get and set user defined custom intervals
			var slideInt = e.readAttribute('data-slide-interval');			
			slideInt = (slideInt && slideInt.blank()) ? undefined : slideInt;	// check slideInt is not a blank string
			_this.slideIntervals.push(slideInt);	// push intervals into array for use later
		});		

		// Ensure first slide is visible and has active class
		this.slides[this.currentSlideID].show().addClassName('active-slide');
	},
	
	/**
	 * setupTransitions
	 * @param  {string/function} transType name of transition function or custom transition function
	 * @description chooses the correct transition method. Will be deprecated and removed.
	 */
	setupTransitions: function(transType) {
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

	/**
	 * setupControls
	 * @description one time setup of controls for the show
	 */
	setupControls: function() {
		var _this = this;

		if (!this.options.controls) {
			return false;
		}
	
		this.protoControls	=  this.element.down('.proto-controls');    // Stop/Forward/Back buttons

		if (typeof this.protoControls === "undefined") {
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

		// define "lock" variable to stop abuse of controls (eg: ,repeated clicking)
		var handlingClick	= false;
		this.protoControls.on("click", ".proto-control", function(event, element) {
			event.stop();

			if (handlingClick) { // make sure we're not processing multiple click events 
				return false;
			}
			handlingClick = true;
						
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
			/*remove the "lock" variable*/
			handlingClick = false;
		});		
	},

	/**
	 * setupNavigation
	 * @description One time setup of navigation for the show
	 */
	setupNavigation: function() {
		var _this = this;
		
		if (!this.options.navigation) {
			return false;
		}

		this.protoNavigation	=  this.element.down('.proto-navigation');    

		if (typeof this.protoNavigation === "undefined" ) {
			var navEle		=	new Element('ol', { 'class': 'proto-navigation'});			
			var navTemplate = 	new Template('<li><a href="##{number}" title="Skip to Slide #{number}">#{number}</a></li>');

			this.slides.each(function(e,index) {		// for each slide in the show create a Nav <li> using the Template above
				var li = navTemplate.evaluate({number: index+1});
				navEle.insert(li,'bottom');
			});

			this.element.insert(navEle,'bottom');
			this.protoNavigation	=  this.element.down('.proto-navigation');			
		}

		this.protoNavigation.down('li').addClassName('current-slide');

		// define "lock" variable to stop abuse of controls
		var handlingClick	= false;
		
		this.protoNavigation.on("click", "a", function(event, element) {
			event.stop();

			if (handlingClick) { // make sure we're not processing multiple click events 
				return false;
			}
			handlingClick = true;
		
			var index = element.hash.substr(1,2);	// get the slide ID from the href hash (eg: #3)
			_this.gotoSlide(index-1);
			
			handlingClick = false;	// remove "lock" variable
		});
	},

	/**
	 * updateNavigation
	 * @param  {integar} current ID corresponding to the current slide
	 * @param  {integar} next ID corresponding to the next slide
	 * @description Updates the "active" classes on the navigation elements
	 */
	updateNavigation: function(current,next) {
		if (typeof this.protoNavigation !== "undefined" ) {
			this.protoNavigation.select('li')[current].removeClassName('current-slide');
			this.protoNavigation.select('li')[next].addClassName('current-slide');
		}
	},

	/**
	 * setupCaptions
	 * @description Setup captions element and prepare to receive captions
	 */
	setupCaptions: function() {
		var _this = this;
		if (this.options.captions) {
			var captionEle			=	new Element('div', { 'class' : 'slide-caption'});			
			captionEle.hide();	
			this.element.insert(captionEle,'bottom');
			this.captionsElement	=	captionEle;
			this.updateCaptions(_this.currentSlideEle);
		}
	},

	/**
	 * updateCaptions 
	 * @param  {[integar]} slide ID of the next element (the one which we're looking to update the of...)
	 * @description Updates the caption element or hides it if there is no caption provided
	 */
	updateCaptions: function(slide) {
		if (!this.options.captions) {
			return false;
		}	
		var nextCaption = slide.down('img').readAttribute('alt');
		if (nextCaption.replace(/^\s*|\s*$/g,'').length) {		// check that the attribute has some content (not just spaces)					
			if(!this.captionsElement.visible()) {
				// just check that the element is visible
				this.captionsElement.show();
			}				
			this.captionsElement.update(nextCaption);	
		} else {	// if no caption is found then hide the caption element
			this.captionsElement.hide();
		}
	},

	/**
	 * stopOnHover
	 * @description Pauses the show when the mouse is over the show
	 */
	stopOnHover: function() {
		var _this = this;

		if (this.options.pauseOnHover) {						
			this.element.down('.show').observe('mouseenter',function() {
				_this.stop();
			}).observe('mouseleave',function() {								
				_this.play();					
			});			
		}
	},

	/**
	 * setupKeyboardControls
	 * @description sets up observers to monitor keyboard navigation 
	 */
	setupKeyboardControls: function() {
		if (!this.options.keyboardControls) {
			return false;
		}
		var _this = this;
		document.observe('keydown', function(key) {			
			var keyCode = key.keyCode;
			// 39 = right arrow
			// 37 = left arrow			
			if ( (!key.target.tagName.match('TEXTAREA|INPUT|SELECT')) && (keyCode === 37 || keyCode === 39) ) { // stop arrow keys from working when focused on form items
				if (keyCode === 37) {
		        	_this.previous();
		        } else if (keyCode === 39) {
		        	_this.next();
		        }
			} else {
				return false;
			}
        }); 	
	},
	
	/**
	 * setupSwipeEvents
	 * @description Handles touch "swiping" to advanced/retreat the show
	 */
	setupSwipeEvents: function() {
		if (!this.options.swipeEvents) {
			return false;
		}

		var _this 		= this,
			touchStartX = false;			
		
		/* TOUCH START: Get and store the position of the initial touch */
		this.element.observe('touchstart', function(e) {			
			touchStartX = e.targetTouches[0].clientX;
		});		
		
		/* TOUCH MOVE: Called every time a user moves finger across the screen */
		this.element.observe('touchmove', function(e) {	
			e.preventDefault();		
			if (touchStartX > e.targetTouches[0].clientX) {
				_this.previous();
			} else {
				_this.next();
			}
		});					
	},

	/**
	 * fireCustomEvent
	 * @param  {string} event_name The name of the custom event to be fired
	 * @param  {[floating point]} trans_time time in seconds for the transition between the two slides
	 * @param  {[string]} direction String representing a verbal description of the current direction of the show
	 * @description facade for firing custom events. Allows user to extend show based on events fired.
	 */
	fireCustomEvent: function(event_name,trans_time,direction,slideID) {
		if(this.options.fireEvents) {
			var element = this.element;
			element.fire(event_name, {
				showID 			: this.showUniqueID,
				transitionTime	: trans_time,
				direction		: direction,
				slideID 		: slideID
			});		
		}
	},
	

	/**
	 * isPlaying
	 * @return {Boolean} Is the show playing?
	 */
	isPlaying: function() {
		return this.masterTimer != null;
	},

	/**
	 * isAnimating
	 * @return {Boolean} is the show currently animating?
	 */
	isAnimating: function() {
		return this.animating;
	},

	/**
	 * toggleAnimating
	 * @param  {Boolean} bln 
	 * @description Toggles var to say whether animation is in progress and manipulates DOM
	 */
	toggleAnimating: function(bln) {
		this.animating = bln;
		if (bln) {
			this.element.addClassName("animating");	
		} else {
			this.element.removeClassName("animating");
		}
	},

	/**
	 * setNextIndex 
	 * @param {integar} next the ID of what the show thinks should be the next slide
	 * @description Decides on direction of the show and ensures the next slide is within bounds
	 */
	setNextIndex: function(next) {
		if(next === undefined) { // Ensure "next" has a value
			next = this.currentSlideID+1;
		} 
		
		// Ensure we're within bounds
		if (next >= this.slidesLength) {
			next = 0;
		} else if (next < 0 ){
			next = this.slidesLength-1;
		}

		this.nextSlideID 	= next;	
		this.nextSlideEle 	= this.slides[this.nextSlideID];
	},

	/**
	 * updateControls
	 * @param  {[boolean]} status true/false used to trigger status
	 * @description [description] Updates the HTML of the Play/Pause button depending on boolean passed
	 */
	updateControls: function(status) {
		if (this.options.controls) {
			var _this = this;
					
			if (status) { // The show has been started so update the button to "Pause"
				this.controlStartStop.down('a').update(_this.stopText);
			} else { // The show has been stopped so update the button to "Play"				
				this.controlStartStop.down('a').update(_this.playText);
			}
		}		
	},	
	
	/**
	 * setupTimer
	 * @description Creates the proto-progress-timer <canvas> element, gets 2D Context and inserts into DOM 
	 */
	setupTimer: function() {	
		this.progressTimerEle = document.createElement('canvas');		
		if (this.progressTimerEle.getContext && this.progressTimerEle.getContext('2d')) { // test for Canvas support
			this.progressTimerEle.writeAttribute('class','proto-progress-timer');	
			this.progressTimerEle.width 	= 30;
			this.progressTimerEle.height 	= 30;
			this.element.insert(this.progressTimerEle,'bottom');		
			this.progressTimerCtx = this.progressTimerEle.getContext('2d');
		} else {
			this.progressTimer = false;	// no canvas support
		}
	},
	
	/**
	 * runProgressTimer
	 * @description runs & controls the animation of the "progress timer" 
	 */
	runProgressTimer: function() {
		var _this = this;		
		
		if (this.progressTimer) {	// if user has set to use progress timer and the browser supports <canvas>			
			this.progressTimerEle.show();			
			
			// use Epoch time to ensure code executes in time specified
			// borrowed from Emile JS http://script.aculo.us/downloads/emile.pdf
			var start = (new Date).getTime();

			// we want the timer to finish slightly before the slide transitions
			// so we shorten the duration by 1/4
			var duration 	= this.interval*0.75,
				finish		= start+duration,
				angleStart 	= 0;
			
			
			this.progressTimerPE = new PeriodicalExecuter(function(pe) {
				_this.resetProgressTimer(); // clear the canvas ready for next segment
				this.drawArc(_this.progressTimerCtx,0,360,'rgba(0,0,0,.2)');	// redraw the black bg circle
				
				var time = (new Date).getTime();
				var pos  = time>finish ? 1 : (time-start)/duration;						
									
				// draw the arch passing in the ctx and the degress of the arch
				this.drawArc(_this.progressTimerCtx,-5,Math.floor(( (360) * pos)),'rgba(255,255,255,.8)',true);			
			
				if( (!this.isPlaying()) || time>finish) {	// if we are stopped or we are finished then stop the PE and fade the canvas out
					pe.stop();
					_this.progressTimerEle.fade({
						duration: (_this.interval > 1000) ? (_this.interval/8)/1000 : 0.2,
						afterFinish: function() {
							_this.resetProgressTimer();
						}
					});
				} 						
			}.bind(this),duration/100000);	
		}
	},
	
	/**
	 * resetProgressTimer
	 * @description clears & resets the progress timer <canvas>
	 */
	resetProgressTimer: function() {
		this.progressTimerEle.width = this.progressTimerEle.width;         
	},
	
	/**
	 * stopProgressTimer
	 * @description stops the progress timer and clears the <canvas>
	 */
	stopProgressTimer: function() {			
		this.resetProgressTimer();		
		clearInterval(this.progressTimerPE);						
	},
	
	/**
	 * drawArc 
	 * @param  canvasCtx HTML5 canvas context
	 * @param  {[floating point]} startAngle Angle at which to begin drawing
	 * @param  {[floating point]} endAngle Angle at which to end drawing
	 * @param  {[string]} strokeStyle HTML5 <canvas> stroke style
	 * @description draws a single segment of the arch
	 */
	drawArc: function(canvasCtx,startAngle,endAngle,strokeStyle) {	
		var drawingArc 	= true,
			ctx 		= canvasCtx;
					
		ctx.beginPath();		
		ctx.strokeStyle = strokeStyle;
		ctx.lineCap 	= 'butt';  
		ctx.lineWidth 	= 4;			
		ctx.arc(15,15,10, (Math.PI/180)*(startAngle-90),(Math.PI/180)*(endAngle-90), false); 
		ctx.stroke();	
		var drawingArc = false;			
	},

	cc: function() {
		// catch that comma!
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




