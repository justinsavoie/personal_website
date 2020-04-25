let cubes = [];

function setup() {
  createCanvas(windowWidth,windowHeight);
  for (let i = 0; i < 30; i++){
    cubes.push(new cube(random(width),random(height),random(width/5),random(height/3),[random(255),random(255),random(255)]))
  }

}

function draw() {
  background(0);
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
    rect(this.x,this.y,this.w,this.w)
  }
}
