!function (name, definition) {
	if (typeof module != 'undefined') {
		module.exports = definition();
	} else if (typeof define != 'undefined') {
		define(definition);
	} else {
		this[name] = definition();
	}
		
}('MarkerFlock', function() {
	
	var masterCache = {},
		styleCache = {},
		generalStyle = false,
		hover_options;
	
		
		
	/**
	*
	* Lets scale all the markers via css. 
	*
	**/
	var scales = {
		"markerflock-smallest": 0.25,
		"markerflock-small": 0.5,
		"markerflock-medium": 0.75,
		"markerflock-large": 1,
		"markerflock-largest": 1.25
	}
	
	
	function Flock(markers) {
		
		// Lets make sure markers is an array of objects and not an object
		if(!markers.slice) markers = [markers];
		
		// Lets limit it to 20 markers
		if(markers.length > 20) markers = markers.slice(0,20);
		this.markers = markers;
		
		// See if we already generated this one and return it.
		var key = this.markers.map(function(m) { return m.color + (m.icon ? "=" + m.icon : ""); }).sort().join(" ") + "|" + this.markers.length;
		
		if(masterCache[key]) {
			return masterCache[key];
		}

		this.leafletIcon = function() {
			var FlockIcon = L.Icon.extend({
				createIcon: function (oldIcon) {					
					return (oldIcon ? oldIcon : this.image());
				}.bind(this),

				createShadow: function (oldShadow) {
					return (oldShadow ? oldShadow : this.image_shadow());
				}.bind(this)
			});

			var flockIcon = function (options) {
				return new FlockIcon(options);
			};

			return new flockIcon({children: this.markers});
			
		}
		
		this.leafletMarker = function(latlng, options) {
			
			if(!options) options = {};
			
			var currentFlock = this;
			
			var FlockMarker = L.Marker.extend({
				
				// Lets make sure the popup anchor is in the right place.
				openPopup: function(content, options) {
					
					var style = document.defaultView.getComputedStyle(currentFlock._image),
						width = Number(style.getPropertyValue("width").replace("px","")),
						height = Number(style.getPropertyValue("height").replace("px",""));
						console.log(width, height);
					this._popup.options.offset = [0,-height+8];
					
					L.Marker.prototype.openPopup.apply(this,arguments);
				}
			});
			
			var flockmarker = function (latlng, options) {
				return new FlockMarker(latlng, options);	
			};
			
			// Lets make sure we use the right icon
			options.icon = this.leafletIcon();
			
			return new flockmarker(latlng, options);
			
		}
		
		this.updateStyle = function() {
			/**
			*
			* Lets throw the general style on there.
			*
			**/
			
			if(!generalStyle) {
				var sheet = document.createElement('style');
				sheet.id = "general-markerflock-style";
				// Make sure markers change size smoothly by setting a css transition.
				sheet.innerHTML = ".markerflock-icon,.markerflock-shadow {-webkit-transition: all 0.3s ease-out; -moz-transition: all 0.3s ease-out; -o-transition: all 0.3s ease-out; transition: all 0.3s ease-out;}";
				document.body.appendChild(sheet);
				generalStyle = true;
			}
			
			// Each Size group has there own css styles.
			if(!styleCache[this.markers.length+"-"+this.marker_width]) {

				var sheet = document.createElement('style');
				sheet.id = "markerflock-"+this.markers.length;
		
				// Icon
				sheet.innerHTML += ".markerflock-icon.m"+this.markers.length+"-"+this.marker_width+"   {width: "+(this.width/2)+"px; height: "+(this.height/2)+"px; margin-left: "+(-this.width/2/2)+"px; margin-top: "+(-this.height/2)+"px;}";
		
				// Shadow
				sheet.innerHTML += ".markerflock-shadow.m"+this.markers.length+"-"+this.marker_width+" {width: "+((this.width + this.marker_width)/2)+"px; height: "+(this.height/2)+"px; margin-left: "+(-this.width/2/2 -2)+"px; margin-top: "+(-this.height/2)+"px;}";
		
				// dynamic Style 1
				for(var name in scales) {
					var s = scales[name];
					sheet.innerHTML += "."+name+" .markerflock-icon.m"+this.markers.length+"-"+this.marker_width+"    {width: "+(this.width/2*s)+"px; height: "+(this.height/2*s)+"px; margin-left: "+(-this.width/2/2*s)+"px; margin-top: "+(-this.height/2*s)+"px;}";
					sheet.innerHTML += "."+name+" .markerflock-shadow.m"+this.markers.length+"-"+this.marker_width+" {width: "+((this.width + this.marker_width)/2*s)+"px; height: "+(this.height/2*s)+"px; margin-left: "+((-this.width/2/2-2)*s)+"px; margin-top: "+(-this.height/2*s)+"px;}";
				}
				
				
				document.body.appendChild(sheet);
				
				styleCache[this.markers.length+"-"+this.marker_width] = true;
				
			}
			
		}
		
		/**
		*
		* This method builds up the marker.
		*
		*/
		this._setup = function() {
			
			var markers = this.markers.slice(0);
	

			// Variables
			this.marker_width = 50;
			this.marker_height 	= this.marker_width * 8 / 5;
			this.marker_stroke = (Math.floor(this.marker_width / 20) > 1 ? Math.floor(this.marker_width / 20) : 1);
			this.scale = this.marker_width/50;
	
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
				this.distance_to_width_ratio = 3/4;
				this.distance_between_markers_y = this.marker_height / 5;
			} else if(markers.length > 4 && markers.length <= 10) {
				this.distance_to_width_ratio = 2/4;
				this.distance_between_markers_y = this.marker_height / 10;
			} else if(markers.length > 10 && markers.length <= 20) {
				this.distance_to_width_ratio = 1/4;
				this.distance_between_markers_y = this.marker_height / 10;
			} else if(markers.length > 20) {
				this.distance_to_width_ratio = 3/16;
				this.distance_between_markers_y = this.marker_height / 10;
			}
			this.distance_between_markers_x = this.marker_width  * this.distance_to_width_ratio;
	

			/**
			*
			* Now Lets determine the shape of the group.
			*
			**/
			if(markers.length < 9) {
	
				// If there are less than 9 markers, the group makes a diamond shape, where the longest row is in the middle
				// and the shortest are the top and bottom.
		
				this.rows = [];
		
				this.longest_row = Math.ceil(Math.sqrt(markers.length));
		
				//  Lets do the top this.rows of the diamond and slowly enlarge the width towards the middle
				for(var row_length = 1; row_length <= this.longest_row; row_length++) {
					if(markers.length) {
						var row = [];

						for(var i = 1; i <= row_length; i++) {
							var marker = markers.pop();
							if(marker) row.push(marker);
						}

						this.rows.push(row);
					}
				}
		
				// lets now do the bottom of the diamond.
				for(var row_length = this.longest_row; row_length > 0; row_length--) {
					if(markers.length) {
						var row = [];

						for(var i = 1; i < row_length; i++) {
							var marker = markers.pop();
							if(marker) row.push(marker);
						}
				
						this.rows.push(row);
					}
				}
		
				// We can calculate it height from the height
				this.width 			= this.marker_width + this.distance_between_markers_x * (this.longest_row - 1);
				this.height 		= this.marker_height + this.distance_between_markers_y * (this.rows.length - 1);
		

				// Special cases
				if(this.markers.length == 2) this.width = this.marker_width;
				if(this.markers.length == 5) this.width = this.marker_width + this.distance_between_markers_x;
		
			} else {
		
				// If there are 9 or more markers then lets make something closer to a square. All the this.rows are close in width.
				this.rows = [];
		
				// Lets find the size of the "square."
				this.longest_row = 3; 
				while(Math.pow(this.longest_row,2) <= markers.length) { this.longest_row++; }
		
				var num_markers = 0;
		
				/**
				*
				* We have a custimized "front row" so that the group does not look too boxy
				*
				*/
				// for 10 to 16 marker groupes, that front row is two markers wide.
				if(this.markers.length > 10 && this.markers.length < 16) {
			
					// Lets make the width a little larger so we don't look too boxy, the top and bottom this.rows won't
					// be completly filled.
					this.longest_row++;
			
					// Our front row of two markers.
					this.rows.push([markers.pop(), markers.pop()]);
					num_markers = 2;
			
				} else {
			
					// Lets find a decent size for the front row.
					var front_row = Math.ceil((this.markers.length % this.longest_row) / 2);

					// Make sure the front row is not "empty"
					if(front_row == 0) front_row = Math.ceil(this.longest_row/2);
			
					// Lets make our row.
					var row = [];
					for(var i = 1; i <= front_row; i++) {
						row.push(markers.pop());
						num_markers++;
					}
			
					this.rows.push(row);
				}
		
				/**
				*
				* The rest of the this.rows are more boxy. Lets output them with all the same width.
				*
				**/
				while(num_markers < this.markers.length) {
					var row = [];
					for(var i = 1; i <= this.longest_row; i++) {
						var marker = markers.pop();
						if(marker) {
							row.push(marker);
							num_markers++;
						}
					}
			
					this.rows.push(row);
				}

				this.width 				= this.marker_width + this.distance_between_markers_x * (this.longest_row - 1);
				this.height 			= this.marker_height + this.distance_between_markers_y * (this.rows.length - 1);
		
		
			}
	
			//width += 58;
	
			this.rows.reverse();
			
			this.updateStyle();
			
		};

		/**
		*
		* This method uses Raphael.js to print a shadow for our marker group.
		*
		**/
		this.svg_shadow = function() {

			// Create the element, if not already passed in.
			var element = document.createElement("div");

			// Lets create our "paper" or canvas.
			var paper = Raphael(element, this.width + this.marker_width, this.height);
		
			// Add the shadows
			this._generate(function(x,y,marker_width,color,symbolFunc) {
			
				// Here we do the symbol
				var symbol = paper.path("M "+x+","+y+" m "+(15*this.scale)+","+(50*this.scale)+" c "+(-8.806*this.scale)+","+(8.216*this.scale)+" "+(5.699*this.scale)+","+(11.431*this.scale)+" "+(-13.41*this.scale)+","+(27.415*this.scale)+" c "+(22.102*this.scale)+","+(-15.1*this.scale)+" "+(34.547*this.scale)+","+(-10.331*this.scale)+" "+(46.347*this.scale)+","+(-17.66*this.scale)+" c "+(16.097*this.scale)+","+(-12.142*this.scale)+" "+(-16.838*this.scale)+","+(-21.897*this.scale)+" "+(-32.937*this.scale)+","+(-9.755*this.scale)+" z");
			
				symbol.attr("fill-opacity", 0.4);
				symbol.attr("stroke-width", 0);
				symbol.attr("fill", "#000");
			
			
			
			}.bind(this));
	
			// Return the SVG element
			return element.children[0];
	
		};

		/**
		*
		* This method uses Raphael.js to print a marker or a marker group.
		*
		**/
		this.svg = function() {

			// Create the element, if not already passed in.
			var element = document.createElement("div");

			// Lets create our "paper" or canvas.
			var paper = Raphael(element, this.width, this.height);
		
			this._generate(function(x,y,marker_width,color,icon) {

				// The path is made up of three curves, the curve down the left side of the marker, up the right side, and the top of the cap. See the canvas implementation.
				var marker = paper.path("M "+x+","+y+" m  "+(this.capWidth/2*-1*this.scale)+","+(this.capHeight*this.scale-2)+" c  "+(this.needleTopWidth*this.scale)+","+(20*this.scale)+",  "+((this.capWidth/2 - this.needleBottomWidth)*this.scale)+","+(18*this.scale)+",  "+(this.capWidth/2*this.scale)+","+(58*this.scale)  +
                                        "c  "+(this.capWidth/2 - (this.capWidth/2 - this.needleBottomWidth))+","+(-40*this.scale)+", "+((this.capWidth/2 - this.needleTopWidth)*this.scale)+","+(-38*this.scale)+", "+(this.capWidth/2*this.scale)+","+ (-58*this.scale) +
                                        "c  0,"+(-1*this.capHeight*5/4*this.scale)+", "+(this.capWidth*-1*this.scale)+","+(-1*this.capHeight*5/4*this.scale)+" "+(this.capWidth*-1*this.scale)+",0z");


				// Sets the fill attribute of the marker
				marker.attr("fill", (typeof color == "string" ? color : "90-#"+color[0]+":50-#"+color[1]+":100"));

				// Sets the stroke attribute of the marker to black
				marker.attr("stroke-width", this.marker_stroke);
				marker.attr("stroke", "#000");
				
				if(!icon || icon == "disc") {
					// ctx.beginPath();
					// ctx.arc(x,y+this.capHeight*4/5*this.scale+1,this.capHeight*5/4*this.scale/4,0,Math.PI*2,true);
					var circle = paper.circle(x, y+this.capHeight*4/5*this.scale+1, this.capHeight*5/4*this.scale/4);
					circle.attr("fill", "#000");
				} else if(icon == "play") {
					var symbol = paper.path("M "+(x-10)+","+(y+7)+" m 22,14 c 1.092,0.63 1.092,1.661 0,2.291 l -7.141,4.126 c -1.092,0.63 -2.877,1.661 -3.969,2.291 l -7.143,4.122 c -1.092,0.63 -1.984,0.114 -1.984,-1.146 v -8.248 c 0,-1.26 0,-3.322 0,-4.582 v -8.248 c 0,-1.26 0.893,-1.775 1.984,-1.146 l 7.143,4.125 c 1.092,0.63 2.877,1.661 3.969,2.291 l 7.141,4.124 z");
					symbol.attr("fill", "#000");	
				}
			
			}.bind(this));
		
			// Return the SVG element
			return element.children[0];
		}

		this.canvas_shadow = function() {
		
			var canvas = document.createElement("canvas"),
				ctx    = canvas.getContext("2d");
		
			canvas.width = this.width + this.marker_width;
			canvas.height = this.height;
			
			// If we already generated this one, lets just draw it on a new canvas.
			if(this._canvas_shadow) {
				ctx.drawImage(this._canvas_shadow,0,0);
				return canvas;
			}
		
			this._generate(function(x,y,marker_width,color,symbolFunc) {
			
				ctx.beginPath();
			
				var point1 = {x: x+(15*this.scale), y: y+(50*this.scale)};
				ctx.moveTo(point1.x, point1.y);

			
				var cp1 	= {x: point1.x + (-8.806*this.scale), 							y: point1.y+(8.216*this.scale)},
					cp2 	= {x: point1.x + (5.699*this.scale), 							y: point1.y+(11.431*this.scale)},
					point2 	= {x: point1.x + (-13.41*this.scale), 							y: point1.y+(27.415*this.scale)};
				
				ctx.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, point2.x, point2.y);
			
				var cp1 	= {x: point2.x + (22.102*this.scale), 							y: point2.y+(-15.1*this.scale)},
					cp2 	= {x: point2.x + (34.547*this.scale), 							y: point2.y+(-10.331*this.scale)},
					point3 	= {x: point2.x + (46.347*this.scale), 							y: point2.y+(-17.66*this.scale)};
				
				ctx.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, point3.x, point3.y);
			
				var cp1 	= {x: point3.x + (16.097*this.scale), 							y: point3.y+(-12.142*this.scale)},
					cp2 	= {x: point3.x + (-16.838*this.scale), 							y: point3.y+(-21.897*this.scale)},
					point4 	= {x: point3.x + (-32.937*this.scale), 							y: point3.y+(-9.755*this.scale)};
				
				ctx.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, point4.x, point4.y);
				
				ctx.closePath();
			
				ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
			
				ctx.fill();
			
			}.bind(this));
			
			this._canvas_shadow = canvas;
		
			return canvas;
		
		};
		
		this.image = function() {
			var img;
			if(!this._image) {
				var canvas = (this._canvas ? this._canvas : this.canvas());
				this._image = new Image();
				this._image.width = canvas.width;
				this._image.height = canvas.height;
				this._image.src = canvas.toDataURL();
				this._image.className = 'leaflet-marker-icon markerflock-icon m' + this.markers.length + "-" + this.marker_width;
				
				img = this._image.cloneNode();
			} else {
				this._image = this._image.cloneNode();
				img = this._image;
			}
			
			// Lets not borrow any of these attributes
			img.style["transform"] = "";
			img.style["-webkit-transform"] = "";
			img.style["-moz-transform"] = "";
			img.style["-ms-transform"] = "";
			img.style["-o-transform"] = "";
			img.style["z-index"] = "";
			
			img.org_src = img.src;
			(function(markers) {
				img.onmouseover = function() {
					if(hover_options) {
						var hoverInstance = new MarkerFlock(markers.map(function() { return hover_options; }));
						this.src = hoverInstance.dataURI();
					}
				}	
			})(this.markers);
			
		
			img.onmouseout = function() {
				this.src = img.org_src;				
			}
			
			return img;
		}
		
		this.dataURI = function() {
			if(!this._uri) {
				var image = (this._image ? this._image : this.image());
				this._uri = image.src;
			}

			return this._uri;
		}
		
		this.image_shadow = function() {
			
			if(!this._image_shadow) {
				var canvas = (this._canvas_shadow ? this._canvas_shadow : this.canvas_shadow());
				this._image_shadow = new Image();
				this._image_shadow.width = canvas.width;
				this._image_shadow.height = canvas.height;
				this._image_shadow.src = canvas.toDataURL();
				this._image_shadow.className = 'leaflet-marker-icon markerflock-shadow m' + this.markers.length + "-" + this.marker_width;
				
				return this._image_shadow;
			}
			
			return this._image_shadow.cloneNode();
		}
	
		this.canvas = function() {
		
			var canvas = document.createElement("canvas"),
				ctx    = canvas.getContext("2d");
		
			canvas.width = this.width;
			canvas.height = this.height;
			
			// If we already generated this one, lets just draw it on a new canvas.
			if(this._canvas) {
				ctx.drawImage(this._canvas,0,0);
				return canvas;
			}
		
			this._generate(function(x,y,marker_width,color,icon, callback) {
		
			    // Arguments: cp1x, cp1y, cp2x, cp2y, x, y
			    // cp = control point.
			    ctx.beginPath();
			
				// Lets start at the furthest left point on the marker cap.
				var point1 = {x: x+(this.capWidth/2*-1*this.scale), y: y+(this.capHeight*this.scale-2)};
				ctx.moveTo(point1.x, point1.y);
			
				// Lets set up our first curve down to the point
				var cp1 	= {x: point1.x + (this.needleTopWidth*this.scale), 							y: point1.y+(20*this.scale)},
					cp2 	= {x: point1.x + ((this.capWidth/2 - this.needleBottomWidth)*this.scale), 	y: point1.y+(18*this.scale)},
					point2 	= {x: point1.x + (this.capWidth/2*this.scale), y: point1.y+(58*this.scale)};
			
			    ctx.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, point2.x, point2.y);
			
				// Lets put together our curve up to the right side of the cap
				cp1 	= {x: point2.x + (this.capWidth/2 - (this.capWidth/2 - this.needleBottomWidth)), 	y: point2.y + (-40*this.scale)};
				cp2 	= {x: point2.x + ((this.capWidth/2 - this.needleTopWidth)*this.scale), 	y: point2.y + (-38*this.scale)};
				point3 	= {x: point2.x + (this.capWidth/2*this.scale), y: point2.y  + (-58*this.scale)};
			
			    ctx.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, point3.x, point3.y);
			
				// Lets put together our curve up over the cap
				cp1 	= {x: point3.x, 							y: point3.y + (-1*this.capHeight*5/4*this.scale)};
				cp2 	= {x: point3.x + (this.capWidth*-1*this.scale), 	y: point3.y + (-1*this.capHeight*5/4*this.scale)};
				point4 	= point1;
			
			    ctx.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, point4.x, point4.y);
			
				
				ctx.closePath();
			
				/**
				*
				* Fills and Stroke Styles
				*
				**/
			
				ctx.strokeStyle = "#000";
				ctx.lineWidth = this.marker_stroke;
			
				if(typeof color != "string") {
					var my_gradient = ctx.createLinearGradient(0, y, 0, y+this.marker_height/2);
					my_gradient.addColorStop(0, color[1].replace(/:[0-9]+/, ""));
					my_gradient.addColorStop(1, color[0].replace(/:[0-9]+/, ""));
					ctx.fillStyle = my_gradient;
				} else {
					ctx.fillStyle = color;
				}
			
				ctx.fill();
				ctx.stroke();
			
			
				/**
				*
				* Center Icon
				*
				**/
				if(!icon || icon == "disc") {
					ctx.beginPath();
					ctx.arc(x,y+this.capHeight*4/5*this.scale+1,7.8125*(this.marker_width/50),0,Math.PI*2,true);
					ctx.closePath();
					ctx.fillStyle = "#000";
					ctx.fill();
				} else if(icon == "play") {
					ctx.beginPath();
					var point1 = {x: x-10, y: y+7};
					ctx.moveTo(point1.x,point1.y);
					
					//m 22,14 
					var point2 = {x: point1.x+22, y: point1.y+14};
					ctx.moveTo(point2.x,point2.y);

					// c 1.092,0.63 1.092,1.661 0,2.291			
					var point3 	= {x: point2.x, 		y: point2.y+2.291},
						cp1		= {x: point2.x+ 1.092, 	y: point2.y+0.63},
						cp2 	= {x: point2.x+1.092, 	y: point2.y+1.661};

				    ctx.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, point3.x, point3.y);
					
					// l -7.141,4.126
					var point4 = {x: point3.x-7.141, y: point3.y+4.126};
					ctx.lineTo(point4.x, point4.y);
					
					// c -1.092,0.63 -2.877,1.661 -3.969,2.291
					var point5 	= {x: point4.x-3.969, 		y: point4.y+2.291},
						cp1		= {x: point4.x-1.092, 	y: point4.y+0.63},
						cp2 	= {x: point4.x-2.877,  	y: point4.y+1.661};

				    ctx.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, point5.x, point5.y);
					
					// l -7.143,4.122
					var point6 = {x: point5.x-7.141, y: point5.y+4.122};
					ctx.lineTo(point6.x, point6.y);
					
					// c -1.092,0.63 -1.984,0.114 -1.984,-1.146
					var point7 	= {x: point6.x-1.984, 	y: point6.y-1.146},
						cp1		= {x: point6.x-1.092, 	y: point6.y+0.63},
						cp2 	= {x: point6.x-1.984,  	y: point6.y+0.114};
						
				    ctx.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, point7.x, point7.y);

					// v -8.248
					var point8 = {x: point7.x, y: point7.y-8.248};
					ctx.lineTo(point8.x, point8.y);
					
					// c 0,-1.26 0,-3.322 0,-4.582
					var point9 	= {x: point8.x, y: point8.y-4.582},
						cp1		= {x: point8.x, y: point8.y-1.26},
						cp2 	= {x: point8.x, y: point8.y-3.322};
						
				    ctx.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, point9.x, point9.y);						
						
					// v -8.248
					var point10 = {x: point9.x, y: point9.y-8.248};
					ctx.lineTo(point10.x, point10.y);
					
					// c 0,-1.26 0.893,-1.775 1.984,-1.146
					var point11 = {x: point10.x+ 1.984,  y: point10.y-1.146},
						cp1		= {x: point10.x,  y: point10.y-1.26},
						cp2 	= {x: point10.x+0.893,  y: point10.y-1.775};
						
				    ctx.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, point11.x, point11.y);
						
					// l 7.143,4.125
					var point12 = {x: point11.x + 7.143, y: point11.y+4.125};
					ctx.lineTo(point12.x, point12.y);
					
					// c 1.092,0.63 2.877,1.661 3.969,2.291 
					var point13 = {x: point12.x + 3.969,  y: point12.y+2.291},
						cp1		= {x: point12.x+1.092,  y: point12.y+0.63},
						cp2 	= {x: point12.x + 2.877,  y: point12.y+1.661};
						
				    ctx.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, point13.x, point13.y);
					
					// l 7.141,4.124 z
					var point14 = {x: point13.x+7.143, y: point13.y+4.125};
					ctx.lineTo(point14.x, point14.y);
					
					ctx.closePath();
					
					ctx.fillStyle = "#000";
					ctx.fill();
				}
			
			}.bind(this));
			
			//this._canvas = canvas;
		
			return canvas;
		
		}

		/**
		*
		* This general method iterates through the markers and prints the markers given a printMarkerFunc.
		*
		**/
		this._generate = function(printMarkerFunc) {
		
			// Lets iterate through each row and print our markers on our paper
			this.rows.forEach(function(row, i) {
		
					//  Lets space out markers vertically by this.distance_between_markers_y
				var y = 2 + i * this.distance_between_markers_y,
			
					// Lets center the markers horizontally and space them out by this.distance_between_markers_x
					startX = this.marker_width*(this.distance_to_width_ratio/2) + (this.width/2) - (row.length*this.distance_between_markers_x/2.0);
		
				// Now lets iterate through each marker of this row.
				row.forEach(function(marker, j) {
			
					// Lets put some space (this.distance_between_markers_x) between our markers
					var x = startX + j * this.distance_between_markers_x;
			
					printMarkerFunc(x, y, this.marker_width, marker.color, marker.icon);
			
				}.bind(this))
		
			}.bind(this));
		
		}

		this._setup();
		
		masterCache[key] = this;
		
		return this;
	};
	
	/**
	*
	* Set Global Marker Scale
	*
	**/
	Flock.scale = function(scale) {
		// smallest: 	changeScale("markerflock-smallest"),
		// small: 		changeScale("markerflock-small"),
		// medium: 	changeScale("markerflock-medium"),
		// large: 		changeScale("markerflock-large"),
		// largest: 	changeScale("markerflock-largest")
		document.body.className = document.body.className.replace(/ markerflock\-([^ ]+)/gi, "");
		document.body.className += " markerflock-" + scale;
	};
	
	/**
	*
	* Set Hover options for the Flocks
	*
	**/
	Flock.setHoverOptions = function(new_options) {
		hover_options = new_options;
	}
	
	Flock.iconCreateFunction = function(cluster) {
		if(!cluster._icon) {
			var children = cluster.getAllChildMarkers();

			var colors = children.map(function(marker) {
				return marker.options.icon.options.children[0];
			});

			return new MarkerFlock(colors).leafletIcon();
		}
	};
	
	
	if(window && !window.MarkerFlock)
		window.MarkerFlock = Flock;
		
	return Flock;
});