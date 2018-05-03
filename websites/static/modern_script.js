$(document).ready(function() {
	let CIVIL_WAR_START_YEAR = 1861;
	let DEFAULT_GREY = '#dadaeb';
	var UA_DATA_LOADED = false;
	var D3_DATA_LOADED = false;

	var ua_dataset = null;
	var ua_bycounty_dataset = null;
	var ua_bycounty_stats = null;
	map_state_to_FIPS = reverse_array_keys({ "01" : "AL", "02" : "AK", "04" : "AZ", "05" : "AR", "06" : "CA", "08" : "CO", "09" : "CT", "10" : "DE", "11" : "DC", "12" : "FL", "13" : "GA", "15" : "HI", "16" : "ID", "17" : "IL", "18" : "IN", "19" : "IA", "20" : "KS", "21" : "KY", "22" : "LA", "23" : "ME", "24" : "MD", "25" : "MA", "26" : "MI", "27" : "MN", "28" : "MS", "29" : "MO", "30" : "MT", "31" : "NE", "32" : "NV", "33" : "NH", "34" : "NJ", "35" : "NM", "36" : "NY", "37" : "NC", "38" : "ND", "39" : "OH", "40" : "OK", "41" : "OR", "42" : "PA", "44" : "RI", "45" : "SC", "46" : "SD", "47" : "TN", "48" : "TX", "49" : "UT", "50" : "VT", "51" : "VA", "53" : "WA", "54" : "WV", "55" : "WI", "56" : "WY" });

	//
	// Load data
	//
	 $.ajax({
		method: "GET",
		url: $SCRIPT_ROOT + "/get_ua_data",
		datatype: "JSON",
		cache: true,
		success: function(json) {
			console.log("Success fetching UA data");
			console.log(json[0]);
			ua_dataset = json;
			ua_bycounty_dataset = {};
			ua_bycounty_stats = {}
			// Set up By_County dictionaries
			ua_dataset.forEach(function(record) {
				// Convert ICSPR county ID to TopoJSON county ID
				id = map_ua_to_topo(record.gen_ctynam_icpsr_6, record.stanam_6);
				if (id == null) {
					return;
				}
				// If haven't seen this county before, add it to dataset
				if (!(id in ua_bycounty_dataset)) {
					ua_bycounty_dataset[id] = [];
					ua_bycounty_stats[id] = {};
				}
				// Add record to this county
				ua_bycounty_dataset[id].push(record);
			});
			// Generate By_County stats
			gen_county_stats();
			if (D3_DATA_LOADED) {
				draw_map();
			}
			UA_DATA_LOADED = true;
		},
		error: function(xhr, text, error) {
			console.log("Error fetching UA data")
			console.log(text);
			console.log(error);
		}
	}); 

	function gen_county_stats() {
		for (var county_id in ua_bycounty_dataset) {
			county_info = ua_bycounty_dataset[county_id];

			// Total number of records in county
			var total = county_info.length;

			// Loop through each record, and count totals of each category for each county
			var illiterateCount = { 5 : 0, 6 : 0 }; // [0] = Year, [1] = Count
			var totalBirthYear = 0;
			var totalBirthYearCount = 0;
			var averagePersonalProperty = { 6: 0, 7: 0 };
			var averagePersonalPropertyCount = { 6: 0, 7: 0};
			var marriedCount = {5: 0, 6 : 0, 8: 0}; // [0] = Year, [1] = Count
			var skinColorCount = { 'W' : 0, 'B' : 0, 'M' : 0, 'I' : 0 }; // [0] = Skin Color, [1] = Count
			county_info.forEach(function(record) {
				// Literacy
				for (var year in illiterateCount) {
					var data_point = record['recill_'+year];
					if (data_point != null && data_point == 'X') {
						illiterateCount[year] += 1;
					}
				}
				// Age
				var data_point = record['recbyr_0'];
				if (data_point != null) {
					// Filter out obviously faulty data
					int_data_point = parseInt(data_point)
					if (int_data_point > 1770 && int_data_point < 1880) {
						totalBirthYear += parseInt(data_point);
						totalBirthYearCount += 1;
					}
				}
				// Skin color
				var data_point = record['reccol_6'];
				if (data_point != null) {
					skinColorCount[data_point] += 1;
				}
				// Married
				for (var year in marriedCount) {
					var data_point = record['recmar_'+year];
					if (data_point != null && data_point == 'X') {
						marriedCount[year] += 1;
					}
				}
				// Personal property
				for (var year in averagePersonalProperty) {
					var data_point = record['recprp_'+year];
					if (data_point != null) {
						averagePersonalProperty[year] += parseInt(data_point);
						averagePersonalPropertyCount[year] += 1;
					}
				}
			});
			for (var year in averagePersonalProperty) {
				averagePersonalProperty[year] = averagePersonalProperty[year]/averagePersonalPropertyCount[year];
			}
			var averageBirthYear = totalBirthYearCount > 0 ? parseInt(totalBirthYear/totalBirthYearCount) : null;

			// Store county-wide stats
			ua_bycounty_stats[county_id] = {
				'total' : total,
				'illiterateCount' : illiterateCount,
				'averageBirthYear' : averageBirthYear,
				'averagePersonalProperty' : averagePersonalProperty,
				'skinColorCount' : skinColorCount,
				'marriedCount' : marriedCount
			}
		}
		// console.log("UA By county dataset")
		// console.log(ua_bycounty_dataset);
		// console.log("UA By county stats")
		// console.log(ua_bycounty_stats);
	}

	function map_ua_to_topo(ua_ctynam, ua_statnam) {
		if (ua_ctynam == null || ua_statnam == null) {
			return null;
		}
		ua_ctynam = ua_ctynam.toString();
		ua_statnam = ua_statnam.toString();
		let state = map_state_to_FIPS[ua_statnam];
		if (state.substring(0,1) == '0') {
			// Remove preceding 0 if '01'
			state = state.substring(1);
		}
		// Add 0's to front if length of ua_ctynam < 4 - NOTE: Must come before the remove trailing 0 step
		if (ua_ctynam.length == 2) {
			ua_ctynam = '00' + ua_ctynam;
		}
		else if (ua_ctynam.length == 3) {
			ua_ctynam = '0' + ua_ctynam;
		}
		// Remove the trailing 0 from ICPSR
		ua_ctynam = ua_ctynam.substring(0,ua_ctynam.length - 1);
		return state + ua_ctynam;
	}



	//
	// D3
	//



	var inputValue = null;

	d3.select("#yearSlider").on("input", function() {
		$("#yearSlider-text").text(this.value);
		if (UA_DATA_LOADED && D3_DATA_LOADED) {
			draw_map();
		}
	});

	$("#infoColoring-container input[name=infoColoring-radio]").change(function() {
		if (UA_DATA_LOADED && D3_DATA_LOADED) {
			draw_map();
		}
	})

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
	svg_height = 400;

	var projection = d3.geoMercator()
		.center([0, 42])
		.rotate([80, 0])
		.scale(1240)
		.translate([svg_width / 2, svg_height / 2]);

	var path = d3.geoPath()
		.projection(projection);

	var svg = d3.select("#map-uadata").append("svg")
		.attr("width", svg_width)
		.attr("height", svg_height);

	var g = svg.append("g")
			.attr("class", "nation");

	var defs = svg.append("defs");

	var colorScale = defs.append("linearGradient")
		.attr("id", "map-uadata-colorScale")
		.attr("x1", "0%")
		.attr("y1", "0%")
		.attr("x2", "100%")
		.attr("y2", "0%");

	//Color Legend container
	var mapColorLegend = svg.append("g")
		.attr("id", "map-audata-legend")
		.attr("y", 10)
		.attr("x", 300)
		.attr("transform", "translate(300,10)")

	//Draw the Rectangle
	mapColorLegend.append("rect")
		.attr("id", "map-uadata-colorScaleBar")
		.attr("x", 0)
		.attr("y", 15)
    	.attr("width", 240)
    	.attr("height", 20)
		.style("fill", "url(#map-uadata-colorScale)");
		
	//Append title
	mapColorLegend.append("text")
		.attr("id", "map-uadata-legendTitle")
		.attr("x", 80)
		.attr("y", 5)
		.style("fill", "white")
		.style("font-style", "italic")
		.text("Color Scale");

	//Set scale for x-axis
	var mapColorLegendScaleX = d3.scaleLinear()
		.range([0, 240])
		.domain([0,10]);

	//Define x-axis
	var mapColorScaleGradientBar = d3.axisBottom()
		.ticks(5)  //Set rough # of ticks
		.scale(mapColorLegendScaleX);

	//Set up X axis
	mapColorLegend.append("g")
		.attr("id", "map-uadata-legendTicks")
		.attr("class", "legend-axis")
		.attr("y", 35)
		.attr("transform", "translate(0,35)")
		.call(mapColorScaleGradientBar);

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

	// Queue up datasets using d3 Queue
	d3.queue()
	    .defer(d3.json, "http://duspviz.mit.edu/_assets/data/us.json") // Load US Counties
		.defer(d3.tsv, "https://gist.githubusercontent.com/mbostock/4090846/raw/07e73f3c2d21558489604a0bc434b3a5cf41a867/us-county-names.tsv")
	    .await(ready); // Run 'ready' when JSONs are loaded

	 // Ready Function, runs when D3 data is loaded
	function ready(error, us, county_names) {
		if (error) throw error;

		// County Names
		var nameById = {}; // Maps: County ID -> County Name
		county_names.forEach(function(d) {
			nameById[d.id] = d.name;
		});

		g.selectAll(".county")
			.data(topojson.feature(us, us.objects.counties).features) // Bind TopoJSON data elements
			.enter()
			.append("path")
			.attr("d", path)
			.attr("class", "county")
			.style("fill", function(d) {
				return 0;
			})
			.on("mouseover", function(d) {
				// Tooltip for county
				d3.select("#selected-county").text(nameById[d.id]);
				d3.select(this).classed("county-hover", true);
				var year = getSelection_currentYear();
				tooltip.select("#county-tooltip-name").text(nameById[d.id]);
				if (UA_DATA_LOADED && d.id in ua_bycounty_stats) {
					let county_data = ua_bycounty_stats[d.id];
					// By_County statistics
					let total = county_data['total'];
					//// Age
					let averageAgeAtWarStart = (county_data['averageBirthYear'] != null) ? CIVIL_WAR_START_YEAR - county_data['averageBirthYear'] : 'N/A';
					//// Literacy
					let literacyRate = format_decimal(1 - county_data['illiterateCount'][year]/total);
					//// Skin color
					totalSkinColor = parseInt(county_data['skinColorCount']['W']) + parseInt(county_data['skinColorCount']['B']) + parseInt(county_data['skinColorCount']['I']) + parseInt(county_data['skinColorCount']['M'])
					let whitePercent = format_decimal(county_data['skinColorCount']['W']/totalSkinColor);
					let blackPercent = format_decimal(county_data['skinColorCount']['B']/totalSkinColor);
					let indianPercent = format_decimal(county_data['skinColorCount']['I']/totalSkinColor);
					//// Married
					let marriedPercent = format_decimal(county_data['marriedCount'][year]/total);
					//// Personal property
					let averagePersonalProperty = (county_data['averagePersonalProperty'][year] != null) ? '$' + (Math.round(county_data['averagePersonalProperty'][year]*100)/100).toString() : 'N/A';
					// Tooltip info filling
					//// Show info container
					tooltip.select("#county-tooltip-noInfo").style('display', 'none');
					tooltip.select("#county-tooltip-info-container").style('display', 'block');
					//// Fill in information
					tooltip.select("#county-tooltip-averageAge").text(averageAgeAtWarStart.toString());
					tooltip.select("#county-tooltip-averageProperty").text(averagePersonalProperty.toString());
					//tooltip.select("#county-tooltip-literacy").text(literacyRate.toString() + '%');
					//tooltip.select("#county-tooltip-whitePercent").text(whitePercent.toString() + '%');
					//tooltip.select("#county-tooltip-marriedPercent").text(marriedPercent.toString() + '%');
					console.log(d.id + " " + nameById[d.id]);
					console.log(county_data);
					console.log(ua_bycounty_dataset[d.id]);
				}
				else {
					// Tooltip styling
					//// Show "No info" text
					tooltip.select("#county-tooltip-noInfo").style('display', 'block');
					//// Hide info container
					tooltip.select("#county-tooltip-info-container").style('display', 'none');
				}
				tooltip.style("visibility", "visible");
			})
			.on("mousemove", function(d) {
				tooltip.style("top", (event.pageY-10)+"px").style("left",(event.pageX+10)+"px");
			})
			.on("mouseout", function(d) {
				d3.select("#selected-county").text("");
				d3.select(this).classed("county-hover", false);
				tooltip.style("visibility", "hidden");
			});

		svg.append("path")
			.datum(topojson.mesh(us, us.objects.states, function(a, b) {
				return a.id !== b.id;
			}))
			.attr("class", "state")
			.attr("d", path);

		// Fill in counties with UA data
		if (UA_DATA_LOADED) {
			draw_map();
		}
		D3_DATA_LOADED = true;
	}

	// Runs when UA data and D3 data are loaded - color in map based on UA data
	function draw_map() {
		// Get user selections (determine color of graph)
		let color_by = getSelection_infoColoring();
		let year = getSelection_currentYear();

		// Establish color scale
		//// Range of colors
		let colorScaleRange = [DEFAULT_GREY, "#d4b7ff", "#c8a3ff", "#c298ff", "#bc8eff", "#b07aff", "#a465ff", "#9e5bff", "#9851ff", "#8c3dff", "#7e28fc" ];
		var colorScaleDomain = null;
		//// Domain of values
		if (color_by == 'property') {
			colorScaleDomain = [0, 50, 100, 150, 200, 250, 300, 350, 400, 450];
		}
		else {
			// Age default
			colorScaleDomain = [14, 16, 18, 20, 22, 24, 26, 28, 30];
		}
		var colorScale = d3.scaleThreshold()
			.range(colorScaleRange)
			.domain(colorScaleDomain);

		// Color in map
		d3.selectAll(".county").style("fill", function(d) {
			// Shade in map based on selected parameters
			var val = null;
			if (d.id in ua_bycounty_stats) {
				let county_data = ua_bycounty_stats[d.id];
				// By_County statistics
				let total = county_data['total'];
				// Age
				let averageAgeAtWarStart = (county_data['averageBirthYear'] != null) ? CIVIL_WAR_START_YEAR - county_data['averageBirthYear'] : null;
				// Literacy
				let literacyRate = format_decimal(1 - county_data['illiterateCount'][year]/total);
				//// Married
				let marriedPercent = format_decimal(county_data['marriedCount'][year]/total);
				//// Personal property
				let averagePersonalProperty = (county_data['averagePersonalProperty'][year] != null) ? Math.round(county_data['averagePersonalProperty'][year]*100)/100 : null;
				// Set coloring gradient
				if (color_by == 'property') {
					val = averagePersonalProperty;
				}
				else {
					val = averageAgeAtWarStart;
				}
			}
			// Make sure we have valid value
			if (val == null) {
				return -1;
			}
			return colorScale(val);
		});

		//
		// Show color scale on map
		//
		//// Set axis ticks
		mapColorLegendScaleX.domain([colorScaleDomain[0], colorScaleDomain[colorScaleDomain.length-1]]);
		mapColorScaleGradientBar.scale(mapColorLegendScaleX)
			.ticks(10);
		d3.select("#map-uadata-legendTicks").call(mapColorScaleGradientBar);

		//// Display color scale bar on map
		d3.select("#map-uadata-colorScale").selectAll("stop")
			.data( colorScale.range() )
			.enter().append("stop")
			.attr("offset", function(d,i) { return i/(colorScale.range().length-1); })
			.attr("stop-color", function(d) { return d; });
	}
});

function format_decimal(n) {
	return Math.round(n*1000)/10;
}

function reverse_array_keys(json){
	var ret = {};
	for(var key in json){
		ret[json[key]] = key;
	}
	return ret;
}
