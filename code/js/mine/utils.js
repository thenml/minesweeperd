// function parseMinesweeperString(minesweeperString) {
// 	const rows = minesweeperString.split('/'); // Split the string into rows
// 	rows.pop(); // Remove the last empty row

// 	let minX = rows.length;
// 	let minY = rows[0].length;
// 	let maxX = 0;
// 	let maxY = 0;
// 	for (let y = 0; y < rows.length; y++) {
// 		for (let x = 0; x < rows[y].length; x++) {
// 			let c = rows[y][x];
// 			const tile = { state: 1 };

// 			if (!grid[y])	grid[y] = {};

// 			if ("sabcdefg".includes(c)) {
// 				if (minX > x) minX = x;
// 				if (minY > y) minY = y;
// 				if (maxX < x) maxX = x;
// 				if (maxY < y) maxY = y;
// 				c = "sabcdefg".indexOf(c);
// 				tile.state = 0;
// 			}
// 			if (parseInt(c) >= 0)
// 				tile.data = parseInt(c)
// 			else
// 				switch (c) {
// 					case "*": tile.data = "mine"; break;
// 					case "q": tile.data = "q"; break;
// 					case "-": tile.data = "wall"; break;
// 					default: break;
// 				}
// 			placeTile(x, y, tile);
// 		}
// 	}
// }