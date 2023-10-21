const camera = document.getElementById('container');
const debug_info = document.getElementById('debug-info');

let userConfig = {
	selectedTileset: 'generic_colored', // todo: combine tileset into one generated file
	holdDelay: 100,
	openDelay: 60,
	showBackTiles: false,
	invisibleZero: true,
	animSpeed: 1.0,
}

const autoExtend = true;

function tileTexture(tile) {
	return `/assets/mine/tiles/${userConfig.selectedTileset}/${tile}`;
}

let tileSize = 16;
let chunkWidth, chunkHeight;

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

let cameraX = 0;
let cameraY = 0;
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
		data: null, // null - generate (todo) | 0-9 | mine | q | wall
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
function getChunkAt(x, y) { return {x: Math.floor(x / chunkWidth), y: Math.floor(y / chunkHeight)}; }
function expandAt(chunkX, chunkY) {
	genBasicBoard({x: chunkX * chunkWidth, y: chunkY * chunkHeight, border: false, expand: true});
	updateVisibleTiles();
}
function getScreenPos(x, y, centered) {  return {
		screenX: (x + (centered ? 0.5 : 0)) * tileSize - cameraX,
		screenY: (y + (centered ? 0.5 : 0)) * tileSize - cameraY
}}

placeTile(0, 0, { data: 1 });

// Function to update the visible tiles based on the camera position
function updateVisibleTiles() {
	const minX = Math.floor(cameraX / tileSize);
	const minY = Math.floor(cameraY / tileSize);
	const maxX = Math.ceil((cameraX + camera.offsetWidth) / tileSize);
	const maxY = Math.ceil((cameraY + camera.offsetHeight) / tileSize);
	
	tilesContainer.removeChildren();
	for (y=minY; y<maxY; y++) {
		if (typeof grid[`${y}`] === 'object')
			for (x=minX; x<maxX; x++) {
				drawTile(getTileAt(x,y));
			}
	}

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


camera.parentElement.hidden = true
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