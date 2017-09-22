var Brain = {};

/****************************************************
 *
 *    Brain.attack_weight_table - 进攻权值表 分别代表一行里有[5, 4, 3, 2, 1, 0]个我方棋子并没有敌方棋子时 落子在这一行提供的价值
 *    Brain.defend_weight_table - 防御权值表 分别代表一行里有[5, 4, 3, 2, 1, 0]个敌方棋子并没有我方棋子时 落子在这一行提供的价值 在同等条件下通常比进攻权值低
 *    Brain.attack_ratio - 优先考虑进攻的比率 AI看到进攻优先值较高的点时忽略防御的比率
 *    Brain.defend_ratio - 优先考虑防御的比率 AI看到防御优先值较高的点时忽略进攻的比率
 *    Brain.negative_power_1 反向思考时的自信程度 值越高越认为人类玩家会同自己思考方式相同
 *    Brain.negative_power_2 反向思考时的影响程度 值越高反向思考越不准确 但造成的影响会增加
 *
 ***************************************************/

/*
// Naive Defence 天真防御 - 极度偏防御的策略 - 评分: 2
Brain.attack_weight_table = [100000, 128, 64, 16, 4, 1];
Brain.defend_weight_table = [100000, 128, 64, 32, 16, 4];
Brain.attack_ratio = 0;
Brain.defend_ratio = 0;
Brain.negative_power_1 = 1;
Brain.negative_power_2 = 1;
*/

/*
// Defender 防御者 - 稍微偏防御的策略 - 评分: 3
Brain.attack_weight_table = [100000, 4096, 2048, 128, 8, 1];
Brain.defend_weight_table = [100000, 2048, 1024, 512, 64, 1];
Brain.attack_ratio = 3;
Brain.defend_ratio = 4;
Brain.negative_power_1 = 5;
Brain.negative_power_2 = 5;
*/

/*
// Sniper 突击者 - 积累优势连续进攻 - 评分: 3
Brain.attack_weight_table = [100000, 4096, 2048, 256, 8, 1];
Brain.defend_weight_table = [100000, 2048, 1024, 512, 64, 1];
Brain.attack_ratio = 4;
Brain.defend_ratio = 4;
Brain.negative_power_1 = 4;
Brain.negative_power_2 = 4;
*/


// Rusher 快攻者 - 主动创造进攻机会 - 评分: 3
Brain.attack_weight_table = [100000, 4096, 2048, 512, 16, 1];
Brain.defend_weight_table = [100000, 2048, 1024, 256, 64, 1];
Brain.attack_ratio = 4;
Brain.defend_ratio = 4;
Brain.negative_power_1 = 3;
Brain.negative_power_2 = 3;


/*
// Mad Barserker 狂战士 - 尝试一切办法进攻 - 评分: 1
Brain.attack_weight_table = [100000, 64, 32, 16, 4, 1];
Brain.defend_weight_table = [100000, 32, 16, 8, 4, 1];
Brain.attack_ratio = 0;
Brain.defend_ratio = 0;
Brain.negative_power_1 = 1;
Brain.negative_power_2 = 1;
*/

