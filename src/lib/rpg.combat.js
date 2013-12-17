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


    var PartyMenu = React.createClass({
        render: function() {
            var selectedEntity = this.props.selected;
            var createItem = function(entity) {
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
        SELECT_ENEMY: 2
    };

    var App = React.createClass({
        getInitialState: function() {
            return {showActions: MenuContext.SELECT_ACTION, enemyTurn: 0, partyTurn: 0};
        },
        componentDidMount: function() {
             this.props.partySprites[this.state.partyTurn].showHighlight();
        },
        handleActionSelect: function(event) {
            this.setState({showActions: MenuContext.SELECT_ENEMY});
        },
        handleEnemySelect: function(entity, event) {
            var self = this;
            var partyTurn = this.state.partyTurn;
            if (partyTurn < this.props.party.length) {
                entity.takeDamage(this.props.party[partyTurn].attack());
                this.setState({showActions: MenuContext.NO_ACTIONS});
                this.props.partySprites[this.state.partyTurn].hideHighlight();
                var attackValue = self.props.party[partyTurn].attr.attack;
                this.props.partySprites[partyTurn].attackLeft(function() {

                    var enemies = self.props.enemies;
                    var enemyCount = enemies.length;
                    for (var i = 0; i < enemyCount; i++) {
                        self.props.enemySprites[i].hideHighlight();
                        if (enemies[i] == entity) {
                            self.props.enemySprites[i].damageSprite.damage = attackValue;
                            self.props.enemySprites[i].damageSprite.disabled = false;
                        }
                    }

                    if (partyTurn < self.props.party.length) {
                        self.props.partySprites[self.state.partyTurn].showHighlight();
                        self.setState({showActions: MenuContext.SELECT_ACTION});
                    } else {
                        self.runEnemyAttackSequence();
                    }
                });
                this.setState({partyTurn: ++partyTurn});
            }
        },
        runEnemyAttackSequence: function() {
            var self = this;
            var enemyTurn = this.state.enemyTurn;
            if (enemyTurn < this.props.enemySprites.length) {
                this.props.party[0].takeDamage(this.props.enemies[enemyTurn].attack());
                var attackValue = this.props.enemies[enemyTurn].attack();
                this.props.enemySprites[enemyTurn].attackRight(function() {
                    for (var i = 0; i < self.props.party.length; i++) {
                        if (self.props.party[i] == self.props.party[0]) {
                            self.props.partySprites[i].damageSprite.damage = attackValue;
                            self.props.partySprites[i].damageSprite.disabled = false;
                        }
                    }
                    self.runEnemyAttackSequence();
                });
                this.setState({enemyTurn: ++enemyTurn});
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