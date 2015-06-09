var __  = require('alloy/underscore'),
	api	= require('themoviedb/themoviedb');

var args = arguments[0] || {};
for (var i = 0; i < args.length; i++) {
	var arg = args[i];
	var ban = $['banner' + (i+1)];
	ban.show_id = arg.id;
	arg = arg.movie || arg.show || arg;

	if (__.isEmpty(arg.poster_path)) {
		ban.image = 'poster.png';
		$['bannerTitle' + (i+1)].text    = arg.original_title;
		$['bannerTitle' + (i+1)].opacity = 1; 
	}
	else {
		ban.image = api.common.getImage({'size': 'w300', 'file': arg.poster_path});
		$['bannerTitle' + (i+1)].opacity = 0;
	}
	ban.addEventListener('load', function() {
		this.animate({
			opacity : 1,
			duration : 200
		});
	});
}

function selectedMovie(e) {
	var show = Widget.createController('show', e.source.show_id).getView();
	//show.left = Ti.Platform.displayCaps.platformWidth;
	show.open({ fullscreen: true });
}