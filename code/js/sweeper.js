const camera = document.getElementById('container');
const debug_info = document.getElementById('debug-info');

let userConfig = {
	selectedTileset: 'generic_colored', // todo: combine tileset into one generated file
	holdDelay: 150,
	openDelay: 60,
	showBackTiles: false,
	invisibleZero: true,
	animSpeed: 1.0,
}

function tileTexture(tile) {
	return `/assets/mine/tiles/${userConfig.selectedTileset}/${tile}`;
}

let tileSize = 16;

const app = new PIXI.Application({
	resize: camera,
	antialias: false,
	backgroundColor: 0x333333,
});
PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;
camera.appendChild(app.view);

const backgroundTiles = new PIXI.TilingSprite(
	PIXI.Texture.from(tileTexture("tile.png")),
	camera.offsetWidth,
	camera.offsetHeight,
)
app.stage.addChild(backgroundTiles);
backgroundTiles.visible = userConfig.showBackTiles;

const tilesContainer = new PIXI.Container();
app.stage.addChild(tilesContainer);
const animationContainer = new PIXI.Container();
app.stage.addChild(animationContainer);

app.interactiveChildren = false;

let grid = {};

let cameraX;
let cameraY;
const prevPosition = {};

// Function to place a tile at a specific position in the grid
function placeTile(x, y, options, placeOptions) {
	x = `${x}`;
	y = `${y}`;
	if (!grid[y]) grid[y] = {};
	if (placeOptions?.animation) {
		if (grid[y][x]?.state != options?.state)
			startAnimation(placeOptions.animation);
	}
	grid[y][x] = {
		x: parseInt(x),
		y: parseInt(y),
		state: 0, // 0 - open | 1 - closed | 2 - flagged | 3 - exploded
		data: undefined, // undefined - generate (todo) | 0-9 | mine | q | wall
		...options
	};
}

function drawTile(tile, tileSprite) {
	if (!tile) return;
	const sprite = tile.state === 0 ? tile.data : ["space", "flag", "mine"][tile.state - 1];
	if (userConfig.invisibleZero && sprite === 0) return;
	if (!tileSprite) {
		tileSprite = PIXI.Sprite.from(tileTexture(`${sprite}.png`));
		tilesContainer.addChild(tileSprite);
	}
	tileSprite.width = tileSize;
	tileSprite.height = tileSize;
	tileSprite.x = tile.x * tileSize - cameraX;
	tileSprite.y = tile.y * tileSize - cameraY;
}

function getTileAt(x, y) { return (grid[`${y}`] ?? {})[`${x}`]; }
function getScreenPos(x, y, centered) { return {screenX: (x + (centered ? 0.5 : 0)) * tileSize - cameraX, screenY: (y + (centered ? 0.5 : 0)) * tileSize - cameraY} }

placeTile(0, 0, { data: 1 });

// Function to update the visible tiles based on the camera apositionaa
function updateVisibleTiles() {
	const minX = Math.floor(cameraX / tileSize);
	const minY = Math.floor(cameraY / tileSize);
	const maxX = Math.ceil((cameraX + camera.offsetWidth) / tileSize);
	const maxY = Math.ceil((cameraY + camera.offsetHeight) / tileSize);
	tilesContainer.removeChildren();
	for (const keyY in grid) {
		const y = parseInt(keyY);

		if (y >= minY && y <= maxY)
			if (typeof grid[keyY] === 'object')
				for (const keyX in grid[keyY]) {
					const x = parseInt(keyX);
					if (x >= minX && x <= maxX)
						drawTile(grid[keyY][keyX]);
				}
	}

	// animationContainer?.children?.forEach( el => {
	// 	if (prevPosition.tileSize != tileSize) {
	// 		el.width = tileSize;
	// 		el.height = tileSize;
	// 		el.x *= tileSize / prevPosition.tileSize;
	// 		el.y *= tileSize / prevPosition.tileSize;
	// 	}
	// });

	animationContainer.scale.set(tileSize / 16);
	animationContainer.x = -cameraX;
	animationContainer.y = -cameraY;

	backgroundTiles.tileScale.set(tileSize / 16);
	backgroundTiles.tilePosition.x = -cameraX;
	backgroundTiles.tilePosition.y = -cameraY;


	prevPosition.x = cameraX;
	prevPosition.y = cameraY;
	prevPosition.w = camera.offsetWidth;
	prevPosition.h = camera.offsetHeight;
	prevPosition.tileSize = tileSize;
}

