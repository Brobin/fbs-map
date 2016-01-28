
function Team(city, name, state, team, lat, lng) {
    var self = this;
    self.city = city;
    self.name = name;
    self.state = state;
    self.team = team;
    self.lat = lat;
    self.lng = lng;

    self.coords = [self.lat, self.lng];

    self.onClick = function(){
        map.panTo(self.coords);
        self.point.openPopup();
    }

    self.point = L.marker(
        self.coords
    ).bindPopup(
        self.team + " " + self.name
    ).on("click", function(){
        self.onClick()
    });
}

function Conference(name, teams) {
    var self = this;
    self.name = name;
    self.teams = teams;

    self.layerGroup = ko.computed(function(){
        var teams = new L.LayerGroup();
        ko.utils.arrayForEach(self.teams, function(team){
            team.point.addTo(teams);
        });
        return teams;
    });
}

function FootballViewModel(conferences) {
    var self = this;
    self.conferences = ko.observable(conferences);
    self.teams = ko.observable([]);

    self.conferenceLayers = ko.computed(function(){
        var layers = {}
        ko.utils.arrayForEach(self.conferences(), function(conf){
            layers[conf.name] = conf.layerGroup().addTo(map);
        });
        return layers;
    });

   

    self.updateTeams = function(){
        var _teams = [];
        ko.utils.arrayForEach(self.conferences(), function(conf){
            ko.utils.arrayForEach(conf.teams, function(team){
                var id = team.point._leaflet_id;
                if(map._layers.hasOwnProperty(id)) {
                    _teams.push(team);
                }
            });
        });
        _teams.sort(function(a, b){
            if (a.team < b.team){
                return -1;
            } else if (a.team > b.team){
                return 1;
            } else {
                return 0;
            }
        })
        self.teams(_teams);
    }

    self.generateMap = function() {
        var attr = 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
                '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
                'Imagery &copy; <a href="http://mapbox.com">Mapbox</a>';
        var url = 'https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpandmbXliNDBjZWd2M2x6bDk3c2ZtOTkifQ._QA7i5Mpkd_m30IGElHziw';

        var street = L.tileLayer(url, {maxZoom: 18, attribution: attr, id: 'mapbox.streets'}).addTo(map);
        var pirate = L.tileLayer(url, {maxZoom: 18, attribution: attr, id: 'mapbox.pirates'});
        var satellite = L.tileLayer(url, {maxZoom: 18, attribution: attr, id: 'mapbox.satellite'});

        map.setView([40.8106, -96.6803], 4);
        
        L.control.layers(
            {
                "Default": street,
                "Pirate": pirate,
                "Satellite": satellite,
            },
            self.conferenceLayers(),
            {collapsed: false}
        ).addTo(map);

        map.on("click", function(e){
            viewModel.updateTeams();
        }).on('layeradd', function(e) {
            viewModel.updateTeams();
        }).on('layerremove', function(e) {
            viewModel.updateTeams();
        });

        viewModel.updateTeams();
    }
}
