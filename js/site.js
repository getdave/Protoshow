document.observe("dom:loaded", function() {
	
	/*var primaryShow = new protoShow('myshow1',{
			interval	:	5000,
			captions	: 	true
		});*/

	$('myshow1').protoShow({
		interval	:	5000,
		captions	: 	true
	});
	
});