// Handle window resize
window.addEventListener('resize', () => {
	app.renderer.resize(window.innerWidth, window.innerHeight);
	backgroundTiles.width = window.innerWidth;
	backgroundTiles.height = window.innerHeight;
	updateVisibleTiles();
});

function parseMinesweeperString(minesweeperString) {
	const rows = minesweeperString.split('/'); // Split the string into rows
	rows.pop(); // Remove the last empty row

	let firstTiles = [];
	let minX = rows.length;
	let minY = rows[0].length;
	let maxX = 0;
	let maxY = 0;
	for (let y = 0; y < rows.length; y++) {
		for (let x = 0; x < rows[y].length; x++) {
			let c = rows[y][x];
			const tile = { state: 1 };

			if (!grid[y]) grid[y] = {};

			if ("sabcdefg".includes(c)) {
				if (minX > x) minX = x;
				if (minY > y) minY = y;
				if (maxX < x) maxX = x;
				if (maxY < y) maxY = y;
				c = "sabcdefg".indexOf(c);
				tile.state = 0;
				firstTiles.push({x, y});
			}
			if (parseInt(c) >= 0)
				tile.data = parseInt(c)
			else
				switch (c) {
					case "*": tile.data = "mine"; break;
					case "q": tile.data = "q"; break;
					case "-": tile.data = "wall"; break;
					default: break;
				}
			placeTile(x, y, tile);
		}
	}

	cameraX = Math.floor((maxX + minX) / 2) * tileSize - camera.offsetWidth / 2;
	cameraY = Math.floor((maxY + minY) / 2) * tileSize - camera.offsetHeight / 2;

	const startX = Math.floor((minX + maxX) / 2);
	const startY = Math.floor((minY + maxY) / 2);
	firstTiles.forEach(tile => {
		const delay = (Math.abs(tile.x - startX) + Math.abs(tile.y - startY) -1) * userConfig.openDelay;
		startAnimation({ x: tile.x, y: tile.y, name: "opentile", sprite: "space.png", delay });
	});
}

function resetBoard() {
	grid = {};
	tilesContainer.removeChildren();
	animationContainer.removeChildren();
}

function genBasicBoard() {
	resetBoard();
	const w = parseInt(document.getElementById('inp-width').value) || 20;
	const h = parseInt(document.getElementById('inp-height').value) || 20;
	const n = Math.floor(((w + h) / 2) ** 1.5);
	const url = `https://api.nmll.site/v1/minesweeper/generate?w=${w}&h=${h}&n=${n}`;
	fetch(url)
		.then(response => response.json())
		.then(json => {
			parseMinesweeperString(json.sweeper);
			updateVisibleTiles();
			// navigator.clipboard.writeText(json.sweeper);
		})
}
function genDailyBoard() {
	resetBoard();
	const url = `https://api.nmll.site/v1/minesweeper/daily`;
	fetch(url)
		.then(response => response.json())
		.then(json => {
			board = parseMinesweeperString(json.sweeper);
			updateVisibleTiles();
			// navigator.clipboard.writeText(json.sweeper);
		})
}

