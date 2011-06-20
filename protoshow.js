/*  ProtoShow JavaScript slide show, 
 *	v 0.6 (alpha) - 12/06/11
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
			buildControls		: true,
			stopOnHover			: true,
			captions			: false,
			captionsElement		: '.slide-caption',
			timer				: true
			
		}, options || {}); // We use Prototype's Object.extend() to overwrite defaults with user preferences 

		


		// get/set various variables
		this.element 			= 	$(element);											// DOM element that contains the slideshow
		this.slides 			= 	this.element.select(this.options.selector);			// Elements that are to be the "Slides"		
		this.slidesLength		=	this.slides.size();		// Total number of Slides
		this.interval 			= 	this.options.interval;								// Interval delay between swapping the Slides
		this.currentSlideID 	= 	this.options.initialSlide - 1;		
		this.nextSlideID		=	this.currentSlideID++;
		this.mode				= 	this[this.options.mode];							// Get play "mode" (forward, backward, random...etc)
		this.masterTimer		=	false;

		// let's get things going!		
		this.play();
		
	},


	/* DIRECTIONAL CONTROLS
	------------------------------------------------*/

	play: function() {
		console.log("Playing");
		this.reportSlides();
		var _this = this;		
		this.masterTimer	=	new PeriodicalExecuter(function(pe) {
		  	_this.mode();		    
		}, this.interval/1000);
	},

	stop: function() {
		// Entirely stops the show and clears the timer
		var _this = this;
		console.log("Stopping");
		_this.masterTimer.stop();
		_this.masterTimer = null;
	},

	forward: function() {
		// Runs slideshow "forwards"
		console.log("Forward");
		this.goMaster( this.currentSlideID + 1 );
	},

	backward: function() {
		// Runs slideshow "backwards"
		console.log("Backward");		
		this.goMaster( this.currentSlideID - 1 );	
	},

	goMaster: function(next) {
		// Master function - controls delegation of slide swapping	
		console.log("Swapping slides: C: " + this.currentSlideID + " for N: " + next);
		this.setNextIndex(next);

	},



	/* UTILITY FUNCTIONS
	------------------------------------------------*/

	isPlaying: function() {
		return this.masterTimer != null;
	},

	setNextIndex: function(next) {
		this.nextSlideID = next;	
	},


	
	


	/* LOGGING FUNCTIONS
	------------------------------------------------*/

	reportSlides: function() {
		console.log(this.currentSlideID);
		console.log(this.nextSlideID);	
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