Brain.Winable = function(x_list, y_list) {
	this.x_list = x_list;
	this.y_list = y_list;
	/*
	this.player_1_cached = false;
	this.player_2_cached = false;
	this.player_1_cache = 0;
	this.player_2_cache = 0;
	*/
	
	this.make_nodes = function() {
		this.nodes = [];
		var node;
		var i;
		for (i = 0; i < x_list.length; i ++) {
			node = Brain.field[x_list[i]][y_list[i]];
			node.winables.push(this);
			this.nodes.push(node);
		}
	}
	this.player_missing = function(player) {
		
		/*
		// check cache.
		if ((player == 1) && (this.player_1_cached)) {
			return this.player_1_cache;
		}
		if ((player != 1) && (this.player_2_cached)) {
			return this.player_2_cache;
		}
		*/
		
		var node_index = 0;
		var node;
		var missing = 5;
		for (node_index in this.nodes) {
			node = this.nodes[node_index];
			if (node.player == player) {
				// get one more chess in this winable.
				missing = missing - 1;
			}
			else {
				if (node.player != 0) {
					// impossible to finish this winable.
					/*
					if (player == 1) {
						this.player_1_cached = true;
						this.player_1_cache = -1;
					}
					else {
						this.player_2_cached = true;
						this.player_2_cache = -1;
					}
					*/
					return -1;
				}
			}
		}
		/*
		if (player == 1) {
			this.player_1_cached = true;
			this.player_1_cache = missing;
		}
		else {
			this.player_2_cached = true;
			this.player_2_cache = missing;
		}
		*/
		return missing;
	}
	this.fetch_nodes = function(player) {
		var node_index = 0;
		var node;
		var nodes = [];
		for (node_index in this.nodes) {
			node = this.nodes[node_index];

			if (node.player == player) {
				nodes.push(node);
			}
		}
		return nodes;
	}
	
	this.make_nodes();
}

Brain.Node = function(x, y) {
	this.x = x;
	this.y = y;
	this.winables = [];
	this.player = 0;
	
	this.get_raw_weight = function(player, weight_table) {
		if (this.player != 0) {
			return 0;
		}
		var w = 0;
		var i;
		var winable;
		var missing;
		for (i = 0; i < this.winables.length; i ++) {
			winable = this.winables[i];
			missing = winable.player_missing(player);
			if (missing >= 0) {
				w = w + weight_table[missing];
			}
		}
		return w;
	}
	this.get_accurate_weight = function(player, weight_table) {
		if (this.player != 0) {
			return 0;
		}
		var j;
		var node_sub;
		this.player = player;
		var sum_sub_prob = 0;
		
		for (j = 0; j < Brain.empty_nodes.length; j ++) {
			if (Brain.empty_nodes[j] != this) {
				node_sub = Brain.empty_nodes[j];
				node_sub.sub_weight = node_sub.get_raw_weight(player, weight_table);
				sum_sub_prob = sum_sub_prob + (Math.pow(node_sub.sub_weight, Brain.negative_power_1));
			}
		}
		this.player = Brain.playerN;
		for (j = 0; j < Brain.empty_nodes.length; j ++) {
			if (Brain.empty_nodes[j] != this) {
				node_sub = Brain.empty_nodes[j];
				node_sub.prob = (Math.pow(Math.pow(node_sub.sub_weight, Brain.negative_power_1), Brain.negative_power_2)) / (Math.pow(sum_sub_prob, Brain.negative_power_2));
			}
		}
		this.neg_weight = 0;
		for (j = 0; j < Brain.empty_nodes.length; j ++) {
			if (Brain.empty_nodes[j] != this) {
				node_sub = Brain.empty_nodes[j];
				this.neg_weight = this.neg_weight + (node_sub.prob * node_sub.sub_weight);
			}
		}
		return this.raw_weight - this.neg_weight;
	}
}

Brain.fetch_winables = function(player, missing) {
	var winables = [];
	for (i = 0; i < Brain.winables.length; i ++) {
		winable = Brain.winables[i];
		if (winable.player_missing(player) == missing) {
			winables.push(winable);
		}
	}
	return winables;
}
Brain.max_winable_number = function(player) {
	var i;
	var c;
	var m = 6;
	var winable;
	for (i = 0; i < Brain.winables.length; i ++) {
		winable = Brain.winables[i];
		c = winable.player_missing(player);
		if ((c >= 0) && (c < m)) {
			m = c;
		}
	}
	return m;
}

