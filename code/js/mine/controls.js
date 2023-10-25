function mouseOrTouch(e) {
	return e.changedTouches ? e.changedTouches[0] : e;
}
function tileFromMouse(e) {
	const clickX = e.clientX - app.view.getBoundingClientRect().left + cameraX;
	const clickY = e.clientY - app.view.getBoundingClientRect().top + cameraY;
	const posX = Math.floor(clickX / tileSize);
	const posY = Math.floor(clickY / tileSize);

	return getTileAt(posX, posY);
}
function nearestTiles(tile) {
	let tiles = [];

	for (j = -1; j < 2; j++) {
		for (i = -1; i < 2; i++) {
			tiles.push(getTileAt(tile.x + i, tile.y + j));
		}
	}

	return tiles;
}
function expandBoardAroundTile(x, y) {
	const { x: chunkX, y: chunkY } = getChunkAt(x, y);

	for (let j = -1; j < 2; j++) {
		for (let i = -1; i < 2; i++) {
			if (!getTileAt((chunkX + i) * chunkWidth, (chunkY + j) * chunkHeight))
				genExtentionBoardAt(chunkX + i, chunkY + j);
		}
	}
}


let dragState = -1;
let dragStartX, dragStartY, dragStartMX, dragStartMY;
let resizingVelocity = 0;


function handleMouseDown(e) {
	startDrag(e);
	if (e.button === 0 || e.touches?.length === 1) {
		longPressTimer = setTimeout(() => {
			longPressTimer = undefined;
			rightClickEvent(e);
		}, userConfig.holdDelay);
	} else if (e.touches?.length > 1) {
		clearTimeout(longPressTimer);
		longPressTimer = undefined;
	}
	if (e.touches?.length === 2) {
		const x1 = e.touches[0].clientX;
		const y1 = e.touches[0].clientY;
		const x2 = e.touches[1].clientX;
		const y2 = e.touches[1].clientY;

		touchStartDistance = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
		initialSize = tileSize;
	}
}
function handleMouseUp(e) {
	e.preventDefault();
	if (endDrag(e) == true) {
		clearTimeout(longPressTimer);
		longPressTimer = undefined;
		return;
	}
	if (longPressTimer && (e.button === 0 || e.touches?.length == 0)) {
		clearTimeout(longPressTimer);
		longPressTimer = undefined;
		leftClickEvent(e);
	} else if (e.button === 2) {
		rightClickEvent(e);
	}
}



function leftClickEvent(e) { leftClick(tileFromMouse(mouseOrTouch(e))); updateVisibleTiles(); }
function rightClickEvent(e) { rightClick(tileFromMouse(mouseOrTouch(e))); updateVisibleTiles(); }

function leftClick(tile, startTile) {
	if (dragState >= 1 || !tile) return;
	if (tile.state >= 2) return; // exploded or flag
	if (autoExtend)
		expandBoardAroundTile(tile.x, tile.y);

	if (tile.data === 0 && tile.state != 0) { // 0 tile recursion
		tile.state = 0;
		if (!startTile)
			startTile = tile;
		const delay = (Math.abs(tile.x - startTile.x) + Math.abs(tile.y - startTile.y) - 2) * userConfig.openDelay;
		startAnimation({ x: tile.x, y: tile.y, name: "opentile", sprite: "space.png", delay });
	}

	if (!startTile)
		startTile = tile;
	if (tile.state === 0) {
		let nearby = 0;
		const tiles = nearestTiles(tile);
		tiles.forEach(el => {
			if (el?.state >= 2) nearby++;
		});
		if (nearby === tile.data)
			tiles.forEach(el => {
				if (el?.state === 1) leftClick(el, startTile);
			});
	} else
		if (tile.data === "mine") {
			placeTile(tile.x, tile.y, { ...tile, state: 3 });
			startAnimation({ x: tile.x, y: tile.y, name: "explosion", sprite: "explosion.gif" });
		}
		else {
			const delay = (Math.abs(tile.x - startTile.x) + Math.abs(tile.y - startTile.y) - 2) * userConfig.openDelay;
			placeTile(tile.x, tile.y, { ...tile, state: 0 }, { animation: { x: tile.x, y: tile.y, name: "opentile", sprite: "space.png", delay } });
		}
}

function rightClick(tile) {
	if (dragState >= 1 || !tile) return;

	if (tile.state === 0) {
		let nearby = 0;
		const tiles = nearestTiles(tile);
		tiles.forEach(el => {
			if (el?.state > 0) nearby++;
		});
		if (nearby === tile.data)
			tiles.forEach(el => {
				if (el?.state === 1) rightClick(el);
			});
	} else if (tile.state !== 3) {
		if (tile.state !== 2) startAnimation({ x: tile.x, y: tile.y, sprite: "space.png", anim: { time: 250 * userConfig.animSpeed } });
		startAnimation({ x: tile.x, y: tile.y, name: tile.state === 2 ? "removeflag" : "placeflag", sprite: "flag_.png" });
		placeTile(tile.x, tile.y, { ...tile, state: tile.state === 2 ? 1 : 2 });
	}
}