function genTempBoard() {
	resetBoard();
	parseMinesweeperString(
		"**112*100111000001*12*201*1000000002***1001*10001*/3311*32101*1011112212*20111011101112*4210011100122/*10112*1134311*11*10111000001*101*11110111000001*1/221001111***3322332000000000111022200002*201110122/2*3111101244**11**100000000000001*222213*201*1001*/2**11*11111*43212321000000001110223**3*21102220011/23212221*1112*1112*1000000001*101*34*3110001*10000/*1002*2111112111*32211122100111123*211000001111110/11002*20012*10013*21*11**3101111*32100000000002*20/0000122101*321223*211113**212*112*1000000000002*20/111012*1123*22**32200001222*2110111000000111001221/1*101*211*433*322*211011101111110122223211*22211*1/1221111012**3220113*201*211013*312**2***1113**1111/02*2000112222*10002*20112*101**3*22223431002*31000/03*30001*10122100011100022201222110112*21102221110/02*311012211*100112110012*1011100001*322*101*11*10/0123*2111*2222212*3*3101*2101*2100012*111101111110/112*32*112*11*2*224**101110023*1000011100000000000/*12*21110122323111*3321001111*21011100000000000000/22111000001*2*2111222*1001*1111001*211000122100000/*11110111012322*112*2110011101110112*10001**100011/111*113*2001*11111*21000000001*100011100123210001*/222111**200123210222000000000223110111001*10000011/**21013320112**212*21001110001*2*101*2111221000000/35*3101*211*2344*33*2101*1112222111222*112*1001110/*3**1012*11111**22*3*222211*2*21212*22111*21123*10/122221223210012322122*2*2121212*2*22*22232201**310/00002*3*2*112211*10122212*10012bbab222**2*1013*310/00002*312222**211101*210111001*assa*123cba10012*10/0000112111*23*2001233*10111001aassaaaa*asa11002220/0001222*2221112122**31101*1011assssssaaasa*1001*10/0001**212*10001*2*4*201132212*assssssssssa11001221/22112210112121213343333*2*11*2asssssssabbb110012*1/**100012211*2*101**2***2211112aassssssa**3*2112*21/2210001**211211012223431000001*assssssabbc*21*2221/00111013*200000000012*10000001aasssssssssaaaa122*1/112*1013321110001111*221211011asaaaaaassssssa13*31/1*22223**12*42112*11111*3*201*bab*11*aaabaasa*4*20/1111*3**312***22*21011213*20112*2111111*2*baa2*210/111113*42112333*43101*32212110123210001133*1122100/1*100112*10001*3**1012**101*1112**1111113*311*2110/111000011211012332100123322111*22212*21*3*21344*21/0111011101*1001*10000001**1001121102*3213221***3*1/12*101*1134310112111110122100001*1023*102*21232211/*22211111***10001*23*310000000011101*2102*20000011/122*101122332100123***101111111110011101232100001*/12*2101*1001*21112*442101*22*33*10000001*2*1111022/1*210011100234*23*4*100012*33**32111100112233*101*/223111110112**3*3*5320000112*433*11*1000012**21011/1*2*11*101*2222122**1000000112*21111100001*3210000/"
	);
	updateVisibleTiles();
}



camera.hidden = true
// const oldDraw = () => {
// 	tilesContainer.removeChildren();
// 	let culledTiles = [];
// 	tilesContainer.children.forEach(tileSprite => {
// 		const xPos = Math.floor(tileSprite.x / prevPosition.tileSize);
// 		const yPos = Math.floor(tileSprite.y / prevPosition.tileSize);
// 		const tile = getTileAt(xPos, yPos);
// 		drawTile(tile, tileSprite);
// 		if (
// 			tileSprite.x + tileSize < 0 ||
// 			tileSprite.y + tileSize < 0 ||
// 			tileSprite.x > camera.offsetWidth ||
// 			tileSprite.y > camera.offsetHeight
// 		) culledTiles.push(tileSprite);
// 	});

// 	culledTiles.forEach(c => tilesContainer.removeChild(c));

// 	if (
// 		cameraX != prevPosition.x ||
// 		cameraY != prevPosition.y
// 	) {
		


// 		for (let y = cameraY+tileSize; y < camera.offsetHeight+tileSize; y+=tileSize) {
// 			for (let x = cameraX+tileSize; x < camera.offsetWidth+tileSize; x+=tileSize) {
// 				if (
// 					prevPosition.x <= x && x < prevPosition.offsetWidth + prevPosition.tileSize &&
// 					prevPosition.y <= y && y < prevPosition.offsetHeight + prevPosition.tileSize					
// 				) continue;

// 				const xPos = Math.floor(x / tileSize);
// 				const yPos = Math.floor(y / tileSize);
// 				const tile = getTileAt(xPos, yPos);
// 				if (!tile) continue;
// 				tile.data = Math.floor(Math.random() * 9.99);
// 				tile.state = 0;
// 				drawTile(tile);
// 			}
// 		}
// 	}

// 	prevPosition = {
// 		x: cameraX,
// 		y: cameraY,
// 		width: camera.offsetWidth,
// 		height: camera.offsetHeight,
// 		tileSize
// 	}
// }
// oldDraw();