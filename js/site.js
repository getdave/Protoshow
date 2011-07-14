var myshow;

document.observe("dom:loaded", function() {
	
	
	var myshow = new protoShow('myshow1',{
		interval		:	4000,
		captions		: 	true,
		transitionType	: 	"slide", 
		cc				: 	false
	});

	/*$('myshow1') && $('myshow1').protoShow({
			interval	:	2000,
			captions	: 	true
		});*/
	
});