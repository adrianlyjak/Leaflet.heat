'use strict';


if (typeof module !== 'undefined') module.exports = simpleheat;

function simpleheat(canvas) {
    if (!(this instanceof simpleheat)) return new simpleheat(canvas);

    this._canvas = canvas = typeof canvas === 'string' ? document.getElementById(canvas) : canvas;

    this._ctx = canvas.getContext('2d');
    this._width = canvas.width;
    this._height = canvas.height;
    this._sorted = false;
    this._options = simpleheat.defaultOptions
    this._data = [];
}

simpleheat.prototype = {

    data: function (data) {
        this._data = data;
        this._sorted = false;
        return this;
    },


    add: function (point) {
        this._data.push(point);
        this._sorted = false;
        return this;
    },

    clear: function () {
        this._data = [];
        return this;
    },

    setOptions: function (options) {
        this._options = Object.assign({}, this._options, options);
        delete this._circles;
        delete this._grad;
        return this;
    },

    getOptions: function () {
        return Object.assign({}, this._options);
    },

    resize: function () {
        this._width = this._canvas.width;
        this._height = this._canvas.height;
    },


    _initializeCircleBrush: function () {

        var r2 = this._r = this._options.radius + this._options.blur;

        var canvas = this._circle = this._createCanvas();
        var ctx = canvas.getContext('2d');

        canvas.width = canvas.height = r2 * 2;

        ctx.shadowOffsetX = ctx.shadowOffsetY = r2 * 2;
        ctx.fillStyle = 'black'
        ctx.shadowColor = 'black';
        ctx.shadowBlur = this._options.blur;


        ctx.beginPath();
        ctx.arc(-r2, -r2, this._options.radius, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.fill();


    },

    _initializeGradient: function () {
        // create a 256x1 gradient that we'll use to turn a grayscale heatmap into a colored one
        var canvas = this._createCanvas(),
            ctx = canvas.getContext('2d'),
            gradient = ctx.createLinearGradient(0, 0, 0, 256);

        canvas.width = 1;
        canvas.height = 256;

        for (var i in this._options.gradient) {
            gradient.addColorStop(+i, this._options.gradient[i]);
        }

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 1, 256);

        this._grad = ctx.getImageData(0, 0, 1, 256).data;

        return this;
    },

    _reinitializeShadowCanvases: function () {
        if (!this._positiveCanvas) this._positiveCanvas = this._createCanvas();
        if (!this._negativeCanvas) this._negativeCanvas = this._createCanvas();
        if (!this._positiveCtx) this._positiveCtx = this._positiveCanvas.getContext('2d');
        if (!this._negativeCtx) this._negativeCtx = this._negativeCanvas.getContext('2d');
        this._positiveCanvas.width = this._width;
        this._negativeCanvas.width = this._width;
        this._positiveCanvas.height = this._height;
        this._negativeCanvas.height = this._height;
    },

    _sortData: function () {
        var self = this;
        // sort so that positive is painted over neutra is painted over negative. Unfortunately there does not seem to be
        // a globalCompositeOperation that treats source layers equally to the layer on the canvas.
        // Layer color painted last will be stronger
        function valueOfDataPoint(a) {
            return a[3] + (a[0] / self._height / 4) + (a[1] / self._width / 4);
        }
        this._data.sort(function (a, b) {
            return valueOfDataPoint(a) - valueOfDataPoint(b)
        });
        this._sorted = true;
    },

    _clearCanvas: function (c) {
        c.clearRect(0, 0, this._width, this._height);
    },

    _clearCanvases: function () {
        this._clearCanvas(this._positiveCtx);
        this._clearCanvas(this._negativeCtx);
        this._clearCanvas(this._ctx);
    },


    draw: function (minOpacity) {
        if (!this._circle) this._initializeCircleBrush();
        if (!this._grad) this._initializeGradient();
        if (!this._sorted) this._sortData();

        this._reinitializeShadowCanvases();
        this._clearCanvases()

        // draw circles according to points on a positive or negative canvas
        for (var i = 0, len = this._data.length, p; i < len; i++) {
            p = this._data[i];
            var weight = p[3] === 0 ? 0.5 : 1;
            var alpha = Math.max(p[2] * weight / this._options.max, minOpacity === undefined ? 0.05 : minOpacity);
            if (p[3] >= 0) {
               this._positiveCtx.globalAlpha = alpha;
               this._positiveCtx.drawImage(this._circle, p[0] - this._r, p[1] - this._r);
            }

            if (p[3] <= 0) {
                this._negativeCtx.globalAlpha = alpha;
                this._negativeCtx.drawImage(this._circle, p[0] - this._r, p[1] - this._r);
            }
        }

        // merge positive and negative into one grayscale image
        var positive = this._positiveCtx.getImageData(0, 0, this._width, this._height);
        var negative = this._negativeCtx.getImageData(0, 0, this._width, this._height)
        this._applyNegativeToPositive(
            positive.data,
            negative.data
        )

        // colorize the heatmap, using opacity value of each pixel to get the right color from our gradient
        this._colorize(positive.data, this._grad);
        this._ctx.putImageData(positive, 0, 0);
        return this;

    },

    _applyNegativeToPositive: function (positive, negative) {
        // merge the values and opacities of the negative and positive layers into a grayscale image
        var base = positive;
        for (var i = 0, len = base.length; i < len; i += 4) {
            var posAlpha = positive[i + 3],
                negAlpha = negative[i + 3],
                posVal = 255 - positive[i],
                negVal = negative[i];

            if (posAlpha && negAlpha) {
                var posPercent = posAlpha / 255;
                var negPercent = negAlpha / 255;
                var mergedPercent = posPercent + (1 - posPercent) * negPercent; // e.g. 0.5 transparancy + 0.5 transparancy = 0.75 transparency
                var mergedAlpha = Math.round(mergedPercent * 255);
                var totalAlphaPercent = posPercent + negPercent;
                // negative value is always 0, so just merge by multiply positive
                var ratioPos = posPercent / totalAlphaPercent;
                var mergedVal = Math.round(255 * ratioPos);

                base[i] = mergedVal,
                    base[i + 1] = mergedVal,
                    base[i + 2] = mergedVal,
                    base[i + 3] = mergedAlpha;
            } else if (posAlpha) {
                base[i] = posVal,
                base[i + 1] = posVal,
                base[i + 2] = posVal,
                base[i + 3] = posAlpha;

            } else if (negAlpha) {
                base[i] = negVal,
                base[i + 1] = negVal,
                base[i + 2] = negVal,
                base[i + 3] = negAlpha;
            }
        }
    },

    _colorize: function (pixels, gradient) {
        if (this._options.colorize) {
            for (var i = 0, len = pixels.length; i < len; i += 4) {
                var alpha = pixels[i + 3] / 256;

                if (alpha) {
                    var grayscale = pixels[i] // get gradient color from red value, (e.g. grayscale value)
                    if (this._options.alphaBurn > 0) {
                        var missingAlpha = (1 - alpha) * this._options.alphaBurn
                        var keepRatio = 1 - missingAlpha
                        // burn the gradient value towards the center of the gradient as the alpha is closer to 0
                        if (grayscale > 127) {
                            var offset = grayscale - 127
                            grayscale = Math.round(127 + (offset * keepRatio))
                        } else {
                            var offset = 127 - grayscale
                            grayscale = Math.round(127 - (offset * keepRatio))
                        }
                    }
                    var j = grayscale * 4;
                    pixels[i] = gradient[j];
                    pixels[i + 1] = gradient[j + 1];
                    pixels[i + 2] = gradient[j + 2];
                    pixels[i + 3] = Math.floor((gradient[j + 3] / 256) * (alpha) * 256);
                }
            }
        }
    },

    _createCanvas: function () {
        if (typeof document !== 'undefined') {
            return document.createElement('canvas');
        } else {
            // create a new canvas instance in node.js
            // the canvas class needs to have a default constructor without any parameter
            return new this._canvas.constructor();
        }
    }
};

function gray(v) {
    return 'rgb(' + v + ', ' + v + ', ' + v + ')';
}

simpleheat.defaultOptions = {
    alphaBurn: 1,
    max: 1,
    radius: 25,
    blur: 25,
    gradient: {
        '0.0': 'rgba(204, 0, 0, 1)',
        '0.33': 'rgba(255, 178, 0, 1)',
        '0.5': 'rgba(255, 255, 0, 1)',
        '0.66': 'rgba(180, 255, 0, 1)',
        '1.0': 'rgba(0, 214, 96, 1)'
    },
    colorize: true
}
