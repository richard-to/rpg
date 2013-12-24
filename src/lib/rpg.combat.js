/** @jsx React.DOM */
(function(window, undefined) {

    var combat = {};


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
                if (entity.isDead()) {
                    return <tr></tr>;
                }

                return (
                    <tr
                        onClick={self.handleClick.bind(self, entity)}
                        onMouseEnter={self.handleHover.bind(self, entity)}
                        onMouseLeave={self.handleHover.bind(self, null)}>
                        <td className="name">{entity.attr.name}</td>
                    </tr>
                )
            };
            return (
                <div className="enemy-wrap">
                <table className="entity-status">
                    {this.props.enemies.map(createItem)}
                </table>
                </div>
            );
        }
    });
    combat.EnemyMenu = EnemyMenu;


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
                    </tr><tr>
                        <td>Defend</td>
                    </tr><tr>
                        <td>Magic</td>
                    </tr><tr>
                        <td>Items</td>
                    </tr><tr>
                        <td>Run</td>
                    </tr>
                </table>
                </div>
            );
        }
    });
    combat.ActionMenu = ActionMenu;


    var BattleMenu = React.createClass({
        getInitialState: function() {
            return {
                msgIndex: 0,
            };
        },
        handleNextMsg: function() {
            var msgIndex = this.state.msgIndex + 1;
            if (msgIndex < this.props.messages.length) {
                this.setState({msgIndex: msgIndex});
            } else {
                this.props.onMsgsRead();
            }
        },
        render: function() {
            return (
                <div className="battle-result-wrap" onClick={this.handleNextMsg}>
                    {this.props.messages[this.state.msgIndex]}
                </div>
            );
        }
    });
    combat.BattleMenu = BattleMenu;

    var PartyMenu = React.createClass({
        render: function() {
            var selectedEntity = this.props.selected;
            var createItem = function(entity) {
                if (entity.isDead()) {
                    return <tr></tr>;
                }

                if (selectedEntity == entity) {
                    return (
                        <tr>
                            <td className="name selected">{entity.attr.name}</td>
                            <td className="hp">{entity.attr.hp}/{entity.attr.hpMax}</td>
                            <td className="mp">{entity.attr.mp}/{entity.attr.mpMax}</td>
                        </tr>
                    );
                } else {
                    return (
                        <tr>
                            <td className="name">{entity.attr.name}</td>
                            <td className="hp">{entity.attr.hp}/{entity.attr.hpMax}</td>
                            <td className="mp">{entity.attr.mp}/{entity.attr.mpMax}</td>
                        </tr>
                    );
                }
            };
            return (
                <div className="party-wrap">
                <table className="entity-status">
                    {this.props.party.map(createItem)}
                </table>
                </div>
            );
        }
    });
    combat.PartyMenu = PartyMenu;


    var MenuContext = {
        NO_ACTIONS: 0,
        SELECT_ACTION: 1,
        SELECT_ENEMY: 2,
        SHOW_RESULTS: 3
    };

    var App = React.createClass({
        getInitialState: function() {
            return {
                showActions: MenuContext.SELECT_ACTION,
                enemyTurn: 0,
                partyTurn: 0,
                messages: []
            };
        },
        componentDidMount: function() {
             this.props.partySprites[this.state.partyTurn].showHighlight();
        },
        handleMsgsRead: function() {
            this.props.onBattleFinished();
        },
        handleActionSelect: function(event) {
            this.setState({showActions: MenuContext.SELECT_ENEMY});
        },
        // TODO(richard-to): Clean up this method. Lot of loops and conditionals.
        handleEnemySelect: function(entity, event) {
            var self = this;
            var partyTurn = this.state.partyTurn;
            if (partyTurn < this.props.party.length) {
                this.setState({showActions: MenuContext.NO_ACTIONS});
                if (this.props.party[partyTurn].isDead()) {
                    this.setNextTurn();
                } else {
                    this.props.partySprites[this.state.partyTurn].hideHighlight();
                    var attackDamage = entity.takeDamage(this.props.party[partyTurn].attack());
                    this.props.partySprites[partyTurn].attackLeft(function() {
                        var enemies = self.props.enemies;
                        var enemyCount = enemies.length;
                        var deadCount = 0;
                        for (var i = 0; i < enemyCount; i++) {
                            self.props.enemySprites[i].hideHighlight();
                            if (enemies[i] == entity) {
                                self.props.enemySprites[i].showDamage(attackDamage);
                                if (self.props.enemies[i].isDead()) {
                                    self.props.enemySprites[i].faint();
                                }
                            }
                            if (self.props.enemies[i].isDead()) {
                                deadCount += 1;
                            }
                        }
                        if (deadCount == enemyCount) {
                            var expGained = 0;
                            var coinsEarned = 0;
                            for (var i = 0; i < enemyCount; i++) {
                                expGained += self.props.enemies[i].attr.exp;
                                coinsEarned += self.props.enemies[i].attr.coins;
                            }
                            self.setState({
                                messages: [
                                    "You gained " + expGained + " exp.",
                                    "You earned " + coinsEarned + " coins."
                                ],
                                showActions: MenuContext.SHOW_RESULTS
                            });
                        } else if (partyTurn < self.props.party.length) {
                            self.setNextTurn();
                        } else {
                            self.runEnemyAttackSequence();
                        }
                    });
                    this.setState({partyTurn: ++partyTurn});
                }
            }
        },
        setNextTurn: function() {
            var partyTurn = this.state.partyTurn;
            for(partyTurn; partyTurn < this.props.party.length; partyTurn++) {
                if (this.props.party[partyTurn].isDead() === false) {
                    this.props.partySprites[partyTurn].showHighlight();
                    this.setState({showActions: MenuContext.SELECT_ACTION});
                    break;
                }
            }
            if (partyTurn < this.props.party.length) {
                this.setState({partyTurn: partyTurn});
            } else {
                this.runEnemyAttackSequence();
            }
        },
        runEnemyAttackSequence: function() {
            var self = this;
            var enemyTurn = this.state.enemyTurn;
            if (enemyTurn < this.props.enemySprites.length) {
                if (this.props.enemies[enemyTurn].isDead()) {
                    this.setState({enemyTurn: ++enemyTurn});
                    this.runEnemyAttackSequence();
                } else {
                    var partyIdx = null;
                    while (partyIdx === null) {
                        partyIdx = Math.floor(Math.random() * this.props.party.length);
                        if (this.props.party[partyIdx].isDead()) {
                            partyIdx = null;
                        }
                    }

                    var attackDamage = this.props.party[partyIdx].takeDamage(
                        this.props.enemies[enemyTurn].attack());
                    this.props.enemySprites[enemyTurn].attackRight(function() {
                        for (var i = 0; i < self.props.party.length; i++) {
                            if (self.props.party[i] == self.props.party[partyIdx]) {
                                self.props.partySprites[i].showDamage(attackDamage);
                                if (self.props.party[i].isDead()) {
                                    self.props.partySprites[i].faint();
                                }
                            }
                        }
                        self.runEnemyAttackSequence();
                    });
                    this.setState({enemyTurn: ++enemyTurn});
                }
            } else {
                this.setState({enemyTurn: 0});
                this.setState({partyTurn: 0});
                this.props.partySprites[this.state.partyTurn].showHighlight();
                this.setState({showActions: MenuContext.SELECT_ACTION});
            }
        },
        handleEnemyHover: function(entity, event) {
            var enemies = this.props.enemies;
            var enemyCount = enemies.length;
            for (var i = 0; i < enemyCount; i++) {
                if (enemies[i] === entity) {
                    this.props.enemySprites[i].showHighlight();
                } else {
                    this.props.enemySprites[i].hideHighlight();
                }
            }
        },
        render: function() {
            if (this.state.showActions == MenuContext.SELECT_ACTION) {
                return (
                    <div className="combat-wrap">
                        <ActionMenu onActionSelect={this.handleActionSelect} />
                        <PartyMenu party={this.props.party} selected={this.props.party[this.state.partyTurn]} />
                    </div>
                );
            } else if (this.state.showActions == MenuContext.SELECT_ENEMY) {
                return (
                    <div className="combat-wrap">
                        <EnemyMenu
                            enemies={this.props.enemies}
                            onEnemySelect={this.handleEnemySelect}
                            onEnemyHover={this.handleEnemyHover} />
                        <PartyMenu party={this.props.party} selected={this.props.party[this.state.partyTurn]} />
                    </div>
                );
            } else if (this.state.showActions == MenuContext.SHOW_RESULTS) {
                    return (
                        <div className="combat-wrap">
                            <BattleMenu messages={this.state.messages} onMsgsRead={this.handleMsgsRead} />
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
    combat.App = App;

    if (window.rpg === undefined) {
        window.rpg = {};
    }
    window.rpg.combat = combat;
})(window);