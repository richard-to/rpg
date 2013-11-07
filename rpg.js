var TILE_TYPE_ROAD = 0;
var TILE_TYPE_WALL = 1;
var TILE_SIZE = 64;
var MAP_WIDTH = 6;
var MAP_HEIGHT = 6;

var spriteSheetUrl = 'sprites.png';
var spriteSheet = null;
var spriteSheetMetaUrl = 'sprites.json';
var spriteSheetMeta = [];

var body = document.body;
var $body = $(body);
var canvas = document.createElement('canvas');
var ctx = canvas.getContext('2d');

var changedState = false;
var animateFrames = [];
body.appendChild(canvas);

var posX = 0;
var posY = 1;

var centerX = 2;
var centerY = 2;

var frames = {
    "face_down":
    {
        "frame": {"x":112,"y":130,"w":30,"h":62},
        "rotated": false,
        "trimmed": true,
        "spriteSourceSize": {"x":17,"y":2,"w":30,"h":62},
        "sourceSize": {"w":64,"h":64}
    },
    "face_left":
    {
        "frame": {"x":68,"y":68,"w":24,"h":64},
        "rotated": false,
        "trimmed": true,
        "spriteSourceSize": {"x":20,"y":0,"w":24,"h":64},
        "sourceSize": {"w":64,"h":64}
    },
    "face_right":
    {
        "frame": {"x":68,"y":2,"w":24,"h":64},
        "rotated": false,
        "trimmed": true,
        "spriteSourceSize": {"x":20,"y":0,"w":24,"h":64},
        "sourceSize": {"w":64,"h":64}
    },
    "face_up":
    {
        "frame": {"x":94,"y":66,"w":30,"h":62},
        "rotated": false,
        "trimmed": true,
        "spriteSourceSize": {"x":17,"y":2,"w":30,"h":62},
        "sourceSize": {"w":64,"h":64}
    },
    "road1":
    {
        "frame": {"x":2,"y":68,"w":64,"h":64},
        "rotated": false,
        "trimmed": false,
        "spriteSourceSize": {"x":0,"y":0,"w":64,"h":64},
        "sourceSize": {"w":64,"h":64}
    },
    "road2":
    {
        "frame": {"x":2,"y":2,"w":64,"h":64},
        "rotated": false,
        "trimmed": false,
        "spriteSourceSize": {"x":0,"y":0,"w":64,"h":64},
        "sourceSize": {"w":64,"h":64}
    },
    "walk_down":
    {
        "frame": {"x":94,"y":2,"w":30,"h":62},
        "rotated": false,
        "trimmed": true,
        "spriteSourceSize": {"x":16,"y":2,"w":30,"h":62},
        "sourceSize": {"w":64,"h":64}
    },
    "walk_left":
    {
        "frame": {"x":38,"y":134,"w":34,"h":64},
        "rotated": false,
        "trimmed": true,
        "spriteSourceSize": {"x":15,"y":0,"w":34,"h":64},
        "sourceSize": {"w":64,"h":64}
    },
    "walk_right":
    {
        "frame": {"x":2,"y":134,"w":34,"h":64},
        "rotated": false,
        "trimmed": true,
        "spriteSourceSize": {"x":15,"y":0,"w":34,"h":64},
        "sourceSize": {"w":64,"h":64}
    },
    "walk_up":
    {
        "frame": {"x":74,"y":134,"w":36,"h":62},
        "rotated": false,
        "trimmed": true,
        "spriteSourceSize": {"x":14,"y":2,"w":36,"h":62},
        "sourceSize": {"w":64,"h":64}
    }
};

var map = [
    [1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0],
    [0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0],
    [0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0],
    [1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0],
    [0, 1, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0],
    [0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0],
    [1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0],
    [0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0],
    [0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0],
    [1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0],
    [0, 1, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0],
    [0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0]
];

