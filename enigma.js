/*jslint browser: true, devel: true, bitwise: true, plusplus: true, unparam: true, white: true */
"use strict";
(function () {
    var frame = document.createElement("canvas"),
        requestAnimationFrame = window.requestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            window.msRequestAnimationFrame,
        numbers = [[], [], [], []],
        offsets = [[], [], [], []],
        order = [[], [], [], []],
        textLayer = [],
        scrollTo = [],
        digits = [
            [1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1], // 0
            [1, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0], // 1
            [1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1], // 2
            [1, 1, 1, 0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 1, 1], // 3
            [1, 0, 1, 1, 0, 1, 1, 1, 1, 0, 0, 1, 0, 0, 1], // 4
            [1, 1, 1, 1, 0, 0, 1, 1, 1, 0, 0, 1, 1, 1, 1], // 5
            [1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1], // 6
            [1, 1, 1, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1], // 7
            [1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1], // 8
            [1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1] /// 9
        ],
        pixel = {
            width: 5,
            height: 5
        },
        colors = {
            LightGray: "#AAAAAA",
            Black: "#000000",
            JazzberryJam: "#AA0055",
            White: "#FFFFFF"
        },
        ctx,
        colWidth,
        center,
        lineHeight,
        halfLineHeight;

    var Layer = (function () {
        function Layer(x, y, w, h) {
            this.x = x;
            this.y = y;
            this.w = w;
            this.h = h;
            this.color = "#FFFFFF";
        }

        Layer.prototype.setTextColor = function (color) {
            this.color = color || this.color;
        };

        Layer.prototype.setText = function (text) {
            this.text = text;
        };
        return Layer;
    })();

    var fillOrder = function (i) {
        var n, k, tmp;

        for (n = 0; n < 10; ++n) {
            order[i][n] = n;
        }

        for (n = 0; n < 10; ++n) {
            k = Math.floor((Math.random() * 10));
            if (n !== k) {
                tmp = order[i][k];
                order[i][k] = order[i][n];
                order[i][n] = tmp;
            }
        }
    };

    var fillOffsets = function (i) {
        var n;

        for (n = 0; n < 10; ++n) {
            offsets[i][n] = order[i][n] + 2;
        }
    };

    var fillNumbers = function (i) {
        var n, p;

        for (n = 0; n < 10; ++n) {
            p = (order[i][n]) + 2;
            numbers[i][p] = n;

            if (p < 4) {
                p += 10;
                numbers[i][p] = n;
            } else if (p >= 10) {
                p -= 10;
                numbers[i][p] = n;
            }
        }
    };

    var drawDigit = function (num, x, y, color) {
        var paddingX = x + (colWidth - pixel.width * 3) / 2 >> 0,
            from = center - halfLineHeight,
            to = center + halfLineHeight,
            i;

        x = paddingX;
        y = y + ((lineHeight - pixel.height * 5) / 2 >> 0) - pixel.height;

        for (i = 0; i < 15; ++i) {
            if (i % 3 === 0) {
                x = paddingX;
                y += pixel.height;
            }
            if (digits[num][i] === 1) {
                if (!(x > frame.width || y > frame.height || x + pixel.width < 0 || y + pixel.height < 0)) {
                    if ((y > from) && (y < to)) {
                        ctx.globalCompositeOperation = "xor";
                        ctx.fillStyle = colors.White;
                        ctx.fillRect(x, y, pixel.width, pixel.height);

                        ctx.globalCompositeOperation = "source-atop";
                        ctx.fillStyle = colors.White;
                        ctx.fillRect(x, y, pixel.width, pixel.height);

                        ctx.globalCompositeOperation = "destination-over";
                    } else {
                        ctx.globalCompositeOperation = "source-over";
                    }

                    ctx.fillStyle = color;
                    ctx.fillRect(x, y, pixel.width, pixel.height);
                }
            }
            x += pixel.width;
        }
    };

    var drawLayer = function (layer) {
        var y = layer.y,
            i;

        ctx.globalCompositeOperation = "source-over";
        ctx.fillStyle = colors.Black;
        ctx.fillRect(layer.x, layer.y, layer.w, layer.h);

        ctx.globalCompositeOperation = "destination-out";
        ctx.fillStyle = layer.color;
        ctx.fillRect(layer.x, center - halfLineHeight, layer.w, lineHeight);

        for (i = 0; i < layer.text.length; ++i) {
            drawDigit(layer.text[i], layer.x, y, layer.color);
            y += lineHeight;
        }

        ctx.globalCompositeOperation = "destination-over";
        ctx.fillStyle = colors.JazzberryJam;
        ctx.fillRect(layer.x, center - halfLineHeight, layer.w, lineHeight);
    };

    var animateLayer = function (i, duration) {
        var start = new Date().getTime(),
            end = start + duration,
            layer = textLayer[i],
            current = layer.y,
            distance = scrollTo[i] - current,
            step = function () {
                var timestamp = new Date().getTime(),
                    progress = Math.min((duration - (end - timestamp)) / duration, 1);

                layer.y = current + (distance * progress);
                drawLayer(layer);

                if (progress < 1) {
                    requestAnimationFrame(step);
                }
            };

        return step();
    };

    var setDigit = function (i, num) {
        var prev = scrollTo[i];

        scrollTo[i] = (offsets[i][num] * -lineHeight) + center - halfLineHeight;

        if (prev !== scrollTo[i]) {
            animateLayer(i, 1000);
        }
    };

    var displayTime = function (date) {
        var h = date.getHours(),
            m = date.getMinutes();

        setDigit(0, h / 10 >> 0);
        setDigit(1, h % 10);
        setDigit(2, m / 10 >> 0);
        setDigit(3, m % 10);
    };

    var checkTime = function () {
        var m = null;

        return function () {
            var d = new Date(),
                n = d.getMinutes();

            if (m !== n) {
                displayTime(d);
            }

            m = n;
        };
    };

    var init = function () {
        var i;

        frame.width = 144;
        frame.height = 168;
        document.body.appendChild(frame);
        ctx = frame.getContext("2d");
        colWidth = frame.width / 4;
        center = frame.height / 2;
        lineHeight = frame.height / 4;
        halfLineHeight = frame.height / 8;

        for (i = 0; i < 4; ++i) {
            fillOrder(i);
            fillOffsets(i);
            fillNumbers(i);

            textLayer[i] = new Layer(i * colWidth, 0, colWidth, 800);
            textLayer[i].setTextColor(colors.LightGray);
            textLayer[i].setText(numbers[i]);
        }

        displayTime(new Date());
        window.setInterval(checkTime(), 1000);
    };

    init();
})();