function startDrag(e) {
	if (e.touches?.length > 1 || e.button > 1) return endDrag(e);
	e = mouseOrTouch(e);
	dragStartX = e.clientX + cameraX;
	dragStartY = e.clientY + cameraY;
	dragStartMX = e.screenX;
	dragStartMY = e.screenY;
	dragState = 0
}
function moveDrag(e) {
	if (e.touches?.length > 1 || e.button > 1) return;
	e = mouseOrTouch(e);
	const offsetX = dragStartX - e.clientX;
	const offsetY = dragStartY - e.clientY;
	if (dragState >= 1) {
		cameraX = offsetX;
		cameraY = offsetY;
		updateVisibleTiles();
	} else if ((dragState === 0 || dragState === 2) && (Math.abs(e.screenX - dragStartMX) + Math.abs(e.screenY - dragStartMY) > 15)) {
		dragState = 1;
		camera.classList.add('dragging');
		dragStartX += e.screenX - dragStartMX;
		dragStartY += e.screenY - dragStartMY;
	}
}
function endDrag(e) {
	if (e.touches?.length === 1) return startDrag(e);
	if (dragState <= 0) return dragState = -1;
	dragState = -1;
	camera.classList.remove('dragging');
	return true;
}
function resizeBoard(e) {
	if (e.touches) {
		if (touchStartDistance !== null && e.touches.length === 2) {
			const x1 = e.touches[0].clientX;
			const y1 = e.touches[0].clientY;
			const x2 = e.touches[1].clientX;
			const y2 = e.touches[1].clientY;

			const startSize = tileSize;
			const touchMoveDistance = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
			tileSize = Math.min(Math.max(8, (touchMoveDistance / touchStartDistance) * initialSize), 48);

			cameraX = ((cameraX + camera.offsetWidth / 2) * tileSize / startSize) - camera.offsetWidth / 2;
			cameraY = ((cameraY + camera.offsetHeight / 2) * tileSize / startSize) - camera.offsetHeight / 2;
			updateVisibleTiles();
		}
	} else {
		resizingVelocity += e.deltaY > 0 ? -1 : 1;
	}
}
function resizeWindow() {
	app.renderer.resize(camera.offsetWidth, camera.offsetHeight);
	cameraX += (backgroundTiles.width - camera.offsetWidth) / 2;
	cameraY += (backgroundTiles.height - camera.offsetHeight) / 2;
	backgroundTiles.width = camera.offsetWidth;
	backgroundTiles.height = camera.offsetHeight;
	updateVisibleTiles();

	const actualHeight = window.innerHeight;
	const elementHeight = document.querySelector('#control-height').clientHeight;

	camera.parentElement.style.setProperty('--bar-height', elementHeight - actualHeight + 'px');
}
resizeWindow(); resizeWindow(); // :shrug:

let longPressTimer;
let touchStartDistance = null;
let initialSize;

camera.addEventListener('contextmenu', (e) => { e.preventDefault() })
camera.addEventListener('mousedown', handleMouseDown);
camera.addEventListener('touchstart', handleMouseDown);
camera.addEventListener('mouseup', handleMouseUp);
camera.addEventListener('touchend', handleMouseUp);

document.addEventListener('mousemove', moveDrag);
document.addEventListener('touchmove', moveDrag);
document.addEventListener('wheel', resizeBoard);
document.addEventListener('touchmove', resizeBoard);
window.addEventListener('resize', resizeWindow);


document.addEventListener("fullscreenchange", (e) => {
	if (document.fullscreenElement == camera.parentElement) {
		camera.parentElement.classList.add("fullscreen");
		updateVisibleTiles();
	} else {
		camera.parentElement.classList.remove("fullscreen");
		updateVisibleTiles();
	}
	resizeWindow();
})

app.ticker.add(() => {
	if (Math.abs(resizingVelocity) >= 0.5) {
		const startSize = tileSize;
		tileSize = Math.min(Math.max(8, tileSize + resizingVelocity), 48);

		cameraX = ((cameraX + camera.offsetWidth / 2) * tileSize / startSize) - camera.offsetWidth / 2;
		cameraY = ((cameraY + camera.offsetHeight / 2) * tileSize / startSize) - camera.offsetHeight / 2;
		dragStartX *= tileSize / startSize;
		dragStartY *= tileSize / startSize;
		resizingVelocity *= 0.8;
		updateVisibleTiles();
	} else resizingVelocity = 0
});
