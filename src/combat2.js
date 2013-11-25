/** @jsx React.DOM */
(function(window, undefined) {

    var Entity = function(options) {
        this.attr = {
            id: null,
            name: 'Entity',
            hp: 100,
            hpMax: 100,
            mp: 10,
            mpMax: 10,
            attack: 2
        };
        _.extend(this.attr, options);
    };

    Entity.prototype.attack = function() {
        return this.attr.attack;
    };

    Entity.prototype.takeDamage = function(damage) {
        this.attr.hp -= damage;
        if (this.attr.hp < 0) {
            this.attr.hp = 0;
        }
    };

    Entity.prototype.isDead = function() {
        return this.prototype.hp == 0;
    };

    var Enemy = function(options) {
        Entity.call(this, {
            name: 'Enemy',
            hp: 140,
            hpMax: 140,
            mp: 0,
            mpMax: 0,
            attack: 10,
            exp: 5
        });
        _.extend(this.attr, options);
    };
    Enemy.prototype = Object.create(Entity.prototype);
    Enemy.prototype.constructor = Entity;

    var Player = function(options) {
        Entity.call(this, {
            name: 'Player',
            hp: 200,
            hpMax: 200,
            mp: 20,
            mpMax: 20,
            attack: 20,
            exp: 0,
            level: 1
        });
        _.extend(this.attr, options);
    };
    Player.prototype = Object.create(Entity.prototype);
    Player.prototype.constructor = Entity;

    var gameEl = document.getElementById('game-wrap');

    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');

    canvas.width = 640;
    canvas.height = 480;

    gameEl.appendChild(canvas);

    var GameCanvas = function(ctx, gameState) {
        this.ctx = ctx;
        this.gameState = gameState;
        this.frames = [];
    };

    GameCanvas.prototype.setFrames = function(frames, callback) {
        this.callback = callback;
        this.frames = frames;
    }

    GameCanvas.prototype.animate = function() {
        var self = this;
        if (this.frames.length == 0 && this.callback) {
            this.callback();
            this.callback = null;
        }
        this.draw();
        requestAnimationFrame(function() {
            self.animate();
        });
    };

    GameCanvas.prototype.draw = function() {
        var ctx = this.ctx;
        var partyTurn = this.gameState.partyTurn;
        var selectedEnemy = this.gameState.selectedEnemy;
        var party = party = this.gameState.party;
        var enemies = this.gameState.enemies;

        ctx.beginPath();
        ctx.rect(0, 0, 640, 480);
        ctx.fillStyle = 'black';
        ctx.fill();

        var py = 75;
        var px = 0;
        if (this.frames != null && this.frames.length > 0) {
            var f = this.frames.shift();
            px = f[0];
            if (f[1] > 0) {
                --f[1];
                this.frames.unshift(f);
            }
        }
        for (var i = 0; i < enemies.length; i++) {
            if (px > 0 || selectedEnemy != null && selectedEnemy.attr.id == enemies[i].attr.id) {
                ctx.beginPath();
                ctx.arc(75 + px, py, 55, 0, 2 * Math.PI, false);
                ctx.fillStyle = 'yellow';
                ctx.fill();
            }

            ctx.beginPath();
            ctx.arc(75 + px, py, 50, 0, 2 * Math.PI, false);
            ctx.fillStyle = 'red';
            ctx.fill();
            ctx.font = '14px Calibri';
            ctx.fillStyle = 'white';
            ctx.fillText(enemies[i].attr.name, 75-50+10 + px, py-7);
            py += 125;
        }

        var py = 100;
        for (var i = 0; i < party.length; i++) {
            if (partyTurn != null && partyTurn.attr.id == party[i].attr.id) {
                ctx.beginPath();
                ctx.arc(640-150, py, 55, 0, 2 * Math.PI, false);
                ctx.fillStyle = 'yellow';
                ctx.fill();
            }

            ctx.beginPath();
            if (partyTurn != null && partyTurn.attr.id == party[i].attr.id) {
                ctx.arc(640-150, py, 50, 0, 2 * Math.PI, false);
            } else {
                ctx.arc(640-100, py, 50, 0, 2 * Math.PI, false);
            }
            ctx.fillStyle = 'green';
            ctx.fill();
            ctx.font = '14px Calibri';
            ctx.fillStyle = 'white';
            if (partyTurn != null && partyTurn.attr.id == party[i].attr.id) {
                ctx.fillText(party[0].attr.name, 640-175, py-7);
            } else {
                ctx.fillText(party[0].attr.name, 640-125, py-7);
            }
            py += 125;
        }
    };

    var EnemyMenu = React.createClass({
        handleClick: function(entity, event) {
            this.props.onEnemySelect(entity, event);
        },
        handleHover: function(entity, event) {
            this.props.onEnemyHover(entity, event);
        },

        render: function() {
            var self = this;
            var createItem = function(entity) {
                return (
                    <tr
                        onClick={self.handleClick.bind(self, entity)}
                        onMouseEnter={self.handleHover.bind(self, entity)}
                        onMouseLeave={self.handleHover.bind(self, null)}>
                        <td className="name">{entity.attr.name}</td>
                        <td className="hp">{entity.attr.hp}/{entity.attr.hpMax}</td>
                        <td className="mp">{entity.attr.mp}/{entity.attr.mpMax}</td>
                    </tr>
                )
            };
            return (
                <div className="enemy-wrap">
                <table className="entity-status">
                    <tr><td></td><td>HP</td><td>MP</td></tr>
                    {this.props.enemies.map(createItem)}
                </table>
                </div>
            );
        }
    });

    var ActionMenu = React.createClass({
        handleAttack: function(event) {
            this.props.onActionSelect(event);
        },
        render: function() {
            return (
                <div className="action-wrap">
                <table className="action-status">
                    <tr>
                        <td onClick={this.handleAttack}>Attack</td>
                        <td>Defend</td>
                    </tr>
                    <tr>
                        <td>Magic</td>
                        <td>Items</td>
                    </tr>
                    <tr>
                        <td>Run</td>
                    </tr>
                </table>
                </div>
            );
        }
    });

    var PartyMenu = React.createClass({
        render: function() {
            var createItem = function(entity) {
                return (
                    <tr>
                        <td className="name">{entity.attr.name}</td>
                        <td className="hp">{entity.attr.hp}/{entity.attr.hpMax}</td>
                        <td className="mp">{entity.attr.mp}/{entity.attr.mpMax}</td>
                    </tr>
                )
            };
            return (
                <div className="party-wrap">
                <table className="entity-status">
                    <tr><td></td><td>HP</td><td>MP</td></tr>
                    {this.props.party.map(createItem)}
                </table>
                </div>
            );
        }
    });

    var CombatApp = React.createClass({
        getInitialState: function() {
            return {showActions: 1};
        },
        handleActionSelect: function(event) {
            this.setState({showActions: 2});
        },
        handleEnemySelect: function(entity, event) {
            var self = this;
            entity.takeDamage(this.props.party[0].attack());
            this.props.gameState.partyTurn = null;
            this.props.gameState.selectedEnemy = null;
            var frames = [
                [5, 2],
                [10, 2],
                [15, 2],
                [20, 2],
            ];
            this.props.gameCanvas.setFrames(frames, function() {
                self.props.gameState.partyTurn = self.props.party[0];
                self.props.party[0].takeDamage(self.props.enemies[0].attack());
                self.props.party[0].takeDamage(self.props.enemies[1].attack());
                self.setState({showActions: 1});
            });
            this.setState({showActions: 0});
        },
        handleEnemyHover: function(entity, event) {
            this.props.gameState.selectedEnemy = entity;
        },
        render: function() {
            if (this.state.showActions == 1) {
                return (
                    <div className="combat-wrap">
                        <ActionMenu onActionSelect={this.handleActionSelect} />
                        <PartyMenu party={this.props.party} />
                    </div>
                );
            } else if (this.state.showActions == 2) {
                return (
                    <div className="combat-wrap">
                        <EnemyMenu
                            enemies={this.props.enemies}
                            onEnemySelect={this.handleEnemySelect}
                            onEnemyHover={this.handleEnemyHover} />
                        <PartyMenu party={this.props.party} />
                    </div>
                );
            } else {
                return (
                    <div className="combat-wrap">
                        <PartyMenu party={this.props.party} />
                    </div>
                );
            }
        }
    });

    var hero = new Player({id: 'h1', name: "Hero"});
    var orc1 = new Enemy({id: 'e1', name: "Orc 1"});
    var orc2 = new Enemy({id: 'e2', name: "Orc 2"});

    var party = [hero];
    var enemies = [orc1, orc2];

    var gameState = {
        partyTurn: hero,
        enemyTurn: false,
        selectedEnemy: null,
        party: party,
        enemies: enemies,
    };
    var gameCanvas = new GameCanvas(ctx, gameState);
    gameCanvas.animate();

    React.renderComponent(
        <CombatApp party={party} gameState={gameState} enemies={enemies} gameCanvas={gameCanvas} />,
        document.getElementById('game-combat-wrap')
    );

})(window);
