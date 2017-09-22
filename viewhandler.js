var ViewHandler = {};

ViewHandler.GRID_SIZE = 30;
ViewHandler.DOT_RADIUS = 4;
ViewHandler.INIT_SIZE = 30;

ViewHandler.first_player = true;
ViewHandler.current_player = true;

ViewHandler.STYLE_LINE = "rgba(0, 0, 0, 1)";
ViewHandler.STYLE_BACKGROUND = "rgba(223, 255, 223, 1)";

ViewHandler.STYLE_PLAYER_1_1 = "rgba(0, 0, 0, 1)";
ViewHandler.STYLE_PLAYER_1_2 = "rgba(255, 0, 0, 1)";
ViewHandler.STYLE_PLAYER_1_3 = "rgba(255, 0, 0, 0)";

ViewHandler.STYLE_PLAYER_2_1 = "rgba(255, 255, 255, 1)";
ViewHandler.STYLE_PLAYER_2_2 = "rgba(0, 0, 255, 1)";
ViewHandler.STYLE_PLAYER_2_3 = "rgba(0, 0, 255, 0)";

ViewHandler.assemble_playfield = function() {
	ViewHandler.chess_x = [];
	ViewHandler.chess_y = [];
	ViewHandler.playfield = [];
	var x;
	var y;
	var line;
	for (x = 0; x < 15; x ++) {
		line = [];
		for (y = 0; y < 15; y ++) {
			line.push(0);
		}
		ViewHandler.playfield.push(line);
	}
	ViewHandler.current_player = ViewHandler.first_player;
	ViewHandler.first_player = !ViewHandler.first_player;
	
	ViewHandler.on_draw(ViewHandler.ctx);
	
	if (!ViewHandler.current_player) {
		ViewHandler.computer_move();
	}
}

ViewHandler.draw_background_dots = function(ctx, x, y) {
	var nx = ViewHandler.INIT_SIZE + (ViewHandler.GRID_SIZE * x);
	var ny = ViewHandler.INIT_SIZE + (ViewHandler.GRID_SIZE * y);
	
	ctx.fillStyle = ViewHandler.STYLE_LINE;
	ctx.beginPath();
	ctx.arc(nx, ny, ViewHandler.DOT_RADIUS, 0, 2 * Math.PI);
	ctx.fill();
}
ViewHandler.draw_chess = function(ctx, x, y, player) {
	var nx = ViewHandler.INIT_SIZE + (ViewHandler.GRID_SIZE * x);
	var ny = ViewHandler.INIT_SIZE + (ViewHandler.GRID_SIZE * y);
	var grd = ctx.createRadialGradient(nx, ny, 12, nx, ny, 16);;
	if (player) {
		grd.addColorStop(0, ViewHandler.STYLE_PLAYER_1_1);
		grd.addColorStop(0.5, ViewHandler.STYLE_PLAYER_1_2);
		grd.addColorStop(1, ViewHandler.STYLE_PLAYER_1_3);
	}
	else {
		grd.addColorStop(0, ViewHandler.STYLE_PLAYER_2_1);
		grd.addColorStop(0.5, ViewHandler.STYLE_PLAYER_2_2);
		grd.addColorStop(1, ViewHandler.STYLE_PLAYER_2_3);
	}
	
	ctx.fillStyle = grd;
	ctx.beginPath();
	ctx.arc(nx, ny, 15, 0, 2 * Math.PI);
	ctx.fill();
}

ViewHandler.on_draw = function(ctx) {
	// Fill Background.
	ctx.fillStyle = ViewHandler.STYLE_BACKGROUND;
	ctx.fillRect(0, 0, ViewHandler.canvas.width, ViewHandler.canvas.height);
	
	// Draw Lines.
	var i;
	var x;
	var y = ViewHandler.INIT_SIZE + (ViewHandler.GRID_SIZE * 14);
	for (i = 0; i < 15; i ++) {
		x = ViewHandler.INIT_SIZE + (ViewHandler.GRID_SIZE * i);
		ctx.strokeStyle = ViewHandler.STYLE_LINE;
		ctx.lineWidth = 1;
		ctx.beginPath();
		ctx.moveTo(ViewHandler.INIT_SIZE, x);
		ctx.lineTo(y, x);
		ctx.stroke();
		ctx.beginPath();
		ctx.moveTo(x, ViewHandler.INIT_SIZE);
		ctx.lineTo(x, y);
		ctx.stroke();
	}
	
	// Draw dots.
	ViewHandler.draw_background_dots(ctx, 3, 3);
	ViewHandler.draw_background_dots(ctx, 3, 11);
	ViewHandler.draw_background_dots(ctx, 11, 3);
	ViewHandler.draw_background_dots(ctx, 11, 11);
	ViewHandler.draw_background_dots(ctx, 7, 7);
	
	// Draw chess.
	for (i = 0; i < ViewHandler.chess_x.length; i ++) {
		ViewHandler.draw_chess(ctx, ViewHandler.chess_x[i], ViewHandler.chess_y[i], (i % 2 == 0));
	}
};

