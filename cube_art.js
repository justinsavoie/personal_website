let cubes = [];
let bouncing_balls = [];

function setup() {
  createCanvas(windowWidth,windowHeight);
  for (let i = 0; i < 30; i++){
    cubes.push(new cube(random(width),random(height),random(width/5),random(height/3),[random(255),random(255),random(255)]));
  }
  for (let i = 0; i < 15; i++){
    bouncing_balls.push(new bouncing_ball(random(20,width-20),random(20,height-20),random(-4,4),random(-4,4),5,[255,255,255]));
  }
}

function draw() {
  background(0);
  for (let i = 0; i < bouncing_balls.length; i++) {
    bouncing_balls[i].display();
    bouncing_balls[i].move();
  }
  for (let i = 0; i < cubes.length; i++) {
    cubes[i].display();
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  background(0);
  for (let i = 0; i < cubes.length; i++) {
    cubes[i].display();
  }
}

class cube {
  constructor(x,y,w,h,col){
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.col = col;
  }

  display() {
    fill(this.col[0],this.col[1],this.col[2]);
    rect(this.x,this.y,this.w,this.w);
  }
}

class bouncing_ball {
  constructor(x,y,x_speed,y_speed,r,col){
    this.x = x;
    this.y = y;
    this.x_speed = x_speed;
    this.y_speed = y_speed;
    this.r = r;
    this.col = col;
  }

  display() {
    fill(this.col[0],this.col[1],this.col[2]);
    ellipse(this.x, this.y, this.r*2, this.r*2);
  }
  move() {
    this.x += this.x_speed;
    this.y += this.y_speed;
    if (this.x > width - this.r || this.x < this.r) {
      this.x_speed = -this.x_speed;
    }
    if (this.y > height - this.r || this.y < this.r) {
      this.y_speed = -this.y_speed;
    } 
  }
}
