var myshow;

Event.observe(window, "load", function() {
	
	
	/*var myshow = new protoShow('myshow1',{
			interval		:	3000,
			captions		: 	true,
			transitionType	: 	"fade", 
			pauseOnHover	:   true, 
			cc				: 	false
		});*/

	$('myshow1') && $('myshow1').protoShow({
		interval	:	2000,
		captions	: 	true
	});

	
	
});