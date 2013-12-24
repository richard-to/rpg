/** @jsx React.DOM */
(function(window, undefined) {

    var rpg = window.rpg;
    var combat = rpg.combat;
    var graphics = rpg.graphics;
    var entities = rpg.entities;
    var util = rpg.util;

    // Constants for key controls.
    var Control = {
        LEFT: 37,
        UP: 38,
        RIGHT: 39,
        DOWN: 40,
        PAUSE: 13
    };

    var GameDungeon = function(party, datastore, options) {
        this.options = $.extend(true, {
            screen: {
                tileSize: 0,
                gridWidth: 0,
                gridHeight: 0,
                gridMidWidth: 0,
                gridMidHeight: 0,
                gridRemWidth: 0,
                gridRemHeight: 0
            },
            assets: {
                dungeon: {
                    map: '',
                    spritesheet: '',
                    spritemeta: ''
                }
            },
            tileList: {},
            heroList: {},
            heroFrames: {},
            enemyList: [],
            enemyFrames: [],
            playerData: {
                leader: '',
                party: [],
            },
            levelData: {
                dungeon: {
                    start: {x: 0 , y: 0},
                    walkableTiles: [],
                    combatProbability: 0.0
                }
            }
        }, options);

        this.party = party;

        this.datastore = datastore;

        this.screen = this.options.screen;
        this.assets = this.options.assets.dungeon;
        this.levelData = this.options.levelData.dungeon;
        this.playerData = this.options.playerData;

        this.heroList = this.options.heroList;
        this.heroFrames = this.options.heroFrames;
        this.enemyList = this.options.enemyList;
        this.enemyFrames = this.options.enemyFrames;

        this.map = null;
        this.spritemeta = null;
        this.spritesheet = null;

        this.tileFactory = null;
        this.bgRenderer = null;
        this.spriteRenderer = null;

        this.sprites = [];
        this.heroSprite = null;
    };

    // Loads necessary assets.
    GameDungeon.prototype.load = function(onLoad) {
        var self = this;
        var assets = this.assets;
        var datastore = this.datastore;
        datastore.load(assets, function() {
            for (var key in assets) {
                if (self[key] === null) {
                    self[key] = datastore.get(assets[key]);
                }
            }
            self.onAssetsLoad();
            onLoad();
        });
    };

    // Once external assets are loaded, everything else is initialized.
    // TODO(richard-to): Clean up reloading dungeon/battles multiple times
    GameDungeon.prototype.onAssetsLoad = function() {
        if (this.tileFactory == null) {
            this.initTiles();
        }
        if (this.spriteRenderer == null) {
            this.initSprites();
        }

        if (this.heroSprite == null) {
            this.initHero();
        }
    };

    // Initializes tiles and background renderer.
    GameDungeon.prototype.initTiles = function() {
        var tileList = this.options.tileList;
        this.tileFactory = [];

        for (var i = 0; i < tileList.length; i++) {
            this.tileFactory.push(new rpg.graphics.SpriteTile(
                this.spritemeta.frames[tileList[i]].frame, this.spritesheet));
        }
        this.bgRenderer = new rpg.graphics.BgRenderer(
            this.map, this.tileFactory, this.options.screen);
    };

    // Initializes sprite renderer.
    GameDungeon.prototype.initSprites = function() {
        this.spriteRenderer = new rpg.graphics.SpriteRenderer(
            this.map, this.spritesheet, this.screen);
    };

    // Initializes hero sprite.
    GameDungeon.prototype.initHero = function() {
        var playerData = this.playerData;
        var levelData = this.levelData;
        var heroFrames = this.heroFrames[playerData.leader];
        var frames = {};
        for (var name in heroFrames) {
            frames[name] = this.spritemeta.frames[heroFrames[name]]
        }
        this.heroSprite = new rpg.graphics.SpriteAnim(frames, this.map);
        this.heroSprite.x = levelData.start.x;
        this.heroSprite.y = levelData.start.y;
        this.heroSprite.faceRight();
        this.sprites.unshift(this.heroSprite);
    };

    // Handles controls for this aspect of the game.
    GameDungeon.prototype.onKeydown = function(e) {
        if (e.which == Control.RIGHT) {
            this.moveRight();
        } else if (e.which == Control.LEFT) {
            this.moveLeft();
        } else if (e.which == Control.UP) {
            this.moveUp();
        } else if (e.which == Control.DOWN) {
            this.moveDown();
        } else {
            return;
        }
        e.preventDefault();
    };

    GameDungeon.prototype.isPath = function(tile) {
        var walkableTiles = this.levelData.walkableTiles;
        for (var i = 0; i < walkableTiles.length; i++) {
            if (tile == walkableTiles[i]) {
                return true;
            }
        }
        return false;
    };

    GameDungeon.prototype.moveRight = function() {
        var y = this.heroSprite.y;
        var x = this.heroSprite.x + 1;
        if (x < this.map[0].length && this.isPath(this.map[y][x])) {
            this.heroSprite.moveRight();
        } else {
            this.heroSprite.faceRight();
        }
    };

    GameDungeon.prototype.moveLeft = function() {
        var y = this.heroSprite.y;
        var x = this.heroSprite.x - 1;

        if (x >= 0 && this.isPath(this.map[y][x])) {
            this.heroSprite.moveLeft();
        } else {
            this.heroSprite.faceLeft();
        }
    };

    GameDungeon.prototype.moveUp = function() {
        var y = this.heroSprite.y - 1;
        var x = this.heroSprite.x;
        if (y >= 0 && this.isPath(this.map[y][x])){
            this.heroSprite.moveUp();
        } else {
            this.heroSprite.faceUp();
        }
    };

    GameDungeon.prototype.moveDown = function() {
        var y = this.heroSprite.y + 1;
        var x = this.heroSprite.x;
        if (y < this.map.length && this.isPath(this.map[y][x])) {
            this.heroSprite.moveDown();
        } else {
            this.heroSprite.faceDown();
        }
    };
    rpg.GameDungeon = GameDungeon;


    // Loads the combat aspect of the game.
    var GameArena = function(party, datastore, options) {
        this.options = $.extend(true, {
            screen: {
                tileSize: 0,
                gridWidth: 0,
                gridHeight: 0,
                gridMidWidth: 0,
                gridMidHeight: 0,
                gridRemWidth: 0,
                gridRemHeight: 0
            },
            assets: {
                arena: {
                    map: '',
                    spritesheet: '',
                    spritemeta: ''
                }
            },
            tileList: {},
            heroList: {},
            heroFrames: {},
            enemyList: [],
            enemyFrames: [],
            playerData: {
                leader: '',
                party: [],
            },
            levelData: {
                arena: {
                    start: {x: 0 , y: 0},
                    menuDiv: ''
                }
            }
        }, options);

        this.party = party;
        this.datastore = datastore;

        this.screen = this.options.screen;
        this.assets = this.options.assets.arena;
        this.levelData = this.options.levelData.arena;
        this.playerData = this.options.playerData;

        this.heroList = this.options.heroList;
        this.heroFrames = this.options.heroFrames;
        this.enemyList = this.options.enemyList;
        this.enemyFrames = this.options.enemyFrames;

        this.map = null;
        this.spritemeta = null;
        this.spritesheet = null;

        this.tileFactory = null;
        this.bgRenderer = null;
        this.spriteRenderer = null;

        this.sprites = [];
        this.partySprites = [];
        this.enemySprites = [];
        this.enemies = null;
    };

    // Loads the assets needed to run this aspect of the game.
    GameArena.prototype.load = function(onLoad) {
        var assets = this.assets;
        var datastore = this.datastore;
        var self = this;
        datastore.load(assets, function() {
            for (var key in assets) {
                if (self[key] === null) {
                    self[key] = datastore.get(assets[key]);
                }
            }
            self.onAssetsLoad();
            onLoad();
        });
    };

    // Once external assets are loaded, everything else is initialized.
    GameArena.prototype.onAssetsLoad = function() {
        this.sprites = [];
        this.partySprites = [];
        this.enemySprites = [];

        if (this.tileFactory == null) {
            this.initTiles();
        }

        if (this.spriteRenderer == null) {
            this.initSprites();
        }

        this.initHero();
        this.initParty();
        this.initEnemies();
        this.initMenu();
    };

    // Initializes tiles and background renderer.
    GameArena.prototype.initTiles = function() {
        var tileList = this.options.tileList;
        this.tileFactory = [];

        for (var i = 0; i < tileList.length; i++) {
            this.tileFactory.push(new rpg.graphics.SpriteTile(
                this.spritemeta.frames[tileList[i]].frame, this.spritesheet));
        }

        this.bgRenderer = new rpg.graphics.BgRenderer(
            this.map, this.tileFactory, this.screen);
    };

    // Initializes sprite renderer.
    GameArena.prototype.initSprites = function() {
        this.spriteRenderer = new rpg.graphics.SpriteRenderer(
            this.map, this.spritesheet, this.screen);
    };

    // Initializes hero sprite.
    GameArena.prototype.initHero = function() {
        var playerData = this.playerData;
        var levelData = this.levelData;
        var heroFrames = this.heroFrames[playerData.leader];
        var frames = {};
        for (var name in heroFrames) {
            frames[name] = this.spritemeta.frames[heroFrames[name]];
        }
        this.heroSprite = new rpg.graphics.SpriteAnim(frames);
        this.heroSprite.x = 8;
        this.heroSprite.y = 2;
        this.heroSprite.faceLeft();
        this.sprites.unshift(this.heroSprite);
        this.partySprites.unshift(this.heroSprite);
    };

    // Initializes party members.
    GameArena.prototype.initParty = function() {
        var party = this.playerData.party;
        for (var i = 0; i < party.length; i++) {
            var frames = {};
            for (var name in this.heroFrames[party[i]]) {
                frames[name] = this.spritemeta.frames[this.heroFrames[party[i]][name]];
            }
            var partyMember = new rpg.graphics.SpriteAnim(frames, this.map);
            partyMember.x = 8;
            partyMember.y = 2 + (i + 1) * 2;
            partyMember.faceLeft();
            this.partySprites.push(partyMember);
            this.sprites.unshift(partyMember);
        }
    };

    // Initializes enemies.
    GameArena.prototype.initEnemies = function() {
        var maxEnemies = 2;
        var numEnemies = Math.floor((Math.random() * maxEnemies) + 1);
        var enemies = [];
        var enemySprites = [];
        var x = 1;
        var y = 2;
        for (var i = 0; i < numEnemies; i++) {
            var enemyType = (Math.floor((Math.random() * this.enemyList.length)));
            var enemyFrame = this.enemyFrames[enemyType];
            enemies.push(new this.enemyList[enemyType]());
            var enemySprite = new rpg.graphics.SpriteEnemy(this.spritemeta.frames[enemyFrame]);
            enemySprite.x = x;
            enemySprite.y = y;
            enemySprite.faceRight();
            enemySprites.push(enemySprite);
            this.sprites.unshift(enemySprite);
            x += 1;
            y += 2;
        }
        this.enemies = enemies;
        this.enemySprites = enemySprites;
    };

    // Initializes combat menu.
    GameArena.prototype.initMenu = function() {
        var handleBattleFinished = this.handleBattleFinished.bind(this);
        var CombatApp = rpg.combat.App;
        React.renderComponent(
            <CombatApp
                onBattleFinished={handleBattleFinished}
                party={this.party}
                enemies={this.enemies}
                partySprites={this.partySprites}
                enemySprites={this.enemySprites} />,
            document.getElementById(this.levelData.menuDiv)
        );
    };

    GameArena.prototype.handleBattleFinished = function() {
        // TODO(richard-to): Should unmount be called here or inside component?
        React.unmountComponentAtNode(document.getElementById(this.levelData.menuDiv));
        this.onBattleFinished();
    };

    // Currently no key commands. Need to figure out how to interact with React components.
    GameArena.prototype.onKeydown = function(e) {};
    rpg.GameArena = GameArena;


    // Animation loop. Draws sprites and backgrounds in a continous loop.
    var AnimLoop = function(ctx, canvas, level) {
        this.animStopped = false;
        this.keyWait = false;
        this.ctx = ctx;
        this.canvas = canvas;
        this.heroSprite = level.heroSprite;
        this.sprites = level.sprites;
        this.bgRenderer = level.bgRenderer;
        this.spriteRenderer = level.spriteRenderer;
    };

    // Animate is called recursively unless the animation loop is explicitly
    // stopped using this.animStopped.
    AnimLoop.prototype.animate = function() {
        if (this.animStopped) {
            return;
        }
        var self = this;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.bgRenderer.draw(this.ctx, this.heroSprite.getX(), this.heroSprite.getY());

        this.sprites.forEach(function(sprite) {
            self.spriteRenderer.draw(self.ctx, sprite);
        });

        this.sprites.forEach(function(sprite) {
            if (sprite == self.heroSprite && !sprite.hasFrames()) {
                self.keyWait = false;
            }

            if (!sprite.hasFrames() && sprite.callback) {
                sprite.callback();
                sprite.callback = null;
            }
        });

        requestAnimationFrame(function() {
            self.animate();
        });
    };
    rpg.AnimLoop = AnimLoop;


    var GameLevel = function(canvas, ctx, datastore, party, options) {
        this.options = $.extend(true, {
            screen: {
                tileSize: 0,
                gridWidth: 0,
                gridHeight: 0,
                gridMidWidth: 0,
                gridMidHeight: 0,
                gridRemWidth: 0,
                gridRemHeight: 0
            },
            assets: {
                dungeon: {
                    map: '',
                    spritesheet: '',
                    spritemeta: ''
                },
                arena: {
                    map: '',
                    spritesheet: '',
                    spritemeta: ''
                }
            },
            tileList: {},
            heroList: {},
            heroFrames: {},
            enemyList: [],
            enemyFrames: [],
            playerData: {
                leader: '',
                party: [],
            },
            levelData: {
                dungeon: {
                    start: {x: 0 , y: 0},
                    walkableTiles: [],
                    combatProbability: 0.0
                },
                arena: {
                    start: {x: 0 , y: 0},
                    menuDiv: ''
                }
            }
        }, options);
        this.ctx = ctx;
        this.canvas = canvas;
        this.datastore = datastore;
        this.party = party;
        this.dungeon = new GameDungeon(this.party, this.datastore, this.options);
        this.arena = new GameArena(this.party, this.datastore, this.options);
    };

    GameLevel.prototype.run = function() {
        this.loadExploration();
    };

    // Loads exploration mode.
    GameLevel.prototype.loadExploration = function() {
        var self = this;
        this.pauseKeyListener();
        if (this.animLoop) {
            this.animLoop.animStopped = true;
        }
        this.dungeon.load(function() {
            self.animLoop = new AnimLoop(self.ctx, self.canvas, self.dungeon);
            self.animLoop.animate();
            self.initExplorationControls();
        });
    };

    // Loads combat mode.
    GameLevel.prototype.loadCombat = function() {
        var self = this;
        this.pauseKeyListener();
        if (this.animLoop) {
            this.animLoop.animStopped = true;
        }
        this.arena.load(function() {
            self.animLoop = new AnimLoop(self.ctx, self.canvas, self.arena);
            self.animLoop.animate();
            self.arena.onBattleFinished = function() {
                self.loadExploration();
            }
        });
    };

    // Pauses global key listener.
    GameLevel.prototype.pauseKeyListener = function() {
        $(document.body).off('keydown');
    };

    // Key listener that delegates events to level objects.
    // Also currently handles combat mode transition. Should
    // probably be moved out here?
    GameLevel.prototype.initExplorationControls = function() {
        var self = this;
        var dungeon = this.dungeon;
        var combatProbability = this.dungeon.levelData.combatProbability;
        $(document.body).on('keydown', function(e) {
            if (self.animLoop.keyWait) {
                return;
            }
            // TODO(richard-to): Belongs here?
            if (Math.random() < combatProbability) {
                self.loadCombat();
            } else {
                dungeon.onKeydown(e);
            }
            self.animLoop.keyWait = true;
        });
    };
    rpg.GameLevel = GameLevel;

    // Game Engine is the main controller for swapping out levels, managing
    // animation, delegate key events. Need to make this thinner.
    var GameEngine = function(el, options) {
        this.options = options;

        this.screen = this.options.screen;
        this.datastore = new util.Datastore();
        this.el = el;
        this.$el = $(el);
        this.canvas = document.createElement('canvas');
        this.canvas.width = this.screen.tileSize * this.screen.gridWidth;
        this.canvas.height = this.screen.tileSize * this.screen.gridHeight;

        // TODO(richard-to): Move this to util?
        this.screen.gridMidWidth = Math.floor(this.screen.gridWidth / 2);
        if (this.gridWidth % 2 == 0) {
            this.screen.gridMidWidth -= 1;
        }
        this.screen.gridRemWidth = this.screen.gridWidth - this.screen.gridMidWidth;
        this.screen.gridMidHeight = Math.floor(this.screen.gridHeight / 2);
        if (this.screen.gridHeight % 2 == 0) {
            this.screen.gridMidHeight -= 1;
        }
        this.screen.gridRemHeight = this.screen.gridHeight - this.screen.gridMidHeight;

        this.ctx = this.canvas.getContext('2d');
        this.el.appendChild(this.canvas);

        this.party = [];
        for (key in this.options.heroList) {
            this.party.push(new this.options.heroList[key]());
        }

        // TODO(richard-to): Not a huge fan of passing the party array everywhere...
        this.level = new GameLevel(this.canvas, this.ctx, this.datastore, this.party, this.options);
    };

    // Starts the game in exploration mode.
    GameEngine.prototype.run = function() {
        this.level.run();
    };
    rpg.GameEngine = GameEngine;

})(window);