ViewHandler.array_equals = function(array) {
	if (array.length < 2) {
		return true;
	}
	var i;
	for (i = 1; i < array.length; i ++) {
		if (array[i] != array[0]) {
			return false;
		}
	}
	return true;
} 

ViewHandler.check_winner = function() {
	var pf = ViewHandler.playfield;
	var x;
	var y;
	for (x = 0; x < 15; x ++) {
		for (y = 0; y < 11; y ++) {
			if (ViewHandler.array_equals([pf[x][y], pf[x][y + 1], pf[x][y + 2], pf[x][y + 3], pf[x][y + 4]])) {
				if (pf[x][y] != 0) {
					return pf[x][y];
				}
			} 
		}
	}
	for (x = 0; x < 11; x ++) {
		for (y = 0; y < 15; y ++) {
			if (ViewHandler.array_equals([pf[x][y], pf[x + 1][y], pf[x + 2][y], pf[x + 3][y], pf[x + 4][y]])) {
				if (pf[x][y] != 0) {
					return pf[x][y];
				}
			} 
		}
	}
	for (x = 2; x < 13; x ++) {
		for (y = 2; y < 13; y ++) {
			if (ViewHandler.array_equals([pf[x - 2][y - 2], pf[x - 1][y - 1], pf[x][y], pf[x + 1][y + 1], pf[x + 2][y + 2]])) {
				if (pf[x][y] != 0) {
					return pf[x][y];
				}
			} 
			if (ViewHandler.array_equals([pf[x + 2][y - 2], pf[x + 1][y - 1], pf[x][y], pf[x - 1][y + 1], pf[x - 2][y + 2]])) {
				if (pf[x][y] != 0) {
					return pf[x][y];
				}
			} 
		}
	}
	return 0;
}

ViewHandler.player_move = function(x, y) {
	if (ViewHandler.add_chess(x, y)) {
		var winner;
		ViewHandler.current_player = false;
		
		var winner = ViewHandler.check_winner();
		if (winner != 0) {
			return ViewHandler.win(winner);
		}
		setTimeout(ViewHandler.computer_move, 100);
	}
	else {
		console.log("invalid move");
	}
}

ViewHandler.computer_move = function() {
	var suggestion = Brain.main(ViewHandler.chess_x, ViewHandler.chess_y);
	var x = suggestion[0];
	var y = suggestion[1];
	if (ViewHandler.add_chess(x, y)) {
		var winner = ViewHandler.check_winner();
		if (winner != 0) {
			return ViewHandler.win(winner);
		}
		ViewHandler.current_player = true;
	}
	else {
		console.log("BUG: invalid move: [" + x + ", " + y + "]");
	}
}

ViewHandler.add_chess = function(x, y) {
	x = Math.round(x);
	y = Math.round(y);
	if ((x < 0) || (x > 14) || (y < 0) || (y > 14)) {
		return false;
	}
	if (ViewHandler.playfield[x][y] != 0) {
		return false;
	}
	if (ViewHandler.chess_x.length % 2 == 0) {
		ViewHandler.playfield[x][y] = 1;
	}
	else {
		ViewHandler.playfield[x][y] = -1;
	}
	ViewHandler.chess_x.push(x);
	ViewHandler.chess_y.push(y);
	
	// Draw Satuation.
	ViewHandler.on_draw(ViewHandler.ctx);
	
	return true;
}

ViewHandler.win = function(player) {
	if (player == 1) {
		setTimeout(ViewHandler.win_1, 100);
	}
	else {
		setTimeout(ViewHandler.win_2, 100);
	}
}
ViewHandler.win_1 = function() {
	alert("dark player wins");
	ViewHandler.assemble_playfield();
}
ViewHandler.win_2 = function() {
	alert("light player wins");
	ViewHandler.assemble_playfield();
}

ViewHandler.mouse_event = function(key, mx, my) {
	if (key == 0) {
		if (ViewHandler.current_player) {
			var x = Math.round((mx - ViewHandler.INIT_SIZE) / ViewHandler.GRID_SIZE);
			var y = Math.round((my - ViewHandler.INIT_SIZE) / ViewHandler.GRID_SIZE);
			/*
			if (x < 0) {
				x = 0;
			}
			if (x > 14) {
				x = 14;
			}
			if (y < 0) {
				y = 0;
			}
			if (y > 14) {
				y = 14;
			}
			*/
			ViewHandler.player_move(x, y);
		}
		else {
		}
	}
	if (key != 0) {
		if (ViewHandler.current_player) {
			var x = Math.round((mx - ViewHandler.INIT_SIZE) / ViewHandler.GRID_SIZE);
			var y = Math.round((my - ViewHandler.INIT_SIZE) / ViewHandler.GRID_SIZE);
			Brain.main(ViewHandler.chess_x, ViewHandler.chess_y);
			Brain.predictive_suggestion(x, y);
		}
		else {
		}
	}
};

ViewHandler.main_loop = function() {
	while (true) {
		ViewHandler.assemble_playfield();
		
		
	}
	
}