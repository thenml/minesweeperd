const sounds = { // TODO combine audio files into one https://github.com/goldfire/howler.js#group-playback
	opentile: new Howl({ src: ['/assets/sounds/tile.mp3'] }),
	placeflag: new Howl({ src: ['/assets/sounds/flag.mp3'] }),
	removeflag: new Howl({ src: ['/assets/sounds/flag.mp3'] }),
	explosion: new Howl({ src: ['/assets/sounds/explode.mp3'] }),
}

const textures = {}
PIXI.Assets.load('/assets/mine/explosion.json').then(() => {
	textures.explosion = [];
	for (let i = 0; i < 17; i++) {
		textures.explosion.push(PIXI.Texture.from(`explosion-${i}.png`));
	}
});

function getAnimation(name, sprite, overrides) {
	const animations = {
		opentile: {
			from: { y: sprite.y, rotation: 0, alpha: 1 },
			to: { y: sprite.y - sprite.height, rotation: (Math.random() * 180 + 15) * (Math.PI / 180), alpha: 0 },
			time: 1000,
			ease: TWEEN.Easing.Cubic.Out,
		},
		placeflag: {
			from: {y: sprite.y - sprite.height / 3 , alpha: 0},
			to: {y: sprite.y, alpha: 1},
			time: 500,
			ease: TWEEN.Easing.Cubic.Out,
		},
		removeflag: {
			from: {y: sprite.y, alpha: 1},
			to: {y: sprite.y - sprite.height / 3 , alpha: 0},
			time: 500,
			ease: TWEEN.Easing.Sinusoidal.In,
		},
		explosion: {
			from: {_textureIndex: 0},
			to: {_textureIndex: textures.explosion.length},
			textures: textures.explosion,
			time: 500, 
		}
	}

	const anim = {...animations[name], ...overrides};
	if (!anim?.to) {
		if (anim?.time > 0) setTimeout(() => {
			animationContainer.removeChild(sprite);
		}, anim.time);
		else animationContainer.removeChild(sprite);
		return;
	}

	return new TWEEN.Tween(anim.from)
		.to(anim.to, anim.time * userConfig.animSpeed)
		.easing(anim.ease ?? TWEEN.Easing.Linear.None)
		.onUpdate((o) => {
			Object.keys(o).forEach(k => {
				switch (k) {
					case '_textureIndex':
						sprite.texture = anim.textures[Math.floor(o[k])];
						break;
					default: sprite[k] = o[k]; break;
				}
			});
		})
		.onComplete(() => {
			animationContainer.removeChild(sprite);
		});
}

function startAnimation(options) {
	const animationSprite = PIXI.Sprite.from(tileTexture(options.sprite));
	animationContainer.addChild(animationSprite);

	if (!options.screenX || !options.screenY) {
		const { screenX, screenY } = getScreenPos(options.x, options.y, true);
		options.screenX = screenX + cameraX; options.screenY = screenY + cameraY;
	}

	animationSprite.anchor.set(0.5);
	animationSprite.x = options.screenX / tileSize * 16;
	animationSprite.y = options.screenY / tileSize * 16;
	animationSprite.visible = !options.hide;

	function animation() {
		animationSprite.visible = true;

		getAnimation(options.name, animationSprite, options.anim)?.start();

		if (sounds[options.name])
			sounds[options.name].play();
	}

	// if (options.delay != "end")
	if (options.delay > 0) setTimeout(() => {
		animation();
	}, options.delay);
	else animation();
}

app.ticker.add(() => {
	TWEEN.update();
});