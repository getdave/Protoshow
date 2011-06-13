/*  ProtoShow JavaScript slide show, 
 *	v 0.6 (beta) - 12/06/11
 *  Copyright(c) 2011 David Smith (web: http://www.aheadcreative.com; twitter: @get_dave)
 *
 *  This work is licenced under the Creative Commons Attribution-No Derivative Works 3.0 Unported License. 
 *	http://creativecommons.org/licenses/by-nd/3.0/ 
 *  
 *	For more information on this project visit:
 *	http://www.deepbluesky.com/protoshow/
 *
 *--------------------------------------------------------------------------*/


var protoShow = Class.create({
	initialize: function(element,options) {
		
		// Default options
		this.options = Object.extend({
			selector			: ".slide",
			interval			: 3000,
			initialSlide		: 1,
			mode				: 'forward',
			autoplay			: true,
			autoRestart			: true,
			transitionTime		: 1.5,
			manTransitionTime	: 0.5,
			stopText			: "Pause",
			playText			: "Play",
			forwardText			: "Next",
			previousText		: "Previous",
			buildNavigation		: true,
			navElements			: ".proto-navigation li",
			buildControls		: false,
			stopOnHover			: true,
			captions			: false,
			captionsElement		: '.slide-caption',
			timer				: true
			
		}, options || {}); // We use Prototype's Object.extend() to overwrite defaults with user preferences 


		



		// Get & set the variables we require for use

		this.element 			= 	$(element);											// DOM element that contains the slideshow
		this.slides 			= 	this.element.select(this.options.selector);			// Elements that are to be the "Slides"		
		this.interval 			= 	this.options.interval;								// Interval delay between swapping the Slides
		this.slideID 			= 	this.options.initialSlide - 1;						// Numeric ref of the initial Slide (collection index)
		this.initialElement 	= 	this.slides[this.slideID];							// DOM ref to the initial Slide
		this.autoplay			= 	this.options.autoplay;								// Auto start the slide show?
		this.autoRestart		=	this.options.autoRestart;							// Auto restart after manually going forward/backward
		this.restart			=	false;
		this.mode				= 	this[this.options.mode];							// Get play "mode" (forward, backward, random...etc)
		this.transitionTime 	= 	this.options.transitionTime;						// Speed of animation
		this.manTransitionTime	=	this.options.manTransitionTime;						// Speed of animation when triggered manually
		this.stopOnHover		=	this.options.stopOnHover;							// Stop the show when hovering?
		this.stopText 			=	this.options.stopText;								
		this.playText			=	this.options.playText;
		this.captions			=	this.options.captions;
		this.captionsElement	=	$$(this.options.captionsElement)[0];
		this.navElements		=	this.options.navElements;
		this.timer				=	this.options.timer;
		
		
		
		if ((this.slides.size() > 1)) {	// check there is more than 1 slide
			this.setupTimer();
			
		
			// PRE-LAUNCH CHECKLIST //
			this.slidesLength									= this.slides.size();		// Total number of Slides
			this.animating 										= false;					// Set base "animating" flag
			this.createControls();															// Build and/or observe controls
			this.createNavigation();														// Build and/or observe navigation
			this.slides.invoke('hide');														// Hide all slides...
			this.initialElement.show().addClassName('active-slide');						// Ensure the initial Slide has active class
			this.createCaptions();	
			this.pauseOnHover();		//	decides if stopOnHover is set an if so pauses show on :hover 
			
			this.isPlaying	= false;	// 	explicity set isPlaying status 
			this.updateControls();		// 	check controls are showing correct status
			
			
			
			
			if ( this.autoplay) {
				// If we are auto playing then trigger the start of the slideshow
				this.play(this.mode);
			}		
	
		}
	},
	
	
	clearTimer: function() {
		// Simply clears the global Timer. Different to stop(); as doesn't affect this.isPlaying variable
		clearTimeout(this.runShow);
	},	

	play: function() {
		//	Plays the show
		if(this.runShow) {
			this.clearTimer();	// clears any left over setTimeout in global
		}	
		//console.info("Playing");		
		this.runShow = setTimeout(this.mode.bind(this),this.interval);		// we set the Show running but this doesn't control the looping
		this.isPlaying = true;
		this.updateControls(true);
		if (this.timer) {
			this.runTimer();
		}
	},		
	
	
	stop: function() {
		// Totally stops the show  - only to be used for stopping, not clearing the timer (see this.clearTimer)
		document.fire("protoShow:stopped");		
		this.clearTimer();
		this.stopTimer();
		this.isPlaying = false;		
		this.updateControls(false);		
	},
	
	forward: function() {
		// Runs slideshow "forwards"
		this.goMaster( this.slideID + 1 );
	},
	
	backward: function(){
		// Runs slideshow "backwards"
		this.goMaster( this.slideID - 1 );
	},
	
	random: function() {
		// Runs slideshow randomly (based on http://www.javascriptkit.com/javatutors/randomnum.shtml)
		var randomnumber = Math.floor(Math.random() * this.slidesLength);
		//console.log("Random number: " + randomnumber);
		if (randomnumber == this.slideID) {
			randomnumber++;
		}		
		this.goMaster( randomnumber );
	},
	
	
	goForward: function() {
		this.clearTimer();								// stop the Timer
		var storeTransition = this.transitionTime;		// store the original Transition time
		this.transitionTime	= this.manTransitionTime;	// set a temporary "manual" fast transition
		
		
		if (!this.autoRestart) {
			// Set variable switch to stop autoRestarting
			this.noRestart = true;
			this.forward();	
			this.stop();
		} else {
			this.forward();	
		}										// go forward 1 slide
		
		if (this.options.mode != "random") {			// if play mode is "random" then don't alter the mode
			this.mode = this.forward;					// ensure we go in the right direction
		}
		this.transitionTime	= storeTransition;			// reset the Transition time to the original
	},
	
	goBackward: function(){
		this.clearTimer();
		var storeTransition = this.transitionTime;
		this.transitionTime	= this.manTransitionTime;
		if (!this.autoRestart) {
			// Set variable switch to stop autoRestarting
			this.noRestart = true;
			this.backward();	
			this.stop();
		} else {
			this.backward();	
		}
		if (this.options.mode != "random") {			// if play mode is "random" then don't alter the mode
			this.mode = this.backward;					// ensure we go in the right direction
		}
		this.transitionTime	= storeTransition;
	},
	
	goToSlide: function(slide) {
		this.clearTimer();
	
		var storeTransition = this.transitionTime;
		this.transitionTime	= this.manTransitionTime;
		var targetSlide = slide;
		// Goes to a specific slide
		this.goMaster( targetSlide );
		this.transitionTime	= storeTransition;
	},

	
	goMaster: function( imageShow ) {
		// Master direction: decides what args to pass to swapSlide();
				
		var imageShow = imageShow;		// Image to be show (args passed from goNext/goPrevious...etc)
		var imageHide = this.slideID;	// Image to be hidden
		
		//console.log("imageShow: " + imageShow);
		//console.log("imageHide: " + imageHide);
		
		
		if ( (imageShow != imageHide) && (!this.animating) ) {		// check current and next slides aren't the same and that we're not already animating
			// Logic to get bounds and ensure everything moves forward/backward correctly
			if (imageShow >= this.slidesLength) {	// if imageShow is outside max length of slides then restart from the first slide 
				this.swapSlide(imageHide,0);	
				this.slideID = 0;					
			} else if (imageShow < 0) {		// else if imageShow is less than 0 then restart show from the last slide
				this.swapSlide(imageHide,this.slidesLength-1);	
				this.slideID = this.slidesLength-1;				
			} else {		// otherwise just swap slides and then set the current slide to be
				this.swapSlide(imageHide,imageShow);		
				this.slideID = imageShow;
			}
			//console.info("Current slideID is: " + this.slideID);
			//console.log("===");
		}
	},

	
	swapSlide: function(x,y) {
		//	Animates between 2 slides "x" & "y"		
		
		var activeSlide = this.slides[x];	// x = currently active slide
		var nextSlide = this.slides[y];		// y = next slide
		
		this.animating = true;		// set the "animating" flag
		nextSlide.show();			// make the next slide visible (CSS keeps it hidden underneath current slide)
		activeSlide.fade({			// transition out current slide
			beforeStart	: function() {
							document.fire("protoShow:transitionStarted");
							this.element.addClassName("animating");
						}.bind(this),
			duration	: this.transitionTime,
			afterFinish	: this.cleanup.bind(this, activeSlide, nextSlide)	// call cleanup function
		});
		this.updateNav(x, y);	// update slide navigation
		this.updateCaptions(y);
		
		
	},
	
	
	cleanup: function(active,next) {
		this.runTimer();
		document.fire("protoShow:transitionFinished");
		// Adds and Removes "active-slide" class once transistion animation is complete
		$(active).removeClassName('active-slide');
		$(next).addClassName('active-slide');
		this.element.removeClassName("animating");
		this.animating = false;		// Resets the "animating" flag
		if ( (!this.noRestart) && (this.isPlaying !== false) ) {		// test to check show has not been explicitly "Stopped"
			this.play();	// loop the show again
		}
		
	},
	
	updateNav: function(active,next) {
		if (this.protoNav != undefined) {
			
			this.protoNav[active].removeClassName('current-slide');
			this.protoNav[next].addClassName('current-slide');
		}
	},
	
	updateControls: function(status) {
		
			if(status !== true) status = false; // Default if not supplied is false
								
			var startStop = this.protoControls.down('.start-stop a');

			// Updates the status of the Play/Pause button		
			if (status) {
				// The show has been started so update the button to "Pause"
				startStop.update(this.stopText).writeAttribute('title','Pause the slide show').addClassName('pause').removeClassName('play');
			} else {			
				// The show has been stopped so update the button to "Play"
				startStop.update(this.playText).writeAttribute('title','Play the slide show').addClassName('play').removeClassName('pause');
			}
		
	},
	
	
	createNavigation: function() {
		// Setup numbered navigation
		if ( (this.options.buildNavigation) && (!this.element.select('.proto-navigation').length) ) {	// check doesn't already exist in the DOM
			// If set in options then build the nav via javascript
			var navOL		=	new Element('ol', { 'class': 'proto-navigation'});
			this.element.insert(navOL,'bottom');
			var navTemplate = 	new Template('<li><a href="##{number}" title="Skip to Slide #{number}">#{number}</a></li>');

			this.slides.each(function(e,index) {		// for each slide in the show create a Nav <li> using the Template above
				var li = navTemplate.evaluate({number: index+1});
				navOL.insert(li,'bottom');
			});
		}
		
		
		if (this.element.select(this.navElements).length) {
			this.protoNav	= 	this.element.select(this.navElements);		// Select the navigation anchors <a>
			this.protoNav[this.slideID].addClassName('current-slide');		// Ensure the initial Nav item has "current-slide" class

			// Adds observers for Slide Show navigation						
			this.protoNav.each(function(e, index) {	//	itterate and pass element & element's index
				this.navObserve(e,index);		//	pass element & element index
			}.bind(this));
		}
	},
	
	createControls: function() {
	
		
			this.protoControls	=  this.element.down('.proto-controls');    // Stop/Forward/Back buttons
			// Adds observers for Slide Show controls  
			var startStop    	=	this.protoControls.down('.start-stop');
			var forward      	=	this.protoControls.down('.forward');
			var backward     	=	this.protoControls.down('.backward');
			
			startStop.observe('click',function(e) {
				e.stop();
				if(this.isPlaying !== true) this.isPlaying = false; // if not "true" then *make sure* it's "false"
				// Work out whether we're "Playing" and react accordingly. 
				if (this.isPlaying) {
					this.stop();	//  if we're "Playing" then stop the show				
				} else {
					this.play();	// else if we're not "Playing" then start the show 				
				}
			}.bind(this));
			
			forward.observe('click', function(e) {
				e.stop();
				this.goForward();
			}.bind(this));
			
			backward.observe('click',function(e) {
				e.stop();
				this.goBackward();
			}.bind(this));
		
	},
	
	
	navObserve: function(e,index) {
		// Temp method to add Observers to nav items
		var i = index;
		e.observe('click',function(event) {
			
			if (!event.element().hasClassName('allow-click')){ // allow designated <a> to be clicked if nav element is an anchor as well
				event.stop();
				this.goToSlide(i);	// when clicked go to slide with index "i"
			}
		}.bind(this));
	},
	
	
	pauseOnHover: function() {

		if (this.stopOnHover) {
			// If true then when mouse enters the show *container* stop the show and when leaves then restart
			var hoverDelay;
			this.element.down('.show').observe('mouseenter',function() {
				hoverDelay = setTimeout(this.stop.bind(this),1000);		// wait a short time before triggering stop();
			}.bind(this)).observe('mouseleave',function() {
				if ( this.autoRestart) {
					// Trigger the start of the slideshow
					clearTimeout(hoverDelay);
					this.play();
				}	
			}.bind(this));
		}
	},	
	
	createCaptions: function() {
		
		if (this.captions) {		
			
			if (!this.captionsElement) {
				var captionEle			=	new Element('p', { 'class' : 'slide-caption'});
				captionEle.addClassName('slide-caption');
				//var captionTag			=	new Element('p');
				this.element.insert(captionEle,'bottom');
				//captionEle.insert(captionTag);			
				this.captionsElement		=	captionEle;
			}						
			
			this.updateCaptions(this.slideID);
		}
			
		
	},
	
	updateCaptions: function(next) {		
		if (this.captions) {
			var nextCaption = this.slides[next].down('img').readAttribute('alt');	
			if (nextCaption.replace(/^\s*|\s*$/g,'').length) {		// check that the attribute has some content (not just spaces)
					
				if(!this.captionsElement.visible()) {
					// just check that the element is visible
					this.captionsElement.show();
				}				
				this.captionsElement.update(nextCaption);	
			} else {	// if no caption is found then hide the caption element
				this.captionsElement.hide();
			}		
		}
	},
	
	setupTimer: function() {	
		/* Create timer <canvas> element, get 2D Context and insert into DOM */
		this.slideTimer = document.createElement('canvas');
		if (this.slideTimer.getContext && this.slideTimer.getContext('2d')) { // test for Canvas support
			this.slideTimer.writeAttribute('class','proto-timer');	
			this.slideTimer.width = 30;
			this.slideTimer.height = 30;
			this.element.insert(this.slideTimer,'bottom');		
			this.timerCtx = this.slideTimer.getContext('2d');
		} else {
			this.timer = false;
		}
	},
	
	
	runTimer: function() {
		if (this.timer) {
			// use Epoch time to ensure code executes in time specified
			// borrowed from Emile JS http://script.aculo.us/downloads/emile.pdf
			var start = (new Date).getTime();
			var duration = this.interval;
			var finish	= start+duration;
			var angleStart = 0;
			
			var timerInternal = setInterval(function(){
				var time = (new Date).getTime();
				var pos  = time>finish ? 1 : (time-start)/duration;			
				
				if (this.isPlaying) {				
					this.drawArc(0,Math.floor(360*pos),'rgba(255,255,255,1)',true);
				}
				if(this.animating || time>finish) {	// if we are animating or we are finished then stop and clear the timer			
					this.stopTimer(timerInternal);

				}
				
			}.bind(this),10);	
		}
	},
	
	
	resetTimer: function() {

		this.slideTimer.width = this.slideTimer.width;         // clears the canvas 	
		
	},
	
	
	drawArc: function(startAngle,endAngle,strokeStyle,shadow) {
		

		this.resetTimer();
		
		this.drawingArc = true;
		
		var ctx = this.timerCtx;	
		
		ctx.beginPath();		
		ctx.strokeStyle = strokeStyle;
		ctx.lineWidth = 3;	
		ctx.arc(15,15,10, (Math.PI/180)*(startAngle-90),(Math.PI/180)*(endAngle-90), false); 
		ctx.stroke();	
		this.drawingArc = false;		
	},

	stopTimer: function(timerInternal) {
		this.resetTimer();
		clearInterval(timerInternal);
		
	}
	
	
	
});




