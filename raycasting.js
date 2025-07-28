const log = console.log;

function toRad(deg) {
	return ((deg * Math.PI) / 180);
}

function normalizeAngle(angle) {
	angle = angle % (Math.PI * 2);
	if (angle < 0)
		angle += (Math.PI * 2);
	return (angle);
}

function getDist(pt1, pt2) {
	// get distance between 2 points:
	return (
		Math.sqrt(
			Math.pow(pt2.y - pt1.y, 2) +
			Math.pow(pt2.x - pt1.x, 2)
		)
	)
}

const UP_ARROW = 38;
const DOWN_ARROW = 40;
const LEFT_ARROW = 37;
const RIGHT_ARROW = 39;

const TILE_SIZE = 32;
const ROWS = 11;
const COLS = 15;

const WINDOW_H = ROWS * TILE_SIZE;
const WINDOW_W = COLS * TILE_SIZE;

const FOV = toRad(60);
const RAY_THIKNESS = 10;
const NUM_RAYS = WINDOW_W / RAY_THIKNESS;
const RAY_ANGLE = FOV / NUM_RAYS;


class MyMap {
	constructor() {
		this.map = [
			[1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
			[1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
			[1, 0, 1, 0, 0, 'N', 0, 0, 0, 1, 0, 1, 1, 0, 1],
			[1, 0, 1, 0, 0, 0, 0, 0, 1, 1, 0, 0, 1, 0, 1],
			[1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1, 0, 1, 0, 1],
			[1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1],
			[1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1],
			[1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1],
			[1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 0, 1],
			[1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
			[1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
		];
	}

	render() {
		for (let y = 0; y < this.map.length; y++) {
			for (let x = 0; x < this.map[y].length; x++) {
				const tile = this.map[y][x];
				if (tile === 1) {
					fill('#02000d');
				} else if (tile === 0 || tile == 'N') {
					fill('lightblue');
				}

				stroke('#02000d');
				rect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
			}
		}
	}

	hasWallAt(x, y) {
		let mapX = Math.floor(x / TILE_SIZE);
		let mapY = Math.floor(y / TILE_SIZE);
		if (this.map[mapY][mapX] == 1)
			return true;
		return false;
	}

	inBoundaries(x, y) {
		return ((x >= 0 && x <= WINDOW_W) && (y >= 0 && y <= WINDOW_H));
	}
}

const map = new MyMap();


class Player {
	constructor(tileX, tileY, map) {
		this.size = TILE_SIZE * 0.2;
		this.x = (tileX * TILE_SIZE) + (TILE_SIZE * 0.5);
		this.y = (tileY * TILE_SIZE) + (TILE_SIZE * 0.5);
		this.angle = toRad(190);
		this.move = 0;
		this.rotate = 0;
		this.moveSpeed = 1.8;
		this.rotateSpeed = 0.05;
		this.map = map;
	}
	render() {
		// draw player
		fill("red");
		noStroke();
		circle(this.x, this.y, this.size);

		stroke("red");
		let x2 = player.x + Math.cos(this.angle) * 50;
		let y2 = player.y + Math.sin(this.angle) * 50;
		line(player.x, player.y, x2, y2);
	}
	update() {
		let newX = this.x + Math.cos(this.angle) * this.move * this.moveSpeed;
		let newY = this.y + Math.sin(this.angle) * this.move * this.moveSpeed;
		if (!map.hasWallAt(newX, newY)) {
			this.x = newX;
			this.y = newY;
		}
		this.angle += this.rotate * this.rotateSpeed;
	}
}

function getPlayerPos(map) {
	for (let y = 0; y < map.length; y++) {
		for (let x = 0; x < map[y].length; x++) {
			const tile = map[y][x];
			if (tile === "N") {
				return [x, y];
			}
		}
	}
}

const player = new Player(...getPlayerPos(map.map), map.map); // ✅ Don't forget this
let rays = [];

class Ray {
	constructor(rayAngle) {
		this.rayAngle = normalizeAngle(rayAngle);
		this.distance = 0;
		this.isFacingDown = this.rayAngle > 0 && this.rayAngle < Math.PI;
		this.isFacingUP = !this.isFacingDown;
		this.wallHitX = 0;
		this.wallHitY = 0;
		this.isFacingRight = this.rayAngle < Math.PI * 0.5 || this.rayAngle > Math.PI * 1.5;
		this.isFacingLeft = !this.isFacingRight;
	}
	cast() {
		//======== check Horizontal interceptions: =======
		let horiz = this.getHorizontalWallHit();

		//======== check Vertical interceptions: =======
		let vert = this.getVerticalWallHit();

		if (vert.dist < horiz.dist) {
			this.wallHitX = vert.x;
			this.wallHitY = vert.y;
		} else {
			this.wallHitX = horiz.x;
			this.wallHitY = horiz.y;
		}

	}

	getHorizontalWallHit() {
		let foundHit = false;
		let hitX = 0;
		let hitY = 0;
		let stepX = 0;
		let stepY = 0;
		let intercX = 0;
		let intercY = 0;

		intercY = Math.floor(player.y / TILE_SIZE) * TILE_SIZE;
		if (this.isFacingDown)
			intercY += TILE_SIZE;
		intercX = player.x + (intercY - player.y) / Math.tan(this.rayAngle);

		stepY = TILE_SIZE;
		stepY *= this.isFacingUP ? -1 : 1;

		stepX = Math.abs(TILE_SIZE / Math.tan(this.rayAngle));
		stepX *= this.isFacingLeft ? -1 : 1;

		let nextIntercX = intercX;
		let nextIntercY = intercY;

		if (this.isFacingUP)
			nextIntercY--;

		while (map.inBoundaries(nextIntercX, nextIntercY)) {
			if (map.hasWallAt(nextIntercX, nextIntercY)) {
				foundHit = true;
				hitX = nextIntercX;
				hitY = nextIntercY;
				break;
			}
			nextIntercX += stepX;
			nextIntercY += stepY;
		}
		
		return ({
			foundHit,
			x: hitX, y: hitY,
			dist: foundHit ?
				getDist({ x: player.x, y: player.y },
					{ x: hitX, y: hitY })
				: Number.MAX_VALUE
		});
	}

	getVerticalWallHit() {
		let foundHit = false;
		let hitX = 0;
		let hitY = 0;
		let stepX = 0;
		let stepY = 0;
		let intercX = 0;
		let intercY = 0;

		intercX = Math.floor(player.x / TILE_SIZE) * TILE_SIZE;
		if (this.isFacingRight)
			intercX += TILE_SIZE;
		intercY = player.y + (intercX - player.x) * Math.tan(this.rayAngle);

		stepX = TILE_SIZE;
		stepX *= this.isFacingLeft ? -1 : 1;

		stepY = Math.abs(TILE_SIZE * Math.tan(this.rayAngle));
		stepY *= this.isFacingUP ? -1 : 1;

		let nextIntercX = intercX;
		let nextIntercY = intercY;

		if (this.isFacingLeft)
			nextIntercX--;

		while (map.inBoundaries(nextIntercX, nextIntercY)) {
			if (map.hasWallAt(nextIntercX, nextIntercY)) {
				foundHit = true;
				hitX = nextIntercX;
				hitY = nextIntercY;
				break;
			}
			nextIntercX += stepX;
			nextIntercY += stepY;
		}

		return ({
			foundHit,
			x: hitX, y: hitY,
			dist: foundHit ?
				getDist({ x: player.x, y: player.y },
					{ x: hitX, y: hitY })
				: Number.MAX_VALUE
		});
	}

	render() {
		stroke("orange");
		line(player.x, player.y, this.wallHitX, this.wallHitY);
	}
}

function castAllrays() {
	let startRayAngle = player.angle - (FOV / 2);
	for (let i = 0; i < NUM_RAYS; i++) {
		const ray = new Ray(startRayAngle);
		ray.cast();
		ray.render();
		rays.push(ray);
		startRayAngle += RAY_ANGLE;
	}
	rays = [];
}

function keyPressed() {
	// log("Key Pressed: ", keyCode);
	if (keyCode === UP_ARROW) {
		player.move = 1;
	} else if (keyCode === DOWN_ARROW) {
		player.move = -1;
	} else if (keyCode === LEFT_ARROW) {
		player.rotate = -1;
	} else if (keyCode === RIGHT_ARROW) {
		player.rotate = 1;
	}
}

function keyReleased() {
	// log("Key Released: ", keyCode);
	if (keyCode === UP_ARROW || keyCode === DOWN_ARROW) {
		player.move = 0;
	} else if (keyCode === LEFT_ARROW || keyCode === RIGHT_ARROW) {
		player.rotate = 0;
	}
}

function setup() {
	createCanvas(WINDOW_W, WINDOW_H);
}

function update() {
	player.update();
}
let test = 0;
function draw() {
	update();
	background(220);
	map.render();
	if (test == 0)
		castAllrays();
	// test = 1;
	player.render();
}