var redrawMap = function() {
    var sy = centerY - 2;
    var sx = centerX - 2;
    var ey = centerY + 3;
    var ex = centerX + 3;
    for (var y = sy; y <= ey; ++y) {
        for (var x = sx; x <= ex; ++x) {
            var tileType = map[y][x];
            var cy = (y - sy) * TILE_SIZE;
            var cx = (x - sx) * TILE_SIZE;
            if (tileType == TILE_TYPE_WALL) {
                var frame = frames.road2.frame;
                ctx.drawImage(spriteSheet,
                    frame.x, frame.y, frame.w, frame.h,
                    cx, cy, frame.w, frame.h);
            } else if (tileType == TILE_TYPE_ROAD) {
                ctx.beginPath();
                ctx.rect(cx, cy, TILE_SIZE, TILE_SIZE);
                ctx.fillStyle = 'green';
                ctx.fill();
            }
        }
    }
};

var redrawSprites = function () {
    var sy = centerY - 2;
    var sx = centerX - 2;
    var ey = centerY + 3;
    var ex = centerX + 3;
    var data = animateFrames.pop();
    if (data) {
        var frame = data[0].frame;
        ctx.drawImage(spriteSheet,
            frame.x, frame.y, frame.w, frame.h,
            (TILE_SIZE - frame.w) / 2 + (data[1] - sx) * TILE_SIZE, (TILE_SIZE - frame.h) / 2 + TILE_SIZE * (data[2] - sy), frame.w, frame.h);
        if (data[4] < data[3]) {
            ++data[4];
            animateFrames.push(data);
        }
    }
    if (animateFrames.length > 0) {
        changedState = true;
    }
};

var loadSpriteSheet = function() {
    spriteSheet = new Image();
    spriteSheet.src = spriteSheetUrl;
    spriteSheet.onload = function() {
        changedState = true;
        animateFrames = [[frames.face_right, posX, posY, 0, 0]];
        animate();
    }
};

var animate = function() {
    if (changedState) {
        changedState = false;
        redrawMap();
        redrawSprites();
    }

    requestAnimationFrame(function() {
        animate();
    });
};

var canvasWidth = TILE_SIZE * MAP_WIDTH;
var canvasHeight = TILE_SIZE * MAP_HEIGHT;

canvas.width = canvasWidth;
canvas.height = canvasHeight;

loadSpriteSheet();

$body.keyup(function(e) {
    if (e.which == 39) {
        posX = (posX + 1) % map.length;
        centerX = posX;
        if (centerX < 2) {
            centerX = 2;
        } else if (centerX > map.length - 4) {
            centerX = map.length - 4;
        }
        animateFrames = [[frames.face_right, posX, posY, 0, 0], [frames.walk_right, posX-0.5, posY, 3, 0]];
    } else if (e.which == 37) {
        posX -= 1;
        if (posX < 0) {
            posX = map.length - 1;
        }
        centerX = posX;
        if (centerX < 2) {
            centerX = 2;
        } else if (centerX > map.length - 4) {
            centerX = map.length - 4;
        }
        animateFrames = [[frames.face_left, posX, posY, 0, 0], [frames.walk_left, posX+0.5, posY, 3, 0]];
    } else if (e.which == 38) {
        var oldPosY = posY;
        posY -= 1;
        centerY = posY;
        if (posY < 0) {
            posY = map.length - 1;
        }
        if (centerY < 2) {
            centerY = 2;
        } else if (centerY > map.length - 4) {
            centerY = map.length - 4;
        }
        animateFrames = [[frames.face_up, posX, posY, 0, 0], [frames.walk_up, posX, posY+0.5, 3, 0]];
    } else if (e.which == 40) {
        var oldPosY = posY;
        posY = (posY + 1) % map.length;
        centerY = posY;
        if (centerY < 2) {
            centerY = 2;
        } else if (centerY > map.length - 4) {
            centerY = map.length - 4;
        }
        animateFrames = [[frames.face_down, posX, posY, 0, 0], [frames.walk_down, posX, posY-0.5, 3, 0]];
    } else {
        return;
    }
    changedState = true;
    e.preventDefault();
});