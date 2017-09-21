var Brain = {};
Brain.attack_weight_table = [1024, 1024, 256, 16, 4, 1];
Brain.defend_weight_table = [1024, 256, 64, 16, 8, 4];
Brain.attack_ratio = 0.5;
Brain.defend_ratio = 0.5;

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

Brain.calculate_accurate_weight = function(ratioA, ratioD) {
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
			}
		}
	}
	for (i = 0; i < nodes.length; i ++) {
		node = nodes[i];
		node.raw_weight = (node.get_raw_weight(Brain.playerS, Brain.attack_weight_table) * ratioA) + (node.get_raw_weight(Brain.playerE, Brain.defend_weight_table) * ratioD);
	}
	for (i = 0; i < nodes.length; i ++) {
		node = nodes[i];
		node.player = Brain.playerS;
		sum_sub_weight = 0;
		for (j = 0; j < nodes.length; j ++) {
			if (i != j) {
				node_sub = nodes[j];
				node_sub.sub_weight = (node_sub.get_raw_weight(Brain.playerS, Brain.attack_weight_table) * ratioA) + (node_sub.get_raw_weight(Brain.playerE, Brain.defend_weight_table) * ratioD);
				sum_sub_weight = sum_sub_weight + node_sub.sub_weight;
			}
		}
		node.player = Brain.playerN;
		for (j = 0; j < nodes.length; j ++) {
			if (i != j) {
				node_sub = nodes[j];
				node_sub.prob = node_sub.sub_weight / sum_sub_weight;
			}
		}
		neg_weight = 0;
		for (j = 0; j < nodes.length; j ++) {
			if (i != j) {
				node_sub = nodes[j];
				neg_weight = neg_weight + (node_sub.prob * node_sub.raw_weight);
			}
		}
		node.acc_weight = node.raw_weight - neg_weight;
	}
}

Brain.fetch_accurate_nodes = function() {
	var max = 0;
	var nodes = [];
	var x;
	var y;
	var node;
	
	for (x = 0; x < 15; x ++) {
		for (y = 0; y < 15; y ++) {
			node = Brain.field[x][y];
			if (node.player == Brain.playerN) {
				if (node.acc_weight > max) {
					nodes = [];
					max = node.acc_weight;
				}
				if (node.acc_weight == max) {
					nodes.push(node);
				}
			}
		}
	}
	
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
	Brain.calculate_accurate_weight(Brain.attack_ratio, Brain.defend_ratio);
	var nodes = Brain.fetch_accurate_nodes();
	var index = Math.floor(Math.random() * nodes.length);
	var node = nodes[index];
	return [node.x, node.y];
}