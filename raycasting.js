const log = console.log;

function toRad(deg) {
	return ((deg * Math.PI) / 180);
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
			[1, 0, 0, 0, 'N', 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
			[1, 0, 1, 1, 0, 1, 1, 0, 0, 1, 0, 1, 1, 0, 1],
			[1, 0, 1, 0, 0, 0, 1, 0, 1, 1, 0, 0, 1, 0, 1],
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
}

class Player {
	constructor(tileX, tileY, map) {
		this.size = TILE_SIZE * 0.2;
		this.x = (tileX * TILE_SIZE) + (this.size * 0.7);
		this.y = (tileY * TILE_SIZE) + (this.size * 0.7);
		this.angle = toRad(45);
		this.move = 0;
		this.rotate = 0;
		this.moveSpeed = 1.8;
		this.rotateSpeed = 0.1;
		this.map = map;
	}
	render() {
		// draw player
		fill("red");
		noStroke();
		circle(this.x, this.y, this.size);
	}
	update() {
		let newX = this.x + Math.cos(this.angle) * this.move * this.moveSpeed;
		let newY = this.y + Math.sin(this.angle) * this.move * this.moveSpeed;
		if (!this.hasWallAt(newX, newY)) {
			this.x = newX;
			this.y = newY;
		}
		this.angle += this.rotate * this.rotateSpeed;
	}
	hasWallAt(x, y) {
		let radius = this.size / 2;

		// Check multiple points around the player's circumference
		let checkPoints = [
			{ x: x, y: y }, // center
			{ x: x + radius, y: y }, // right
			{ x: x - radius, y: y }, // left
			{ x: x, y: y + radius }, // bottom
			{ x: x, y: y - radius }  // top
		];

		for (let point of checkPoints) {
			let tileX = Math.floor(point.x / TILE_SIZE);
			let tileY = Math.floor(point.y / TILE_SIZE);

			if (tileX < 0 || tileX >= COLS || tileY < 0 || tileY >= ROWS) {
				return true;
			}

			if (map.map[tileY][tileX] === 1) {
				return true;
			}
		}
		// x -= this.size/2;
		// y -= this.size/2;
		// let mapX = Math.floor(x/TILE_SIZE);
		// let mapY = Math.floor(y/TILE_SIZE);
		// if (this.map[mapY][mapX] == 1)
		//     return true;
		// return false;
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

const map = new MyMap(); // ✅ Don't forget this
const player = new Player(...getPlayerPos(map.map), map.map); // ✅ Don't forget this
let rays = [];

class Ray {
	constructor(player, rayAngle) {
		this.pl = player;
		this.rayAngle = rayAngle;
	}
	//   cast() {
	//   }
	render() {
		stroke("green");
		let x2 = this.pl.x + Math.cos(this.rayAngle) * 100;
		let y2 = this.pl.y + Math.sin(this.rayAngle) * 100;
		line(this.pl.x, this.pl.y, x2, y2);
	}
}

function castAllrays() {
	let rayAngle = player.angle - (FOV / 2);
	for (let i = 0; i < NUM_RAYS; i++) {
		const ray = new Ray(player, rayAngle);
		ray.render();
		rays.push(ray);
		rayAngle += RAY_ANGLE;
	}
	rays = [];
}

function keyPressed() {
	log("Key Pressed: ", keyCode);
	if (keyCode === UP_ARROW) {
		log("Arrow up pressed");
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
	log("Key Released: ", keyCode);
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

function draw() {
	update();
	background(220);
	map.render(); // ✅ Render the map
	castAllrays();
	player.render();
}
