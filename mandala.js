/**
 * Mandala generator.
 * Copyright (C) 2016 matt@supermatty.com . All rights reserved.
 * Released under the terms of the Gnu General Public License, for which see:
 * https://www.gnu.org/licenses/gpl-3.0.en.html
 */

"use strict";

if (typeof Mandala === "undefined") {
	var Mandala = {};
}

Mandala.Mandala = function(selector) {
	this.snap = Snap(selector);
	this.animating = false;
};

/**
 * The Mandala consists of a configurable number of radial repetitions of
 * a shape; the shape in turn consists of two reflected copies
 * of a (configurable-sized) set of lines; each line in turn consists
 * of a configurable number of points connected with cubic Bezier curves.
 */
jQuery.extend(Mandala.Mandala.prototype, {
	params: {
		doFill: false
	},
	param: function(newParams) {
		$.extend(this.params, newParams);
	},
	init: function() {
		var i;
		$.extend(this.params, {
			animationTime: 10000,
			curvePoints: randomIntBetween(
				this.params.curvePointsMin,
				this.params.curvePointsMax
			),
			radialRepetitionCount: randomIntBetween(
				this.params.radialRepetitionsMin,
				this.params.radialRepetitionsMax
			),
			lineCount: randomIntBetween(
				this.params.lineCountMin,
				this.params.lineCountMax
			)
		});
		this.snap.clear();
		this.group = this.snap.group();
		for (i = 0; i < this.params.lineCount; i++) {
			this.group.add(this.createCurve());
		}
		this.group.toDefs();
		for (i = 0; i < this.params.radialRepetitionCount * 2; i++) {
			var transform = "rotate(" + (i * 360 / this.params.radialRepetitionCount) + ")";
			var use;
			/* non-reflected copy */
			use = this.group.use();
			use.transform(transform);
			this.snap.add(use);
			/* rotated copy */
			use = this.group.use();
			use.transform("scale(-1,1) " + transform);
			this.snap.add(use);
		}
	},
	randomPoint: function() {
		return [ randomFloatBetween(0, 1), randomFloatBetween(0, 1) ];
	},
	randomColour: function() {
		return (
			'#' + zeroPad(randomIntBetween(0, 255).toString(16), 2)
			+ zeroPad(randomIntBetween(0, 255).toString(16), 2)
			+ zeroPad(randomIntBetween(0, 255).toString(16), 2)
		);
	},
	contrastingColour: function(originalColour) {
		var hsb = Snap.rgb2hsb(
			parseInt(originalColour.substring(1, 3), 16),
			parseInt(originalColour.substring(3, 5), 16),
			parseInt(originalColour.substring(5, 7), 16)
		);
		hsb.h = (hsb.h + 0.5) % 1;
		return Snap.hsb2rgb(hsb.h, hsb.s, hsb.b).hex;
	},
	makeCurvePath: function() {
		var
			i,
			startPoint = this.randomPoint(),
			bezierPoints = [
				this.randomPoint(), this.randomPoint(), this.randomPoint()
			],
			str = ('M ' + startPoint[0] + ' ' + startPoint[1]
				+ ' C ' + bezierPoints[0][0] + ' ' + bezierPoints[0][1]
				+ ', ' + bezierPoints[1][0] + ' ' + bezierPoints[1][1]
				+ ', ' + bezierPoints[2][0] + ' ' + bezierPoints[2][1]
			),
			strokeColour = this.randomColour(),
			fillColour
		;
		for (i = 2; i < this.params.curvePoints; i++) {
			bezierPoints[0] = this.randomPoint();
			bezierPoints[1] = this.randomPoint();
			str += ( ' S ' + bezierPoints[0][0] + ' ' + bezierPoints[0][1]
				+ ", " + bezierPoints[1][0] + ' ' + bezierPoints[1][1]
			);
		}
		return str;
	},
	createCurve: function() {
		var
			strokeColour = this.randomColour(),
			fillColour
		;
		if (this.params.doFill) {
			fillColour = this.contrastingColour(strokeColour);
		} else {
			fillColour = 'none';
		}
		return this.snap.path(this.makeCurvePath()).attr({
			stroke: strokeColour, strokeWidth: "1%", fill: fillColour
		});
	},
	isAnimating: function() {
		return this.animating;
	},
	doAnimation: function() {
		var i, mandala = this;
		if (!this.animating) {
			return;
		}
		this.group[0].animate(
			{
				d: this.makeCurvePath(),
				stroke: this.randomColour(),
			},
			this.params.animationTime,
			function() {
				mandala.doAnimation();
			}
		);
		for (i = 1; i < this.group.node.childNodes.length; i++) {
			this.group[i].animate(
				{
					d: this.makeCurvePath(),
					stroke: this.randomColour(),
				},
				this.params.animationTime
			);
		}
	},
	startAnimation: function() {
		this.animating = true;
		this.doAnimation();
	},
	stopAnimation: function() {
		this.animating = false;
		this.doAnimation();
	},
	toggleAnimation: function() {
		this.animating = !this.animating;
		this.doAnimation();
	}
});

