var myshow;

document.observe("dom:loaded", function() {
	
	
	var myshow = new protoShow('myshow1',{
		interval		:	4000,
		captions		: 	true,
		/*transitionType	:   function() {
					console.log("My custom trans");	
				},*/

		transitionType	: 	"fade", 
		cc				: 	false
	});

	/*$('myshow1') && $('myshow1').protoShow({
			interval	:	2000,
			captions	: 	true
		});*/
	
});