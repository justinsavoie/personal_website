function setup() {
  createCanvas(windowWidth,windowHeight);
}
counter = 0;
function draw() {
  background(0);
  fill(255);
  textSize(30);
  t = "When Marx undertook his critique of the capitalistic mode of production, this mode was in its infancy. Marx directed his efforts in such a way as to give them prognostic value. He went back to the basic conditions underlying capitalistic production and through his presentation showed what could be expected of capitalism in the future. The result was that one could expect it not only to exploit the proletariat with increasing intensity, but ultimately to create conditions which would make it possible to abolish capitalism itself. The transformation of the superstructure, which takes place far more slowly than that of the substructure, has taken more than half a century to manifest in all areas of culture the change in the conditions of production. Only today can it be indicated what form this has taken. Certain prognostic requirements should be met by these statements. However, theses about the art of the proletariat after its assumption of power or about the art of a classless society would have less bearing on these demands than theses about the developmental tendencies of art under present conditions of production. Their dialectic is no less noticeable in the superstructure than in the economy. It would therefore be wrong to underestimate the value of such theses as a weapon. They brush aside a number of outmoded concepts, such as creativity and genius, eternal value and mystery – concepts whose uncontrolled (and at present almost uncontrollable) application would lead to a processing of data in the Fascist sense. The concepts which are introduced into the theory of art in what follows differ from the more familiar terms in that they are completely useless for the purposes of Fascism. They are, on the other hand, useful for the formulation of revolutionary demands in the politics of art. \n\n\n just kidding, I'm not a marxist ";
  text(t.substring(0, counter), 50, 50, windowWidth-100);
  counter = counter + 1;
}
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  background(0);
  }