(function($){
	$(function() {
		var
			selector = "#svg",
			resizable = $('.resizable'),
			mandala = new Mandala.Mandala(selector),
			pathInput = $('#path'),
			startStopButton = $('#startStop')
		;
		// Enable jQuery UI buttons and checkboxes
		$("button, input[type='button'], input[type='checkbox']").button();
		// Enable jQuery UI selects as menus
		$('select').menu();
		// Enable jQuery UI spinners
		$('textfield.numeric, input.numeric').spinner({min: 0, step: 0.1, page: 1});
		// Initialise jQuery UI resizable widget
		resizable.resizable({ handles: "all", animate: false, ghost: true, autohide: false, aspectRatio: false });
		resizable.on('resizestop', function(event, ui) {
			$(selector).css({ width: resizable.width(), height: resizable.height() });
		});
		function updateAnimateButton() {
			startStopButton.button(
				"option", "label",
				(mandala.isAnimating() ? "Stop" : "Start")
				+ " Animation"
			);
		}
		$('#generate').on("click", function() {
			mandala.stopAnimation();
			mandala.init();
			updateAnimateButton();
		});
		$("#sliderRadialRepetitions").slider({
			range: true,
			min: 1,
			max: 20,
			values: [ 3, 7 ],
			slide: function( event, ui ) {
				$("#radialRepetitions").val(ui.values[0] + " - " + ui.values[1]);
				mandala.param({
					radialRepetitionsMin: ui.values[0],
					radialRepetitionsMax: ui.values[1],
				});
			}
		});
		$("#radialRepetitions").val(
			$("#sliderRadialRepetitions").slider("values", 0)
			+ " - "
			+ $("#sliderRadialRepetitions").slider("values", 1)
		);
		$("#sliderLineCount").slider({
			range: true,
			min: 1,
			max: 10,
			values: [ 2, 3 ],
			slide: function( event, ui ) {
				$("#lineCount").val(ui.values[0] + " - " + ui.values[1]);
				mandala.param({
					lineCountMin: ui.values[0],
					lineCountMax: ui.values[1],
				});
			}
		});
		$("#lineCount").val(
			$("#sliderLineCount").slider("values", 0)
			+ " - "
			+ $("#sliderLineCount").slider("values", 1)
		);
		$("#sliderCurvePoints").slider({
			range: true,
			min: 2,
			max: 10,
			values: [ 2, 3 ],
			slide: function( event, ui ) {
				$("#curvePoints").val(ui.values[0] + " - " + ui.values[1]);
				mandala.param({
					curvePointsMin: ui.values[0],
					curvePointsMax: ui.values[1],
				});
			}
		});
		$("#curvePoints").val(
			$("#sliderCurvePoints").slider("values", 0)
			+ " - "
			+ $("#sliderCurvePoints").slider("values", 1)
		);
		mandala.param({
			radialRepetitionsMin: $("#sliderRadialRepetitions").slider("values", 0),
			radialRepetitionsMax: $("#sliderRadialRepetitions").slider("values", 1),
			lineCountMin: $("#sliderLineCount").slider("values", 0),
			lineCountMax: $("#sliderLineCount").slider("values", 1),
			curvePointsMin: $("#sliderCurvePoints").slider("values", 0),
			curvePointsMax: $("#sliderCurvePoints").slider("values", 1)
		});
		$('#download').on("click", function() {
			downloadSVGAsPNG($(selector), $('#downloadLink'));
		});
		startStopButton.on("click", function() {
			mandala.toggleAnimation();
			updateAnimateButton();
		});
		mandala.init();
		mandala.startAnimation();
		updateAnimateButton();
	});
})(jQuery);
