
var Engine = new function() {
	this.interval = 40; // 25 frames per second
	this.timer = null;
	this.onTick = function() {};
	
	var self = this;
	
	this.Start = function() {
		self.timer = window.setInterval(self.onTick, self.interval);
	};
	
	this.Stop = function() {
		self.timer = null;
	}
}

var Point = function(x, y) {
	this.x = x;
	this.y = y;
	var self = this;
	this.add = function(p2) {
		self.x += p2.x;
		self.y += p2.y;
	};
	this.length = function() {
		var xx = parseFloat(self.x);
		var yy = parseFloat(self.y);
		var length = Math.sqrt(xx * xx + yy * yy);
		return length;
	};
	this.setLength = function(len) {
		curlen = parseFloat(self.length());
		self.x = len * (parseFloat(self.x) / curlen);
		self.y = len * (parseFloat(self.y) / curlen);
	};
}
var p = new Point(0, 0);
var mv = new Point(0, 0);
var target = new Point(0, 0);
var force = new Point(0, 0);
var drag = 0.95;
var gravity = 100000;

var tickcount = 0;

$(document).ready(function() {
	var paper = Raphael("sandbox", $(document).width(), $(document).height());
	var c = paper.circle(0, 0, 10);
	
	Engine.onTick = function() {
		// gravity with move the circle to the mouse - work out the force vector
		force = new Point(0,0);
		force.x = target.x - p.x;
		force.y = target.y - p.y;
		var distance = force.length();
		if(distance > 0) {
			//var forcestrength = gravity / (distance * distance);
			var forcestrength = distance / 20;
			force.setLength(forcestrength);
			
			// circle has a current momentum vector, apply the force to it
			var newmv = new Point(mv.x, mv.y);
			newmv.add(force);
			
			//add a drag coefficient so it will eventually slow down
			var currentspeed = newmv.length();
			newmv.setLength(currentspeed * drag);

			mv = newmv;

		}
			
		//apply new vector to circle
		p.x += Math.round(mv.x);
		p.y += Math.round(mv.y);
		
		c.translate(Math.round(mv.x), Math.round(mv.y));
		c.toFront();
		
		
		/*var debug = "<table border='1px'><tr><td>p</td><td>" + p.x + "</td><td>" + p.y + "</td></tr>";
		debug += "<tr><td>mv</td><td>" + mv.x + "</td><td>" + mv.y + "</td></tr>";
		debug += "<tr><td>target</td><td>" + target.x + "</td><td>" + target.y + "</td></tr>";
		debug += "</table>";
		$("#status").html(debug);*/
	};

	$(window).resize(function() {
		window.status = ("" + $(window).width() + ":" + $(window).height());
		paper.setSize($(window).width(), $(window).height());
	});

	$().mousemove(function(e){
		target.x = e.pageX;
		target.y = e.pageY;
	});
	
	Engine.Start();
	
});
