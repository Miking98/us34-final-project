$(document).ready(function() {
	let CIVIL_WAR_START_YEAR = 1861;
	let DEFAULT_GREY = '#dadaeb';
	var UA_DATA_LOADED = false;
	var D3_DATA_LOADED = false;



	//
	// Datasets
	//
	let segregated = [ '' ]
	let felon_disenfranchisement = ['']



	//
	// D3
	//
	

	// Selections
	d3.select("#yearSlider").on("input", function() {
		$("#yearSlider-text").text(this.value);
		if (UA_DATA_LOADED && D3_DATA_LOADED) {
			draw_map();
		}
	});

	$("#infoColoring-container input[name=infoColoring-radio]").change(function() {
		let coloring = getSelection_infoColoring();
		if (UA_DATA_LOADED && D3_DATA_LOADED) {
			draw_map();
			if (coloring == "property") {
				d3.select("#map-uadata-legendTitle").text('Color Scale (in USD)');
			}
			else {
				d3.select("#map-uadata-legendTitle").text('Color Scale (in years)');
			}
		}
	});

	function yearMatch(d, i) {
		// var m = month[d.id];
		// if (inputValue == m) {
		// 	this.parentElement.appendChild(this);
		// 	return "red";
		// }
		// else {
		// 	return "#999";
		// }
	}

	function getSelection_currentYear() {
		return 6; // $("#yearSlider").val().substring(2,3); // Get the 5 in 1850 as the year number
	}

	function getSelection_infoColoring() {
		return $("#infoColoring-container input[name=infoColoring-radio]:checked").val();
	}

	var svg_width = 720,
	svg_height = 500;

	var projection = d3.geoAlbers()
		.scale(1000)
		.translate([svg_width / 2, svg_height / 2]);

	var path = d3.geoPath()
		.projection(projection);

	var svg = d3.select("#map-uadata").append("svg")
		.attr("width", svg_width)
		.attr("height", svg_height);

	var g = svg.append("g")
			.attr("class", "nation");

	var tooltip = d3.select("body")
		.append("div")
		.style("position", "absolute")
		.style("z-index", "10")
		.style("visibility", "hidden")
		.html(function() {
			return '<div id="county-tooltip">'+	
						'<strong>County: </strong><span id="county-tooltip-name"></span><br>'+
						'<span id="county-tooltip-noInfo">No info</span>'+
						'<div id="county-tooltip-info-container">'+
							'<strong>Average age: </strong><span id="county-tooltip-averageAge">N/A</span><br>'+
							//'<strong>Literacy rate: </strong><span id="county-tooltip-literacy">N/A</span><br>'+
							'<strong>Average property value: </strong><span id="county-tooltip-averageProperty">N/A</span><br>'+
							//'<strong>White: </strong><span id="county-tooltip-whitePercent">N/A</span><br>'+
							//'<strong>Married: </strong><span id="county-tooltip-maritalStatus">N/A</span>'+
						'</div>'+
					'</div>';
		});

	d3.json("https://s3.amazonaws.com/us34finalproject/us_states.json", function(us) {

		// County Names
		// var nameById = {}; // Maps: County ID -> County Name
		// county_names.forEach(function(d) {
		// 	nameById[d.id] = d.name;
		// });

		svg.selectAll("path")
			.data(us.features)
			.enter()
			.append("path")
			.attr("d", path)
			.style("stroke", "#fff")
			.style("stroke-width", "1")
			.style("fill", function(d) {
				// Get data value
				var value = d.properties.visited;

				if (value) {
					//If value exists…
					return color(value);
				} 
				else {
					//If value is undefined…
					return "rgb(213,222,217)";
				}
			});
	});
});

function format_decimal(n) {
	return Math.round(n*1000)/10;
}