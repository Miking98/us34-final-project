$(document).ready(function() {

	var ngrams_data = [];
	var letter_counts = [];
	var plot_data = {}; // Maps term -> count, year
	var term_colors = {}; // Maps term -> color
	var unique_colors = [ '#00f2a3', '#6300ff', '#f2d8ff', '#f2d8ff', '#ff5f6d', '#ffc371', '#141e30', '#118c8b', '#ff67cd', '#f14d39', '#5c4a72', '#00ffff', '#e86800', '#6b0021', '#ca9785', '#a0db8e', '#008141', '#b24a59', '#925367', '#d2e8e7' ]; // List of 20 unique colors for plots

	var NGRAMS_DATA_LOADED = false;
	var LETTERS_COUNT_DATA_LOADED = false;

	$("#loading-spinner").show();

	//
	// Load data
	//
	$.ajax({
		method: "GET",
		url: $SCRIPT_ROOT + '/get_ngrams_data',
		datatype: "JSON",
		cache: true,
		success: function(json) {
			console.log("Success fetching ngrams data");
			ngrams_data = json;
			NGRAMS_DATA_LOADED = true;
			$("#loading-spinner").hide();
			$("#phrases-search").focus();
		},
		error: function(xhr, text, error) {
			console.log("Error fetching ngrams data")
			console.log(text);
			console.log(error);
			$("#loading-spinner").hide();
			$("#phrases-search").focus();
		}
	});
	$.ajax({
		method: "GET",
		url: 'https://s3.amazonaws.com/us34finalproject/letter_counts_byyear.json',
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

	// Go button clicked
	$("#phrases-search-goButton").click(function() {
		var e = jQuery.Event("keypress");
		e.keyCode = 13;
		$("#phrases-search").trigger(e);
	})

	// Search term on Enter press
	$("#phrases-search").on('keypress', function(e) {
		$('#phrases-search').popover('hide');
		$("#phrases-search").attr('data-content', 'This term is not in the letters dataset.');
		$("#phrases-search-limit").hide();
		if (e.keyCode == 13) {
			if ($(this).val().length > 0) {
				if ($(".phrases-terms-item").length <= 20) {
					let query = $(this).val();
					let words = query.toLowerCase().split(" ");
					let ngram_size = words.length;
					let term = words.join();
					if (ngram_size > 2) {
						$("#phrases-search").attr('data-content', 'A max of two words per phrase is allowed.');
						$("#phrases-search").popover('show');
					}
					else if (term in plot_data) {
						$("#phrases-search").attr('data-content', 'This term is already in the plot.');
						$("#phrases-search").popover('show');
					}
					else {
						let term_data = ngrams_data[ngram_size-1][term];

						// Make sure term exists in dataset
						if (term_data == null) {
							$('#phrases-search').popover('show');
						}
						else {
							add_plot(term, term_data, query);
							$(this).val('');
						}
					}
				}
				else {
					$("#phrases-search-limit").show();
				}
			}
		}
	});

	// Remove term from graph
	$(document.body).on('click', '.phrases-terms-remove', function(e) {
		let parent = $(this).parents('.phrases-terms-item');
		let term = parent.find('.phrases-terms-term').val();
		// Update legend
		parent.remove();
		delete plot_data[term];
		// Clear search bar
		$("#phrases-search").val('');
		// Hide max term error
		$("#phrases-search-limit").hide();
		// Update plot
		draw_plot();
		// Hide white space in Phrases Search bar
		if ($(".phrases-terms-item").length == 0) {
			$("#phrases-terms").addClass("phrases-terms-empty");
		}
		// Add newly freed color to available colors
		let free_color = term_colors[term];
		unique_colors.push(free_color);
		delete term_colors[term];
	});



	//
	// D3 draw plot
	//

	let svg_width = 720,
	svg_height = 500;

	// Setup X
	var xValue = function(d) { return d.year;}, // data -> value
		xScale = d3.scaleLinear().domain([1860,1865]).range([50, svg_width-80]), // value -> display
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
	    .y(function(d) { return yMap(d)+5; });

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

	function add_plot(term, term_data, query) {
		let granularity = "year";

		plot_data[term] = [];
		if (granularity == 'year') {
			for (var year = 0; year<term_data.length; year++) {
				let frequency = Math.round(term_data[year]/letter_counts[year] * 100)/100;
				plot_data[term].push({ 'query' : query, 'year' : year + 1860, 'frequency' : frequency });
			}
		}
		else if (granularity == 'month') {
			// Month
		}
		else {
			// Season
		}

		draw_plot();
	}

	function draw_plot() {
		// Draw dots
		var term_max_freq = 0;
		/// Flatten plot data so not a dictionary anymore (just one array of all points clumped together)
		var flat_plot_data = [];
		for (var key in plot_data) {
			data_points = plot_data[key];
			flat_plot_data = flat_plot_data.concat(data_points);
			// Determine range for Y-axis
			for (var i = 0; i<data_points.length; i++) {
				term_max_freq = Math.max(term_max_freq, data_points[i].frequency);
			}
		}
		//// Readjust Y-Axis domain
		if (term_max_freq == 0) {
			term_max_freq = 1;
		}
		yScale.domain([0, term_max_freq + (0.1*term_max_freq)]);
		d3.select("#letter-y-axis").call(yAxis);
		//// Draw scatter plot
		svg.selectAll(".plot-dot")
			.data(flat_plot_data)
			.attr("cx", function(d) {
				return xMap(d);
			})
			.attr("cy", function(d) {
				return yMap(d)+5;
			})
			.style("fill", function(d) {
				return uniqueColor(d.query);
			})
			.enter()
			.append("circle")
			.attr("class", "plot-dot")
			.attr("r", 3.5)
			.attr("cx", function(d) {
				return xMap(d);
			})
			.attr("cy", function(d) {
				return yMap(d)+5;
			})
			.style("fill", function(d) {
				return uniqueColor(d.query);
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
			});
		svg.selectAll(".plot-dot")
			.data(flat_plot_data)
			.exit()
			.remove();

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
			.attr('class', 'plot-line-container');

	    svg.selectAll(".plot-line-container").selectAll(".plot-line")
	    	.data(lineSegments)
	        .attr("d", dotConnectLine)
			.style("stroke", function(d) {
				return uniqueColor(d[0].query);
			})
	    	.enter()
	    	.append("path")
	        .attr("class", "plot-line")
	        .attr("d", dotConnectLine)
			.style("stroke", function(d) {
				return uniqueColor(d[0].query);
			})
			.style("fill", "none");
		svg.selectAll(".plot-line-container")
			.data(flat_line_data)
			.exit()
			.remove();

		// Update legend
		//// Make background of Phrase Search white
		$("#phrases-terms").removeClass("phrases-terms-empty");
		//// Flatten plot_data to just keys (terms being graphed)
		var flat_legend_data = [];
		for (var key in plot_data) {
			flat_legend_data.push(key);
		}
		//// Add new terms
		for (var key in plot_data) {
			console.log(key);
			if ($(".phrases-terms-term[value='"+key+"']").length == 0) {
				// Term not in legend, so let's add it
				$("#phrases-terms").append(generate_legend_term_html(key));
			}
		}
		//// Delete unused terms and update old
		$(".phrases-terms-item").each(function(e) {
			let term = $(this).find(".phrases-terms-term").val();
			if (!(term in plot_data)) {
				// Term no longer exists in plot data, so delete legend entry
				$(this).remove();
			}
			else {
				// Term is currently graphed on the plot, so update legend entry to make sure its colored correctly
				console.log("TODO HERE");
			}
		})
	}

	function uniqueColor(term) {
		if (term in term_colors) {
			return term_colors[term];
		}
		// This term doesn't have a color, assign it one
		let new_color = unique_colors.pop();
		term_colors[term] = new_color;
		return new_color;
	}

	function lineSegments(data) {
		segments = [];
		for (var i = 0; i<data.length - 1; i++) {
			segments.push([data[i], data[i+1]]) 
		}
		return segments;
	}


	function generate_legend_term_html(term) {
		let query = term.replace(/\,/g, ' ');
		let color = uniqueColor(term);
		return '<div class="phrases-terms-item">'+
					'<div class="phrases-terms-colorRect">'+
						'<svg>'+
							'<rect width="25" height="25" style="fill:'+color+';"></rect>'+
						'</svg>'+
					'</div>'+
					'<div class="phrases-terms-query">'+query+'</div>'+
					'<input type="hidden" class="phrases-terms-term" value="'+term+'" />'+
					'<button type="button" class="btn bnt-sm btn-danger phrases-terms-remove">Remove</button>'+
				'</div>';
	}
});