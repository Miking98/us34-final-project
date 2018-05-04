$(document).ready(function() {
	let CIVIL_WAR_START_YEAR = 1861;
	let DEFAULT_GREY = '#dadaeb';
	var UA_DATA_LOADED = false;
	var D3_DATA_LOADED = false;



	//
	// Datasets
	//
	let data = [ ['Alabama', '8.1', 'Law', '15.11', 'Yes'], ['Alaska', '19.4', 'Forbidden', '6.83', 'Yes'], ['Arizona', '5.2', 'Limited', '11.89', 'Nay'], ['Arkansas', '6.1', 'Law', '7.83', 'Nay'], ['California', '16.9', 'None', '3.41', 'Yes'], ['Colorado', '11', 'Forbidden', '3.39', 'None'], ['Connecticut', '17.9', 'Forbidden', '2.66', 'Yes'], ['Delaware', '11.2', 'Forbidden', '5.35', 'None'], ['Florida', '6.6', 'Law', '21.35', 'Nay'], ['Georgia', '5', 'Law', '6.28', 'Nay'], ['Hawaii', '22.9', 'Forbidden', '1.13', 'Yes'], ['Idaho', '5.8', 'Forbidden', '6.98', 'Yes'], ['Illinois', '15.8', 'Forbidden', '1.98', 'Yes'], ['Indiana', '9.7', 'Forbidden', '9.84', 'Yes'], ['Iowa', '8.6', 'Forbidden', '2.32', 'None'], ['Kansas', '10.1', 'Limited', '4.29', 'None'], ['Kentucky', '12.8', 'Law', '26.15', 'None'], ['Louisiana', '5.4', 'Law', '6.27', 'Nay'], ['Maine', '14', 'None', '0', 'Yes'], ['Maryland', '11.8', 'Law', '1.14', 'Yes'], ['Massachusetts', '13.3', 'Forbidden', '0.83', 'Yes'], ['Michigan', '16.8', 'Forbidden', '2.24', 'Yes'], ['Minnesota', '15.9', 'Forbidden', '7.34', 'Yes'], ['Mississippi', '7', 'Law', '15.86', 'Nay'], ['Missouri', '10.1', 'Law', '5.78', 'Nay'], ['Montana', '13.6', 'None', '4.8', 'Yes'], ['Nebraska', '9.1', 'None', '2.63', 'Yes'], ['Nevada', '14.6', 'None', '2.07', 'Split'], ['New Hampshire', '13', 'None', '5.6', 'Yes'], ['New Jersey', '17.1', 'Forbidden', '11.76', 'Yes'], ['New Mexico', '8.3', 'Limited', '1.57', 'Yes'], ['New York', '25.3', 'Forbidden', '5.28', 'None'], ['North Carolina', '4', 'Law', '4.71', 'Nay'], ['North Dakota', '6.8', 'None', '2.03', 'Yes'], ['Ohio', '13.8', 'Forbidden', '2.32', 'Yes'], ['Oklahoma', '7.1', 'Law', '6.77', 'Yes'], ['Oregon', '15.7', 'None', '2.62', 'Yes'], ['Pennsylvania', '13', 'Forbidden', '2.46', 'Yes'], ['Rhode Island', '17.2', 'Forbidden', '2.03', 'Yes'], ['South Carolina', '3.9', 'Law', '3.84', 'Nay'], ['South Dakota', '6.7', 'None', '3.9', 'Yes'], ['Tennessee', '6.4', 'Law', '21.27', 'Nay'], ['Texas', '5.8', 'Law', '6.17', 'Yes'], ['Utah', '5.4', 'None', '3.18', 'Yes'], ['Vermont', '12.1', 'None', '0', 'None'], ['Virginia', '5.8', 'Law', '21.9', 'Nay'], ['Washington', '20.2', 'Forbidden', '3.71', 'Yes'], ['West Virginia', '11.9', 'Law', '3.55', 'Split'], ['Wisconsin', '9', 'Forbidden', '8.75', 'Yes'], ['Wyoming', '6.7', 'Limited', '17.18', 'Yes'] ];
	let confederate = [ 'Texas', 'Arkansas', 'Louisiana', 'Tennessee', 'Mississippi', 'Alabama', 'Georgia', 'Florida', 'South Carolina', 'North Carolina', 'Virginia'];
	let border = [ 'Maryland', 'Delaware', 'West Virginia', 'Kentucky', 'Missouri'];
	let union = [ 'Maine', 'New York', 'New Hampshire', 'Vermont', 'Massachusetts', 'Connecticut', 'Rhode Island', 'Pennsylvania', 'New Jersey', 'Ohio', 'Indiana', 'Illinois', 'Kansas', 'Michigan', 'Wisconsin', 'Minnesota', 'Iowa', 'California', 'Nevada', 'Oregon' ];

	//
	// D3
	//
	

	// Selections
	let year_map = [ '1860', '1954', '1964', '2017']
	d3.select("#yearSlider").on("input", function() {
		let val = +this.value;
		$("#yearSlider-text").text(year_map[val]);
		draw_map();
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
		return $("#yearSlider").val(); // Get the 5 in 1850 as the year number
	}
	
	let colorScale = d3.scaleLinear()
			  .range(["#ff0000","#bf42f4","#0000ff","grey"])
			  .domain([0,1,2,3]);
	let colorScale_civilWar_legendText = ['Confederate', 'Border State (Union)', 'Union', 'N/A'];
	let colorScale_edu_legendText = ['State-wide law', 'Local choice', 'Forbidden', 'N/A'];
	let colorScale_civilRights_legendText = ['Nay', 'Split', 'Yeah', 'N/A'];

	function color_civilWar(value) {
		if ($.inArray(value, confederate)>=0) {
			// Confederate
			return colorScale(0);
		}
		else if ($.inArray(value, border)>=0) {
			// Border
			return colorScale(1);
		}
		else if ($.inArray(value, union)>=0) {
			// Union
			return colorScale(2);
		}
		else {
			return colorScale(3);
		}
	}
	function color_edu(value) {
		for (var i = 0; i<data.length; i++) {
			let state = data[i][0];
			if (state == value) {
				// Found correct state
				let val = data[i][2];
				if (val == "Law") {
					return colorScale(0);
				}
				else if (val == "Limited") {
					return colorScale(1);
				}
				else if (val == "Forbidden") {
					return colorScale(2);
				}
				else if (val == "None") {
					return colorScale(3);
				}
				else {
					return colorScale(3);
				}
				break;
			}
		}
	}
	function color_civilRights(value) {
		for (var i = 0; i<data.length; i++) {
			let state = data[i][0];
			if (state == value) {
				// Found correct state
				let val = data[i][4];
				if (val == "Nay") {
					return colorScale(0);
				}
				else if (val == "Yes") {
					return colorScale(2);
				}
				else if (val == "Split") {
					return colorScale(1);
				}
				else {
					return colorScale(3);
				}
				break;
			}
		}
	}
	function color_modernFelon(value) {
		for (var i = 0; i<data.length; i++) {
			let state = data[i][0];
			if (state == value) {
				// Found correct state
				let val = data[i][3];
				break;
			}
		}
		
	}

	var svg_width = 720,
	svg_height = 500;

	var projection = d3.geoAlbers()
		.scale(1000)
		.translate([svg_width / 2, svg_height / 2]);

	var path = d3.geoPath()
		.projection(projection);

	var svg = d3.select("#map-uadata").append("svg")
		.attr("width", svg_width + 200)
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

	var legend = svg.append("g")
      			.attr("class", "legend")
     			.attr("width", 140)
    			.attr("height", 200)
    			.attr("transform", "translate(700,300)")
   				.selectAll("g")
   				.data(colorScale.domain().slice())
   				.enter()
   				.append("g")
     			.attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });

  	legend.append("rect")
		  .attr("width", 18)
		  .attr("height", 18)
		  .style("fill", colorScale);

  	legend.append("text")
			.attr("class", "modern-legend-text")
			.data(colorScale_civilWar_legendText)
			.attr("x", 24)
			.attr("y", 9)
			.attr("dy", ".35em")
			.text(function(d) { return d; });

	d3.json("https://s3.amazonaws.com/us34finalproject/us_states.json", function(us) {

		svg.selectAll("path")
			.data(us.features)
			.enter()
			.append("path")
			.attr("d", path)
			.style("stroke", "#fff")
			.style("stroke-width", "1")
			.style("fill", function(d) {
				// Get data value
				let year = getSelection_currentYear();
				let state = d.properties.name;
				console.log(d.properties.name);
				if (year == 0) {
					// Civil War
					return color_civilWar(state);
				} 
				else if (year == 1) {
					// 1954 education
					return color_edu(state);
				} 
				else if (year == 2) {
					// 1964 civil rights bill
					return color_civilRights(state);
				} 
				if (year == 3) {
					// Modern felon disenfranchisement
					return color_modernFelon(state);
				} 
				else {
					//If state is undefined…
					return "grey";
				}
			})
			.on('mouseover', function(d) {
				d3.select("#selected-state").text(d.properties.name);
				d3.select(this).classed("state-hover", true);
			})
			.on("mouseout", function(d) {
				d3.select("#selected-state").text("");
				d3.select(this).classed("state-hover", false);
			});
	});

	function draw_map() {
		let year = getSelection_currentYear();

		let color_func = color_civilWar;
		let color_legend = colorScale_civilWar_legendText;
		if (year == 0) {
			// Civil War
			color_func = color_civilWar;
			color_legend = colorScale_civilWar_legendText;
		} 
		else if (year == 1) {
			// 1954 education
			color_func = color_edu;
			color_legend = colorScale_edu_legendText;
		} 
		else if (year == 2) {
			// 1964 civil rights bill
			color_func = color_civilRights;
			color_legend = colorScale_civilRights_legendText;
		} 
		else if (year == 3) {
			// Modern felon disenfranchisement
			color_func = color_modernFelon;
			color_legend = color_modern_legendText;
		}

		svg.selectAll("path")
			.style("stroke", "#fff")
			.style("stroke-width", "1")
			.style("fill", function(d) {
				// Get data value
				let state = d.properties.name;
				return color_func(state);
			});

	  	legend.selectAll(".modern-legend-text")
	  		.remove();

	  	if (year == 3) {
	  		// Modern trends
	  	}
	  	else {
	  		legend.append("text")
	  			.attr("class", "modern-legend-text")
		  		.data(color_legend)
				.attr("x", 24)
				.attr("y", 9)
				.attr("dy", ".35em")
				.text(function(d) { return d; });
		}
	}
});

function format_decimal(n) {
	return Math.round(n*1000)/10;
}