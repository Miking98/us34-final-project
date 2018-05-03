$(document).ready(function() {

	var ngrams_data = [];
	var letter_counts = [];
	var plot_data = [];

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
		if (e.keyCode == 13) {
			add_plot($(this).val());
		}
	});

	let svg_width = 720,
	svg_height = 500;

	let colorScale = d3.scaleOrdinal(d3.schemePaired);


	//
	// D3 draw plot
	//

	// Setup X
	var xValue = function(d) { return d.year;}, // data -> value
		xScale = d3.scaleLinear().domain([1860,1865]).range([0, svg_width-80]), // value -> display
		xMap = function(d) { return xScale(xValue(d));}, // data -> display
		xAxis = d3.axisBottom().scale(xScale).ticks(6).tickFormat(d3.format("d"));

	// Setup y
	var yValue = function(d) { return d.frequency;}, // data -> value
		yScale = d3.scaleLinear().range([svg_height-40, 0]), // value -> display
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
		.attr("transform", "translate(50," + (svg_height-35) + ")")
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

	function add_plot(query) {
		let granularity = "year";

		let words = query.split(" ");
		let ngram_size = words.length - 1;
		let term = words.join();

		let term_data = ngrams_data[ngram_size][term];
		let term_max_freq = 0;
		console.log(term_data);

		if (granularity == 'year') {
			for (var year = 0; year<term_data.length; year++) {
				let frequency = term_data[year]/letter_counts[year];
				term_max_freq = Math.max(term_max_freq, frequency);
				plot_data.push({ 'term' : query, 'year' : year + 1860, 'frequency' : frequency });
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
		yScale.domain([0, Math.max(current_y_max, term_max_freq)]);
		d3.select("#letter-y-axis").call(yAxis);

		console.log(plot_data);
		// draw dots
		svg.selectAll(".plot-dot")
			.data(plot_data)
			.enter()
			.append("circle")
			.attr("class", "plot-dot")
			.attr("r", 3.5)
			.attr("cx", xMap)
			.attr("cy", yMap)
			.style("fill", function(d) {
				return colorScale(d);
			});
	}

});