Brain.assemble_field = function() {
	// Initialize.
	Brain.field = [];
	Brain.empty_nodes = [];
	var x;
	var y;
	var line;
	for (x = 0; x < 15; x ++) {
		line = [];
		for (y = 0; y < 15; y ++) {
			line.push(new Brain.Node(x, y));
		}
		Brain.field.push(line);
	}
	
	// Put down chess.
	var i;
	for (i = 0; i < Brain.x_list.length; i ++) {
		Brain.field[Brain.x_list[i]][Brain.y_list[i]].player = 1 - ((i % 2) * 2);
	}
	for (x = 0; x < 15; x ++) {
		for (y = 0; y < 15; y ++) {
			if (Brain.field[x][y].player == 0) {
				Brain.empty_nodes.push(Brain.field[x][y]);
			}
		}
	}
	
	// Make winables.
	Brain.winables = [];
	for (x = 0; x < 15; x ++) {
		for (y = 2; y < 13; y ++) {
			Brain.winables.push(new Brain.Winable([x, x, x, x, x], [y - 2, y - 1, y, y + 1, y + 2]));
		}
	}
	for (x = 2; x < 13; x ++) {
		for (y = 0; y < 15; y ++) {
			Brain.winables.push(new Brain.Winable([x - 2, x - 1, x, x + 1, x + 2], [y, y, y, y, y]));
		}
	}
	for (x = 2; x < 13; x ++) {
		for (y = 2; y < 13; y ++) {
			Brain.winables.push(new Brain.Winable([x - 2, x - 1, x, x + 1, x + 2], [y - 2, y - 1, y, y + 1, y + 2]));
			Brain.winables.push(new Brain.Winable([x + 2, x + 1, x, x - 1, x - 2], [y - 2, y - 1, y, y + 1, y + 2]));
		}
	}
}

Brain.calculate_accurate_weight = function() {
	var x;
	var y;
	var i;
	var j;
	var node;
	var node_sub;
	var nodes = [];
	var sum_sub_weight;
	var neg_weight;
		
	for (x = 0; x < 15; x ++) {
		for (y = 0; y < 15; y ++) {
			node = Brain.field[x][y];
			if (node.player == Brain.playerN) {
				nodes.push(node);
				node.acc_weight = 0;
			}
		}
	}
	for (i = 0; i < nodes.length; i ++) {
		node = nodes[i];
		node.AR = node.get_raw_weight(Brain.playerS, Brain.attack_weight_table);
		node.raw_weight = 0.01 + node.AR;
	}
	for (i = 0; i < nodes.length; i ++) {
		node = nodes[i];
		node.AA = node.get_accurate_weight(Brain.playerS, Brain.attack_weight_table);
		node.acc_weight = node.acc_weight + node.AA;
	}
	for (i = 0; i < nodes.length; i ++) {
		node = nodes[i];
		node.DR = node.get_raw_weight(Brain.playerE, Brain.defend_weight_table);
		node.raw_weight = 0.01 + node.DR;
	}
	for (i = 0; i < nodes.length; i ++) {
		node = nodes[i];
		node.DA = node.get_accurate_weight(Brain.playerE, Brain.defend_weight_table);
		node.acc_weight = node.acc_weight + node.DA;
	}
}

