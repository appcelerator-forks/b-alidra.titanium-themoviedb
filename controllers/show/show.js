var moment		= require('alloy/moment'),
	api			= require('themoviedb/themoviedb'),
	config 		= require('t411/config'),
	t411		= new (require('t411/t411'))(
		Ti.App.Properties.getString('t411_username'),
		Ti.App.Properties.getString('t411_password')
	);
	
var TORRENTS_SLIDE_INDEX = 3;

api.common.api_key = '1b3785a9a5de9fd3452af6e32e092357';

var show_id = arguments[0] || {};
var show;

Alloy.Globals.loading.show(L('list_loading'), false);

//$.downloadButtonText.text	= L('download');
$.votes.text				= L('votes').toUpperCase();
$.seasonsTitle.text			= L('seasons');
$.synopsisTitle.text		= L('synopsis');
$.trailersTitle.text		= L('trailer');
$.torrentsTitle.text		= L('torrents');

api.tv.getById({ 'id': show_id, 'language': Titanium.Locale.getCurrentLanguage(), 'append_to_response': 'images,videos,credits', 'include_image_language': Titanium.Locale.getCurrentLanguage() + ',en,null' },
	function(response) {
		if (_.isEmpty(response))
			return false;
		
		show = JSON.parse(response);
		Ti.API.info(response);
		if (_.isEmpty(show.backdrop_path)) {
			$.headerImage.image	= "backdrop.png";
			$.infosWrapper.backgroundColor = "#0D000000";
		}
		else
			$.headerImage.image	= api.common.getImage({'size': 'w500', 'file': show.backdrop_path});
			
		$.poster.image		= api.common.getImage({'size': 'w300', 'file': show.poster_path});
		$.title.text		= show.name;
		$.year.text			= show.first_air_date ? moment(show.first_air_date).format(L('date_format')) : '';
		$.score.text		= show.popularity ? parseInt(show.popularity) + "%" : 0;
		$.nbVotes.text		= show.vote_count ? show.vote_count : 0;
		$.overview.value	= show.overview;
		
		$.cast_images.width = 0;
		
		if (!_.isEmpty(show.genres)) {
			var genres = [];
			_.each(show.genres, function(g) {
				genres.push(g.name);
			});
			$.genres.text = genres.join(' - ');
		}
		
		var seasons = [];
		_.each(show.seasons, function(s) {
			s.show_name		= show.name;
			s.show_id		= show.id;
			s.show_backdrop = show.backdrop_path;
			seasons.push(Widget.createController('show/season_row', s).getView());
		});
		$.seasons.setData(seasons);		
			
		setTimeout(function() {
			if (!_.isEmpty(show.credits.cast)) {
				_.each(show.credits.cast, function(c) {
					if (_.isEmpty(c["profile_path"]))
						return false;
					var cast = Ti.UI.createImageView({
						"class": "cast_image",
						"image" : api.common.getImage({'size': 'w150', 'file': c["profile_path"]}),
						"width": Titanium.UI.SIZE,
						"height": "80dp",
						"right": "5dp",
						"preventDefaultImage": true,
						"borderRadius": 3,
						"person_id": c.id
					});
					$.cast_images.add(cast);
					$.cast_images.width += 55;
					
					cast.addEventListener('click', function(e) {
						var person = Widget.createController('person/person', e.source.person_id).getView();
						person.open({ fullscreen: true });
					});
				});
			}
			else
				$.wrapper.bottom = 0;
		}, 1000);
				
		if (show.videos.length > 0) {
			_.each(show.videos, function(t) {
				if (t.site == "youtube") {
					$.trailer.add(Ti.UI.createWebView({
					    url: 'http://www.youtube.com/embed/' + t.key + '?autoplay=1&autohide=1&cc_load_policy=0&color=white&controls=0&fs=0&iv_load_policy=3&modestbranding=1&rel=0&showinfo=0',
					    enableZoomControls: false,
					    scalesPageToFit: true,
					    scrollsToTop: false,
					    showScrollbars: false,
					    backgroundColor: "#000000",
					    color: "#FFFFFF"
					}));
				}
			});			
		}
		else {
			$.tabs.remove($.trailersWrapper);
		}
		Alloy.Globals.loading.hide();
		
		/* Load english overview if empty in local language */
		if (_.isEmpty($.overview.value) && Titanium.Locale.getCurrentLanguage() != 'en') {
			Alloy.Globals.loading.show(L('list_loading'), false);
			api.tv.getById({ 'id': show_id },
				function(response) {
					if (_.isEmpty(response))
						return false;
					$.overview.value = JSON.parse(response).overview;
					Alloy.Globals.loading.hide();
				},
				function() {
					Alloy.Globals.loading.hide();
					Alloy.createWidget("com.mcongrove.toast", null, {
				    	text: L('cant_connect'),
					    duration: 5000,
					    view: $.wrapper
					});
					
					return false;
				}
			);
		}
	},
	function() {
		Alloy.Globals.loading.hide();
		Alloy.createWidget("com.mcongrove.toast", null, {
	    	text: L('cant_connect'),
		    duration: 5000,
		    view: $.tableList
		});
		
		return false;
	}
);

$.tabs.addEventListener('scrollend', function(e) {
	if (e.currentPage == TORRENTS_SLIDE_INDEX && !$.torrentsWrapper.hasLoadedTorrents) {
		$.torrentsWrapper.hasLoadedTorrents = true;
		Alloy.Globals.loading.show(L('list_loading'), false);

		t411.search({ term: show.name, category: 631 }, function(err, response) {

			if (err) {
				Ti.API.error(err);
				Alloy.Globals.loading.hide(); 
				return false;
			}
				
			if (_.isEmpty(response.torrents)) {
				Alloy.Globals.loading.hide();
				return false;
			}
				
			/* Sort by seeders */
			var sorted_torrents = _.sortBy(response.torrents, function(t) { return - parseInt(t.seeders); });
			
			_.each(sorted_torrents, function(t) {
				/* We use appendRow and not setData so as to keep the list ordered ... */
				$.torrentsList.appendRow(Widget.createController('torrent/torrent', t).getView());
			});
			
			$.torrentsList.animate( { opacity: 1, duration: 1000 });
			Alloy.Globals.loading.hide(); 
		});
	}
});

$.backIcon.addEventListener('click', function() { $.win.close(); });