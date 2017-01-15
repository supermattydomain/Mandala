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
		this.params.curvePoints = randomIntBetween(
			this.params.curvePointsMin, this.params.curvePointsMax
		);
		this.params.radialRepetitionCount = randomIntBetween(
			this.params.radialRepetitionsMin,
			this.params.radialRepetitionsMax
		);
		this.params.lineCount = randomIntBetween(
			this.params.lineCountMin,
			this.params.lineCountMax
		);
		this.snap.clear();
		this.group = this.snap.group();
		for (i = 0; i < this.params.lineCount; i++) {
			this.group.add(this.createCurve());
		}
		this.group.toDefs();
		this.reflected = this.group.use();
		this.reflected.transform("scale(-1,1)");
		this.reflected.toDefs();
		for (i = 0; i < this.params.radialRepetitionCount * 2; i++) {
			var use;
			if ((i % 2) == 0) {
				use = this.group.use();
			} else {
				use = this.reflected.use();
			}
			use.transform("rotate(" + (i * 360 / this.params.radialRepetitionCount) + ")");
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
	createCurve: function() {
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
		if (this.params.doFill) {
			fillColour = this.contrastingColour(strokeColour);
		} else {
			fillColour = 'none';
		}
		for (i = 1; i < this.params.curvePoints; i++) {
			bezierPoints[0] = this.randomPoint();
			bezierPoints[1] = this.randomPoint();
			str += ( ' S ' + bezierPoints[0][0] + ' ' + bezierPoints[0][1]
				+ ", " + bezierPoints[1][0] + ' ' + bezierPoints[1][1]
			);
		}
		return this.snap.path(str).attr({
			stroke: strokeColour, strokeWidth: "1%", fill: fillColour
		});
	}
});

(function($){
	$(function() {
		var
			selector = "#svg",
			resizable = $('.resizable'),
			mandala = new Mandala.Mandala(selector),
			pathInput = $('#path')
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
		$('#generate').on("click", function() {
			mandala.init();
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
			values: [ 1, 3 ],
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
			min: 1,
			max: 10,
			values: [ 1, 3 ],
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
		mandala.init();
	});
})(jQuery);
