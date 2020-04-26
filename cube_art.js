let cubes = [];
let bouncing_balls = [];

function setup() {
  createCanvas(windowWidth,windowHeight);
  for (let i = 0; i < 8; i++){
    cubes.push(new cube(random(width),random(height/3,height),width/10,[random(255),random(255),random(255)]));
  }
  for (let i = 0; i < 400; i++){
    bouncing_balls.push(new bouncing_ball(random(20,width),random(26,50),random(-1,1),random(1,2),10,[random(255),random(255),random(255)]));
  }
}
function draw() {
  background(0);
  counter = 0;  
  for (let i = 0; i < bouncing_balls.length; i++) {
    bouncing_balls[i].display();
    bouncing_balls[i].move();
    if (bouncing_balls[i].y > height) {
      counter = counter + 1;
    }
  }
  for (let i = 0; i < cubes.length; i++) {
    cubes[i].display();
  }
  fill(255, 255, 255);
  textSize(60);
  s = counter + ' / 400  \nSite web en construction...\nWebsite under construction...\n~ Justin Savoie\n(btw, there is nothing at 400/400, no need to wait!';
  text(s.substring(0, max([10,counter/3])), 10, 60);

}
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  background(0);
  for (let i = 0; i < cubes.length; i++) {
    cubes[i].display();
  }
}
class cube {
  constructor(x,y,w,col){
    this.x = x;
    this.y = y;
    this.w = w;
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
    if (this.y < this.r) {
      this.y_speed = -this.y_speed;
    }
    for (let i = 0; i < cubes.length; i++) {
      if (this.x > cubes[i].x - this.r && this.x - this.r < cubes[i].x + cubes[i].w && this.y > cubes[i].y - this.r && this.y - this.r < cubes[i].y + cubes[i].w) {
        if (abs(this.x - (cubes[i].x + cubes[i].w/2)) > abs(this.y - (cubes[i].y + cubes[i].w/2))) {
          this.x_speed = -this.x_speed;
        }
        if ((abs(this.x - (cubes[i].x + cubes[i].w/2)) < abs(this.y - (cubes[i].y + cubes[i].w/2)))) {
          this.y_speed = -this.y_speed;
        }
      }
    }
  }
}
