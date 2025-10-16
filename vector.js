class Vector {
constructor(x, y) {
this.x = x;
this.y = y;
}

add(v) {
this.x += v.x;
this.y += v.y;
return this;
}

sub(v) {
this.x -= v.x;
this.y -= v.y;
return this;
}

mult(n) {
this.x *= n;
this.y *= n;
return this;
}

div(n) {
if (n !== 0) {
this.x /= n;
this.y /= n;
}
return this;
}

mag() {
return Math.sqrt(this.x * this.x + this.y * this.y);
}

normalize() {
let m = this.mag();
if (m !== 0) {
this.div(m);
}
return this;
}

limit(max) {
if (this.mag() > max) {
this.normalize();
this.mult(max);
}
return this;
}

static add(v1, v2) {
return new Vector(v1.x + v2.x, v1.y + v2.y);
}

static add2(arr) {
return arr.reduce((vec, v) => vec.add(v), new Vector(0, 0));
}

static sub(v1, v2) {
return new Vector(v1.x - v2.x, v1.y - v2.y);
}

static mult(v1, n) {
return new Vector(v1.x * n, v1.y * n);
}

static div(v1, n) {
return n !== 0 ? new Vector(v1.x / n, v1.y / n) : new Vector(0, 0);
}

static angleBetween(v1, v2) {
return Math.atan2(v2.y - v1.y, v2.x - v1.x);
}

angle() {
return Math.atan2(this.y, this.x);
}

copy() {
return new Vector(this.x, this.y);
}

setMag(c) {
this.normalize();
this.mult(c);
return this;
}

static applyForce(force,mass){
let acc = Vector.div(force,mass);
return acc;
}


checkEdges() {
if (this.position.x > canvas.width) {
this.position.x = 0;
} else if (this.position.x < 0) {
this.position.x = canvas.width;
}

if (this.position.y > canvas.height) {
this.position.y = 0;
} else if (this.position.y < 0) {
this.position.y = canvas.height;
}
}

}



function
createVector(x,y)
{
return new Vector(x,y);
}

function
createVectorWithAngle(ang)
{
let x=Math.cos(ang)
let y=Math.sin(ang)
return new Vector(x,y);
}