Brain.predictive_suggestion = function(tx, ty) {
	var x;
	var y;
	var i;
	var j;
	var node;
	var node_sub;
	var nodes = [];
	var sum_sub_weight;
	var neg_weight;
	var ratioA = Brain.attack_ratio;
	var ratioD = Brain.defend_ratio;

	for (x = 0; x < 15; x ++) {
		for (y = 0; y < 15; y ++) {
			node = Brain.field[x][y];
			if (node.player == Brain.playerN) {
				nodes.push(node);
				node.acc_weight = 0;
			}
		}
	}
	for (i = 0; i < nodes.length; i ++) {
		node = Brain.field[tx][ty];
		node.AR = node.get_raw_weight(Brain.playerE, Brain.attack_weight_table);
		node.raw_weight = 0.01 + node.AR;
	}
	node = Brain.field[tx][ty];
	node.AA = node.get_accurate_weight(Brain.playerE, Brain.attack_weight_table);
	node.acc_weight = node.acc_weight + node.AA;
	
	for (i = 0; i < nodes.length; i ++) {
		node = nodes[i];
		node.DR = node.get_raw_weight(Brain.playerS, Brain.defend_weight_table);
		node.raw_weight = 0.01 + node.DR;
	}
	node = Brain.field[tx][ty];
	node.DA = node.get_accurate_weight(Brain.playerS, Brain.defend_weight_table);
	node.acc_weight = node.acc_weight + node.DA;
	
	console.log("[" + node.x + ", " + node.y + "]");
	console.log("Atk raw:" + node.AR);
	console.log("Atk neg:" + (node.AR - node.AA));
	console.log("Atk acc:" + node.AA);
	console.log("Def raw:" + node.DR);
	console.log("Def neg:" + (node.DR - node.DA));
	console.log("Def acc:" + node.DA);
	console.log("Wit sum:" + node.acc_weight);
	
	console.log("----------");
}

Brain.fetch_accurate_nodes = function(ratioA, ratioD) {
	var max = 0;
	var nodes;
	var x;
	var y;
	var node;
	
	var AA;
	var AD;
	var DD;
	
	for (x = 0; x < 15; x ++) {
		for (y = 0; y < 15; y ++) {
			node = Brain.field[x][y];
			if (node.player == Brain.playerN) {
				AA = node.AA * ratioA;
				AD = node.AA + node.DA;
				DD = node.DA * ratioD;
				if (AA > AD) {
					AD = AA;
				}
				if (DD > AD) {
					AD = DD;
				}
				if ((AD > max) || (!nodes)) {
					nodes = [];
					max = AD;
				}
				if (AD == max) {
					nodes.push(node);
				}
			}
		}
	}
	/*
	console.log("[" + nodes[0].x + ", " + nodes[0].y + "]");
	console.log("Atk raw:" + nodes[0].AR);
	console.log("Atk neg:" + (nodes[0].AR - nodes[0].AA));
	console.log("Atk acc:" + nodes[0].AA);
	console.log("Def raw:" + nodes[0].DR);
	console.log("Wit sum:" + nodes[0].acc_weight);
	console.log("----------");
	*/
	return nodes;
}

// return [x, y];
Brain.main = function(x_list, y_list) {
	Brain.x_list = x_list;
	Brain.y_list = y_list;
	
	// First to play.
	if (x_list.length == 0) {
		return [7, 7];
	}
	
	Brain.playerN = 0;
	if (x_list.length % 2 == 0) {
		Brain.playerS = 1;
		Brain.playerE = -1;
	}
	else {
		Brain.playerS = -1;
		Brain.playerE = 1;
	}
	Brain.assemble_field();
	
	var miswinS = Brain.max_winable_number(Brain.playerS);
	var miswinE = Brain.max_winable_number(Brain.playerE);
	
	// 自己有活4或冲4.
	if (miswinS == 1) {
		return Brain.almost_win();
	}
	
	// 对方有活4或冲4.
	if (miswinE == 1) {
		return Brain.almost_lose();
	}
	
	return Brain.weighted_answer();
};

Brain.almost_win = function() {
	var winables = Brain.fetch_winables(Brain.playerS, 1);
	var node = winables[0].fetch_nodes(Brain.playerN)[0];
	return [node.x, node.y];
}
Brain.almost_lose = function() {
	var winables = Brain.fetch_winables(Brain.playerE, 1);
	var node = winables[0].fetch_nodes(Brain.playerN)[0];
	return [node.x, node.y];
}
Brain.weighted_answer = function() {
	Brain.calculate_accurate_weight();
	var nodes = Brain.fetch_accurate_nodes(Brain.attack_ratio, Brain.defend_ratio);
	var index = Math.floor(Math.random() * nodes.length);
	var node = nodes[index];
	return [node.x, node.y];
}