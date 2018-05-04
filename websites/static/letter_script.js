$(document).ready(function() {

	var ngrams_data = [];
	var letter_counts = [];
	var plot_data = {}; // Maps term -> count, year

	var NGRAMS_DATA_LOADED = false;
	var LETTERS_COUNT_DATA_LOADED = false;

	//
	// Load data
	//
	$.ajax({
		method: "GET",
		url: $SCRIPT_ROOT + "/get_letters_data_ngrams",
		datatype: "JSON",
		cache: true,
		success: function(json) {
			console.log("Success fetching ngrams data");
			ngrams_data = json;
			NGRAMS_DATA_LOADED = true;
		},
		error: function(xhr, text, error) {
			console.log("Error fetching ngrams data")
			console.log(text);
			console.log(error);
		}
	});
	$.ajax({
		method: "GET",
		url: $SCRIPT_ROOT + "/get_letters_data_letters_count",
		datatype: "JSON",
		cache: true,
		success: function(json) {
			console.log("Success fetching letter_counts data");
			letter_counts = json;
			LETTERS_COUNT_DATA_LOADED = true;
		},
		error: function(xhr, text, error) {
			console.log("Error fetching letter_counts data")
			console.log(text);
			console.log(error);
		}
	}); 

	// Search term on Enter press
	$("#phrases-search").on('keypress', function(e) {
		$('#phrases-search').popover('hide');
		if (e.keyCode == 13) {
			if ($(this).val().length > 0) {
				add_plot($(this).val());
			}
		}
	});

	let svg_width = 720,
	svg_height = 500;



	//
	// D3 draw plot
	//

	function lineSegments(data) {
		console.log(data);
		segments = [];
		for (var i = 0; i<data.length - 1; i++) {
			segments.push([data[i], data[i+1]]) 
		}
		return segments;
	}

	let colorScale = d3.scaleOrdinal(d3.schemeCategory10);

	// Setup X
	var xValue = function(d) { return d.year;}, // data -> value
		xScale = d3.scaleLinear().domain([1860,1865]).range([50, svg_width-80]), // value -> display
		xMap = function(d) { return xScale(xValue(d));}, // data -> display
		xAxis = d3.axisBottom().scale(xScale).ticks(6).tickFormat(d3.format("d"));

	// Setup y
	var yValue = function(d) { return d.frequency;}, // data -> value
		yScale = d3.scaleLinear().range([svg_height-40, 5]), // value -> display
		yMap = function(d) { return yScale(yValue(d));}, // data -> display
		yAxis = d3.axisLeft().scale(yScale);

	// Add the graph canvas to the body of the webpage
	var svg = d3.select("#plot-ngramdata").append("svg")
		.attr("width", svg_width)
		.attr("height", svg_height)
	  	.append("g")

	// X-axis
	svg.append("g")
		.attr("id", "letter-x-axis")
		.attr("class", "x-axis")
		.attr("transform", "translate(0," + (svg_height-35) + ")")
		.call(xAxis)
		.append("text")
		.attr("class", "axis-label")
		.attr("x", svg_width/2 - 30)
		.attr("y", 35)
		.text("Year");

	// Y-axis
	svg.append("g")
		.attr("id", "letter-y-axis")
		.attr("class", "y-axis")
		.attr("transform", "translate(50,5)")
		.call(yAxis)
		.append("text")
		.attr("class", "axis-label")
		.attr("transform", "rotate(-90)")
		.attr("x", -svg_height/2 + 50)
		.attr("y", -35)
		.text("Occurrences per letter");

	// Line connecting dots
	var dotConnectLine = d3.line()
	    .x(function(d) { return xMap(d); })
	    .y(function(d) { return yMap(d); });

	// draw legend
	var legend = svg.selectAll(".plot-colorLegend")
		.data(colorScale.domain())
		.enter()
		.append("g")
		.attr("class", "plot-colorLegend")
		.attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });

	// draw legend colored rectangles
	legend.append("rect")
		.attr("x", svg_width - 18)
		.attr("width", 18)
		.attr("height", 18)
		.style("fill", colorScale);

	// draw legend text
	legend.append("text")
		.attr("x", svg_width - 24)
		.attr("y", 9)
		.attr("dy", ".35em")
		.style("text-anchor", "end")
		.text(function(d) { return d;})

	var tooltip = d3.select("body")
		.append("div")
		.style("position", "absolute")
		.style("z-index", "10")
		.style("visibility", "hidden")
		.html(function() {
			return '<div id="letters-tooltip">'+	
						'Term: <span id="letters-tooltip-term"></span><br>'+
						'Frequency: <span id="letters-tooltip-freq">N/A</span><br>'+
						'Year: <span id="letters-tooltip-year">N/A</span>'+
					'</div>';
		});

	function add_plot(query) {
		let granularity = "year";

		let words = query.split(" ");
		let ngram_size = words.length - 1;
		let term = words.join();

		let term_data = ngrams_data[ngram_size][term];

		// Make sure term exists in dataset
		if (term_data == null) {
			$('#phrases-search').popover('show');
			return;
		}

		var term_max_freq = 0;
		plot_data[term] = [];
		if (granularity == 'year') {
			for (var year = 0; year<term_data.length; year++) {
				let frequency = Math.round(term_data[year]/letter_counts[year] * 100)/100;
				term_max_freq = Math.max(term_max_freq, frequency);
				plot_data[term].push({ 'query' : query, 'year' : year + 1860, 'frequency' : frequency });
			}
		}
		else if (granularity == 'month') {
			// Month
		}
		else {
			// Season
		}

		// Readjust Y-Axis domain
		let current_y_max = yScale.domain()[1];
		yScale.domain([0, Math.max(current_y_max, term_max_freq + 2)]);
		d3.select("#letter-y-axis").call(yAxis);

		// Draw dots
		/// Flatten plot data so not a dictionary anymore (just one array of all points clumped together)
		var flat_plot_data = [];
		for (var key in plot_data) {
			data_points = plot_data[key];
			flat_plot_data = flat_plot_data.concat(data_points);
		}
		console.log(plot_data);
		//// Draw scatter plot
		svg.selectAll(".plot-dot")
			.data(flat_plot_data)
			.enter()
			.append("circle")
			.attr("class", "plot-dot")
			.attr("r", 3.5)
			.attr("cx", function(d) {
				return xMap(d);
			})
			.attr("cy", function(d) {
				return yMap(d);
			})
			.style("fill", function(d) {
				return colorScale(d.query);
			})
			.on('mouseover', function(d) {
				d3.select(this).classed("plot-dot-hover", true);
				$("#letters-tooltip-term").text(d.query);
				$("#letters-tooltip-year").text(d.year);
				$("#letters-tooltip-freq").text(d.frequency);
				tooltip.style("visibility", "visible");
			})
			.on("mousemove", function(d) {
				tooltip.style("top", (event.pageY-10)+"px").style("left",(event.pageX+10)+"px");
			})
			.on("mouseout", function(d) {
				$("#letters-tooltip-year").text("");
				$("#letters-tooltip-freq").text("");
				d3.select(this).classed("plot-dot-hover", false);
				tooltip.style("visibility", "hidden");
			});;

		// Draw lines connecting dots
		//// Flatten plot_data into an array containing arrays with each point for a term in a subarray only with other points for that term
		var flat_line_data = [];
		for (var key in plot_data) {
			data_points = plot_data[key];
			flat_line_data.push(data_points);
		}
		var lineContainers = svg.selectAll(".plot-line-container")
			.data(flat_line_data)
			.enter()
			.append('g')
			.attr('class', 'plot-line-container')

	    lineContainers.selectAll(".plot-line")
	    	.data(lineSegments)
	    	.enter()
	    	.append("path")
	        .attr("class", "plot-line")
	        .attr("d", dotConnectLine)
			.style("stroke", function(d) {
				return colorScale(d.query);
			})
			.style("fill", "none");
	}
});