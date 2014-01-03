!function (name, definition) {
	if (typeof module != 'undefined') 
		module.exports = definition();
	else {
		this[name] = definition();
	}
		
}('MarkerBunch', function() {
	
	return function(markers, marker_width, opts) {
	
		// Lets determine the height given the width.
		var marker_height 	= marker_width * 8 / 5,
			width, 
			height,
			rows,
			longest_row,
			marker_stroke = (Math.floor(marker_width / 20) > 1 ? Math.floor(marker_width / 20) : 1),
			shape = [],
			distance_between_markers_x,
			distance_between_markers_y,
			total_markers = markers.length;
		
		// Specific shape of marker
		this.capHeight = 25,
		this.capWidth  = 44,
		this.needleTopWidth = 2,
		this.needleBottomWidth = 2;
		
		/**
		*
		* Lets adjust the distance between the markers given the amount of markers
		*
		**/
		if(markers.length <= 4) {
			distance_to_width_ratio = 3/4;
			distance_between_markers_y = marker_height / 5;
		} else if(markers.length > 4 && markers.length <= 10) {
			distance_to_width_ratio = 2/4;
			distance_between_markers_y = marker_height / 10;
		} else if(markers.length > 10 && markers.length <= 20) {
			distance_to_width_ratio = 1/4;
			distance_between_markers_y = marker_height / 10;
		} else if(markers.length > 20) {
			distance_to_width_ratio = 3/16;
			distance_between_markers_y = marker_height / 10;
		}
		distance_between_markers_x = marker_width  * distance_to_width_ratio;
		

		/**
		*
		* Now Lets determine the shape of the bunch.
		*
		**/
		if(markers.length < 9) {
		
			// If there are less than 9 markers, the bunch makes a diamond shape, where the longest row is in the middle
			// and the shortest are the top and bottom.
			
			rows = [];
			
			longest_row = Math.ceil(Math.sqrt(markers.length));
			
			//  Lets do the top rows of the diamond and slowly enlarge the width towards the middle
			for(var row_length = 1; row_length <= longest_row; row_length++) {
				if(markers.length) {
					var row = [];
	
					for(var i = 1; i <= row_length; i++) {
						var marker = markers.pop();
						if(marker) row.push(marker);
					}

					rows.push(row);
				}
			}
			
			// lets now do the bottom of the diamond.
			for(var row_length = longest_row; row_length > 0; row_length--) {
				if(markers.length) {
					var row = [];
	
					for(var i = 1; i < row_length; i++) {
						var marker = markers.pop();
						if(marker) row.push(marker);
					}
					
					rows.push(row);
				}
			}
			
			// We can calculate it height from the height
			width 			= marker_width + distance_between_markers_x * (longest_row - 1);
			height 			= marker_height + distance_between_markers_y * (rows.length - 1);
			

			// Special cases
			if(total_markers == 2) width = marker_width;
			if(total_markers == 5) width = marker_width + distance_between_markers_x;
			
		} else {
			
			// If there are 9 or more markers then lets make something closer to a square. All the rows are close in width.
			rows = [];
			
			// Lets find the size of the "square."
			longest_row = 3; 
			while(Math.pow(longest_row,2) <= markers.length) { longest_row++; }
			
			var num_markers = 0;
			
			/**
			*
			* We have a custimized "front row" so that the bunch does not look too boxy
			*
			*/
			// for 10 to 16 marker bunches, that front row is two markers wide.
			if(total_markers > 10 && total_markers < 16) {
				
				// Lets make the width a little larger so we don't look too boxy, the top and bottom rows won't
				// be completly filled.
				longest_row++;
				
				// Our front row of two markers.
				rows.push([markers.pop(), markers.pop()]);
				num_markers = 2;
				
			} else {
				
				// Lets find a decent size for the front row.
				var front_row = Math.ceil((total_markers % longest_row) / 2);

				// Make sure the front row is not "empty"
				if(front_row == 0) front_row = Math.ceil(longest_row/2);
				
				// Lets make our row.
				var row = [];
				for(var i = 1; i <= front_row; i++) {
					row.push(markers.pop());
					num_markers++;
				}
				
				rows.push(row);
			}
			
			/**
			*
			* The rest of the rows are more boxy. Lets output them with all the same width.
			*
			**/
			while(num_markers < total_markers) {
				var row = [];
				for(var i = 1; i <= longest_row; i++) {
					var marker = markers.pop();
					if(marker) {
						row.push(marker);
						num_markers++;
					}
				}
				
				rows.push(row);
			}

			width 			= marker_width + distance_between_markers_x * (longest_row - 1);
			height 			= marker_height + distance_between_markers_y * (rows.length - 1);
			
			
		}
		
		rows.reverse();

		/**
		*
		* This method uses Raphael.js to print a marker or a marker bunch.
		*
		**/
		this.svg = function() {

			// Create the element, if not already passed in.
			var element = document.createElement("div");

			// Lets create our "paper" or canvas.
			var paper = Raphael(element, width, height);

			var scale = marker_width/50;
			
			this._generate(function(x,y,marker_width,color) {

				// Creates circle at x = 50, y = 40, with radius 10
				// var marker = paper.path("M "+x+","+y+" c "+(-19*scale)+","+(2*scale)+" "+(-22*scale)+","+(13*scale)+" "+(-22*scale)+","+(22*scale)+" c  "+(2*scale)+","+(20*scale)+"  "+(18*scale)+","+(18*scale)+"  "+(22*scale)+"," + (58*scale) +
				//            				"M "+x+","+y+" c "+(19*scale)+","+(2*scale)+" "+(22*scale)+","+(13*scale)+" "+(22*scale)+","+(22*scale)+" c  "+(-2*scale)+","+(20*scale)+"  "+(-18*scale)+","+(18*scale)+"  "+(-22*scale)+"," + (58*scale));

				//m "+(this.capWidth)+","+(this.capHeight)+"

				// The path is made up of three curves, the curve down the left side of the marker, up the right side, and the top of the cap. See the canvas implementation.
				var marker = paper.path("M "+x+","+y+" m  "+(this.capWidth/2*-1*scale)+","+(this.capHeight*scale-2)+" c  "+(this.needleTopWidth*scale)+","+(20*scale)+",  "+((this.capWidth/2 - this.needleBottomWidth)*scale)+","+(18*scale)+",  "+(this.capWidth/2*scale)+","+(58*scale)  +
                                        "c  "+(this.capWidth/2 - (this.capWidth/2 - needleBottomWidth))+","+(-40*scale)+", "+((this.capWidth/2 - needleTopWidth)*scale)+","+(-38*scale)+", "+(this.capWidth/2*scale)+","+ (-58*scale) +
                                        "c  0,"+(-1*this.capHeight*5/4*scale)+", "+(this.capWidth*-1*scale)+","+(-1*this.capHeight*5/4*scale)+" "+(this.capWidth*-1*scale)+",0z");


				// Sets the fill attribute of the marker
				marker.attr("fill", color);

				// Sets the stroke attribute of the marker to black
				marker.attr("stroke-width", marker_stroke);
				marker.attr("stroke", "#000");
				
			});
			
			// Return the SVG element
			return element.children[0];
		}
		
		this.canvas = function() {
			
			var canvas = document.createElement("canvas"),
				ctx    = canvas.getContext("2d"),
				scale = marker_width/50;
			
			canvas.width = width;
			canvas.height = height;
			
			this._generate(function(x,y,marker_width,color) {
			
			    // Arguments: cp1x, cp1y, cp2x, cp2y, x, y
			    // cp = control point.
			    ctx.beginPath();
				
				// Lets start at the furthest left point on the marker cap.
				var point1 = {x: x+(this.capWidth/2*-1*scale), y: y+(this.capHeight*scale-2)};
				ctx.moveTo(point1.x, point1.y);
				
				// Lets set up our first curve down to the point
				var cp1 	= {x: point1.x + (this.needleTopWidth*scale), 							y: point1.y+(20*scale)},
					cp2 	= {x: point1.x + ((this.capWidth/2 - this.needleBottomWidth)*scale), 	y: point1.y+(18*scale)},
					point2 	= {x: point1.x + (this.capWidth/2*scale), y: point1.y+(58*scale)};
				
			    ctx.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, point2.x, point2.y);
				
				// Lets put together our curve up to the right side of the cap
				cp1 	= {x: point2.x + (this.capWidth/2 - (this.capWidth/2 - needleBottomWidth)), 	y: point2.y + (-40*scale)};
				cp2 	= {x: point2.x + ((this.capWidth/2 - needleTopWidth)*scale), 	y: point2.y + (-38*scale)};
				point3 	= {x: point2.x + (this.capWidth/2*scale), y: point2.y  + (-58*scale)};
				
			    ctx.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, point3.x, point3.y);
				
				// Lets put together our curve up over the cap
				cp1 	= {x: point3.x, 							y: point3.y + (-1*this.capHeight*5/4*scale)};
				cp2 	= {x: point3.x + (this.capWidth*-1*scale), 	y: point3.y + (-1*this.capHeight*5/4*scale)};
				point4 	= point1;
				
			    ctx.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, point4.x, point4.y);
				
				
				
				/**
				*
				* Fills and Stroke Styles
				*
				**/
				
				ctx.strokeStyle = "#000";
				ctx.lineWidth = marker_stroke;
				
				var gradient = color && color.match(/([0-9]+)\-(\#.*)+\-(\#.*)/);
				
				if(gradient) {
					var my_gradient = ctx.createLinearGradient(0, 0, 0, marker_height);
					my_gradient.addColorStop(0, gradient[2]);
					my_gradient.addColorStop(1, gradient[3]);
					ctx.fillStyle = my_gradient;
				} else {
					ctx.fillStyle = color;
				}
				
				ctx.fill();
				ctx.stroke();
				
			});
			
			return canvas;
			
		}
	
		/**
		*
		* This general method iterates through the markers and prints the markers given a printMarkerFunc.
		*
		**/
		this._generate = function(printMarkerFunc) {
			
			// Lets iterate through each row and print our markers on our paper
			rows.forEach(function(row, i) {
			
					//  Lets space out markers vertically by distance_between_markers_y
				var y = 2 + i * distance_between_markers_y,
				
					// Lets center the markers horizontally and space them out by distance_between_markers_x
					startX = marker_width*(distance_to_width_ratio/2) + (width/2) - (row.length*distance_between_markers_x/2.0);
			
				// Now lets iterate through each marker of this row.
				row.forEach(function(marker, j) {
				
					// Lets put some space (distance_between_markers_x) between our markers
					var x = startX + j * distance_between_markers_x;
				
					printMarkerFunc(x, y, marker_width, marker.color);
				
				}.bind(this))
			
			}.bind(this));
		}
		

		return this;
		// // Lets load the custom options
		// 	    for (var prop in opts) {
		// 	this[prop] = opts[prop];
		// 	    }
	
	};
	
});