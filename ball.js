//reference: https://www.youtube.com/watch?v=GcPT4kd9JSo&ab_channel=danielstuts
// requires npm install regression

//the centripetal acceleration applies, but we have to find the radius of motion
const canvas = document.getElementById("physicsCanvas");
const ctx = canvas.getContext("2d");
// var timer;

const balls = [];
var anglepre = 0;

let friction;
let mouseForce;
const epsilon = 1e-4;
let intervalId = null;
let movingBall;

class Ball {
  constructor(x, y, r) {
    this.pos = new Vector(x, y);
    this.r = r;
    this.velo = new Vector(0, 0);
    this.acce = new Vector(0, 0);
    this.acceleration = 0.15;
    this.isDragging = false;
    this.isMoving = false;
    this._latest_points = [];
    this._angle_samples = [];
    this.a_r = 0;
    this.prev_acce_vector = new Vector(0, 0);
    balls.push(this);
  }

  drawBall() {
    ctx.beginPath();
    ctx.arc(this.pos.x, this.pos.y, this.r, 0, 2 * Math.PI);
    ctx.strokeStyle = "black";
    ctx.stroke();
    ctx.fillStyle = "blue";
    ctx.fill();
    ctx.closePath();
  }

  drawPoints() {
    ctx.beginPath();
    for (const _x_y of this._latest_points) {
      ctx.arc(_x_y[0], _x_y[1], 10, 0, 2 * Math.PI);
    }
    ctx.strokeStyle = "orange";
    ctx.stroke();
    ctx.closePath();
  }

  display() {
    this.velo.drawVec(550, 400, 10, "green");
    this.acce.unit().drawVec(550, 400, 50, "blue");

    ctx.beginPath();
    ctx.arc(550, 400, 50, 0, 2 * Math.PI);
    ctx.strokeStyle = "black";
    ctx.stroke();
    ctx.closePath();
  }

  addPosition(MouseX, MouseY) {
    if (this._latest_points.length > 5) {
      this._latest_points.shift();
    }
    this._latest_points.push([MouseX, MouseY]);
  }

  addAngle(angle) {
    if (this._angle_samples.length > 10) {
      this._angle_samples.shift();
    }
    // if(Math.abs(angle) > 5 && Math.abs(angle)){
      this._angle_samples.push(angle);
    // }

  }
  

  updatePhysics() {
    // cancelAnimationFrame(timer);
    let centripetal_acce = new Vector(0,0);
    if (this.isDragging) {
      // debugger;
      const temp = calculateDifferencesAndMean(this._latest_points);
      // var centripetalVeloChange;
      if (Math.abs(temp.deltaX) < epsilon && Math.abs(temp.deltaY) < epsilon) {
        this.acce.x = this.acce.y = 0;
        // centripetalVeloChange = new Vector(0, 0);
        this.velo = this.velo.mult(1 - friction).mult(0.9);
      } else {
        //TODO: DECREASE the number of calculation

        this.acce.x = temp.deltaX * this.acceleration;
        this.acce.y = temp.deltaY * this.acceleration;
        // console.log(cal_Angle_V(this.prev_acce_vector, this.acce));
        const delta_degree = rotateVector(this.acce,cal_Angle_V(this.prev_acce_vector, this.acce));
        this.addAngle(cal_Angle_V(this.prev_acce_vector, this.acce));

        // console.log(calculateMeanAngle(this._angle_samples), this._angle_samples);
        console.log(calculateMeanAngle(this._angle_samples),cal_Angle_V(this.prev_acce_vector, this.acce));
        
        this.prev_acce_vector = this.acce.copy();

        // this.velo = this.velo.add(this.acce).add(delta_degree).mult(1 - friction);

        this.velo = this.velo.add(this.acce).mult(1 - friction);


        //TODO: AN IF STATEMENT ON ONLY CIRCULAR MOTION BUT NOT STRARIGHT LINE AND 180 degree
        centripetal_acce = rotateVector(this.velo, calculateMeanAngle(this._angle_samples)*(1 - friction)).subtr(this.velo);

        this.velo = this.velo.add(centripetal_acce.mult(1 - friction));
        // centripetal_acce = mirrorVector(this.velo, this.acce).normal();
        // console.log(centripetal_acce, this.velo);

        if (this.velo.mag() !== 0) {
          this.isMoving = true;
        }

        // console.log(this.velo);

        // if (this.velo.mag() > 0 && (this.a_r > epsilon && this.a_r < 2000)) {

        //   const acce_scalar = this.velo.mag() ** 2 / this.a_r;
        //   centripetalVeloChange = this.velo.normal().mult(acce_scalar);

        //   const maxMagnitude = 1000;
        //   const scaleFactor = Math.min(1, maxMagnitude / centripetalVeloChange.mag());

        //   centripetalVeloChange = centripetalVeloChange.mult(scaleFactor);

        //   // one if statement to add or subtr
        //   this.velo = this.velo.add(centripetalVeloChange).mult(1 - friction);

        //   console.log(acce_scalar);
        //   console.log(centripetalVeloChange);
        // }
      }
      // this.velo = this.velo.add(centripetalVeloChange).mult(1 - friction);

      // console.log(this.acce, this.velo, temp);
    } else {
      if(centripetal_acce.mag() !== 0){
        this.velo = this.velo.add(centripetal_acce);
        centripetal_acce = new Vector(0,0);
      }
      this.velo = this.velo.mult(1 - friction);

      if (this.velo.mag() <= epsilon) {
        this.velo = new Vector(0, 0);
        this.isMoving = false;
      } else {
        this.pos = this.pos.add(this.velo);
      }

      // Check for collision with canvas borders
      this.handleWallCollision();

      // Check for collision with other balls
      for (const otherBall of balls) {
        if (this !== otherBall) {
          this.handleBallCollision(otherBall);
        }
      }
    }
  }

  handleWallCollision() {
    if (this.pos.x <= this.r || this.pos.x >= canvas.width - this.r) {
      this.velo.x *= -1; // Reverse velocity on collision with horizontal borders
    }
    if (this.pos.y <= this.r || this.pos.y >= canvas.height - this.r) {
      this.velo.y *= -1; // Reverse velocity on collision with vertical borders
    }
  }

  handleBallCollision(otherBall) {
    const distance = this.pos.subtr(otherBall.pos).mag();

    if (distance <= this.r + otherBall.r) {
        // Collission detected, update velocities for both balls
        this.penetration_resolution(otherBall);
        this.collision_resolution(otherBall);
        // let normal = this.pos.subtr(otherBall.pos).unit();
        // let relativeVelocity = this.velo.subtr(otherBall.velo);
        // const relativeSpeedAlongNormal = relativeVelocity.dot(normal);
        // if (relativeSpeedAlongNormal < 0) {
        //     const impulse =
        //         (2 * relativeSpeedAlongNormal) /
        //         (1 / this.mass + 1 / otherBall.mass);

        //     this.velo = this.velo.subtr(normal.mult(impulse / this.mass));
        //     otherBall.velo = otherBall.velo.add(normal.mult(impulse / otherBall.mass));

        //     // Move balls away from each other to prevent sticking
        //     const overlap = combinedRadius - distance;
        //     const moveVec = normal.mult(overlap / 2);

        //     this.pos = this.pos.add(moveVec);
        //     otherBall.pos = otherBall.pos.subtr(moveVec);
        // }
    }
  }

  penetration_resolution(otherBall) {
    let dist = this.pos.subtr(otherBall.pos);
    let pen_depth = this.r + otherBall.r -dist.mag();
    let pen_res = dist.unit().mult(pen_depth/2);
    this.pos = this.pos.add(pen_res);
    otherBall.pos = otherBall.pos.add(pen_res.mult(-1));
  }

  collision_resolution(otherBall) {
    let normal = this.pos.subtr(otherBall.pos).unit();
    let relvel = this.velo.subtr(otherBall.velo);
    let sepvel = relvel.dot(normal);
    let new_sepvel = -sepvel;
    let sepvelvec = normal.mult(new_sepvel);

    this.velo = this.velo.add(sepvelvec);
    otherBall.velo = otherBall.velo.add(sepvelvec.mult(-1));
  }


}

class Vector {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  add(v) {
    return new Vector(this.x + v.x, this.y + v.y);
  }

  subtr(v) {
    return new Vector(this.x - v.x, this.y - v.y);
  }

  mag() {
    return Math.sqrt(this.x ** 2 + this.y ** 2);
  }

  mult(n) {
    return new Vector(this.x * n, this.y * n);
  }

  normal() {
    return new Vector(-this.y, this.x).unit();
  }

  copy() {
    return new Vector(this.x, this.y);
  }

  unit() {
    if (this.mag() === 0) {
      return new Vector(0, 0);
    } else {
      return new Vector(this.x / this.mag(), this.y / this.mag());
    }
  }

  drawVec(start_x, start_y, n, color) {
    ctx.beginPath();
    ctx.moveTo(start_x, start_y);
    ctx.lineTo(start_x + this.x * n, start_y + this.y * n);
    ctx.strokeStyle = color;
    ctx.stroke();
    ctx.closePath();
  }

  dot(v1) {
    return this.x * v1.x + this.y * v1.y;
  }
}

function round(number, precision){
  let factor = 10 ** precision;
  return Math.round(number * factor)/ factor;
}
function mousectrl() {

  // cancelAnimationFrame()
  canvas.addEventListener("mousedown", function (event) {
    // console.log("Mouse down event");
    const mouseX = event.clientX - canvas.getBoundingClientRect().left;
    const mouseY = event.clientY - canvas.getBoundingClientRect().top;

    for (const ball of balls) {
      const distance = Math.sqrt(
        (mouseX - ball.pos.x) ** 2 + (mouseY - ball.pos.y) ** 2
      );
      if (distance < ball.r) {
        ball.isDragging = true;
        // ball.isMoving = true;
        ball.addPosition(ball.pos.x, ball.pos.y);
        movingBall = ball;
        // timer = requestAnimationFrame(mainloop);
        // startTime = new Date().getTime();
        break;
      }
    }
    // clearInterval(intervalId);

    if (movingBall == null) {
      return;
    } else {
      if (intervalId === null) {
        intervalId = setInterval(function () {
          movingBall.addPosition(movingBall.pos.x, movingBall.pos.y);

          // console.log(movingBall.pos.x, movingBall.pos.y, (new Date().getTime() - startTime) / 1000);
        }, 25);
      }
    }
    // console.log(_latest_points.toString());
  });

  canvas.addEventListener(
    "mousemove",
    _.throttle(function (event) {
      // console.log()
      // cancelAnimationFrame(timer);
      const mouseX = event.clientX - canvas.getBoundingClientRect().left;
      const mouseY = event.clientY - canvas.getBoundingClientRect().top;

      const mousePos = new Vector(mouseX, mouseY);

      for (const ball of balls) {
        if (ball.isDragging) {
          // Update the position of the dragged ball
          // ball.pos.x = mouseX;
          // ball.pos.y = mouseY;
          const force = mousePos.subtr(ball.pos).unit().mult(mouseForce);
          ball.pos.x += force.x;
          ball.pos.y += force.y;

          //check the boarders
          if (ball.pos.x < ball.r) {
            ball.pos.x = ball.r;
          } else if (ball.pos.x > canvas.width - ball.r) {
            ball.pos.x = canvas.width - ball.r;
          }
          if (ball.pos.y < ball.r) {
            ball.pos.y = ball.r;
          } else if (ball.pos.y > canvas.height - ball.r) {
            ball.pos.y = canvas.height - ball.r;
          }
        }
      }

      // if (balls.some((ball) => ball.isMoving || ball.isDragging)) {
      //   timer = requestAnimationFrame(mainloop);
      // }
    },30)
  );

  canvas.addEventListener("mouseup", function (event) {
    // Release all dragged balls when the mouse is up
    // console.log("Mouse up event");
    for (const ball of balls) {
      movingBall = null;
      ball.isDragging = false;

      if (intervalId !== null) {
        clearInterval(intervalId);
        intervalId = null;
      }
    }
  });

  // document.addEventListener("DOMContentLoaded", function () {
  //   // Your initialization code here
  //   // For example, creating balls and setting up the canvas
  //   let b1 = new Ball(200, 200, 30);
  //   let b2 = new Ball(150, 100, 20);
  //   mouseForce = 0.1;
  //   friction = 0.04;
  //   // Start the animation loop
  //   console.log("loaded");
  //   timer = requestAnimationFrame(mainloop);
  // });
}

// Add event listeners
function calculateAngle(x, y) {
  // Use Math.atan2 to calculate the angle in radians
  const angleRadians = Math.atan2(y, x);

  // Convert radians to degrees if needed
  const angleDegrees = (angleRadians * 180) / Math.PI;

  return angleDegrees;
}

function rotateVector(v, angleDegrees) {
  // Convert Cartesian coordinates to polar coordinates
  const magnitude = Math.sqrt(v.x ** 2 + v.y ** 2);
  let angleRadians = Math.atan2(v.y, v.x);

  // Add the desired angle (in degrees)
  angleRadians += (angleDegrees * Math.PI) / 180;

  // Convert back to Cartesian coordinates
  const newX = magnitude * Math.cos(angleRadians);
  const newY = magnitude * Math.sin(angleRadians);

  // Return the new vector components
  return new Vector(newX, newY);
}

function mirrorVector(originalVector, mirrorVector) {
  // Calculate the angle between the two vectors
  const angleBetween = cal_Angle_V(originalVector, mirrorVector);

  // Double the angle to determine the mirroring angle
  const mirroringAngle = 2 * angleBetween;

  // Use the rotateVector function to mirror the vector
  const mirroredVector = rotateVector(originalVector, mirroringAngle);

  return mirroredVector;
}

function cal_Angle_V(vx, vy) {
  const dot = vx.dot(vy);
  const magx = vx.mag();
  const magy = vy.mag();

  if (magx === 0 || magy === 0) {
    // console.error("Cannot calculate angle with zero-length vector.");
    return 0;
  }

  const crossProduct = vx.x * vy.y - vx.y * vy.x;
  const sign = crossProduct >= 0 ? 1 : -1;
  const cosTheta = dot / (magx * magy);

  const theta = Math.acos(cosTheta);
  // console.log(vx,vy, cosTheta, theta);

  if (isNaN(theta)) {
    return 0;
  }

  return sign * (theta * 180) / Math.PI;
}

function distance(x, y) {
  return Math.sqrt(x ** 2 + y ** 2);
}

function calculateDifferencesAndMean(points) {
  const differences = [];

  // Calculate differences between consecutive points
  for (let i = 1; i < points.length; i++) {
    const deltaX = points[i][0] - points[i - 1][0];
    const deltaY = points[i][1] - points[i - 1][1];

    differences.push({
      deltaX,
      deltaY,
    });
  }

  // Calculate the mean of differences
  const meanDifference = differences.reduce(
    (sum, diff) => {
      sum.deltaX += diff.deltaX;
      sum.deltaY += diff.deltaY;
      return sum;
    },
    { deltaX: 0, deltaY: 0 }
  );



  // console.log(meanDifference);

  // Divide by the number of differences to get the mean
  const numDifferences = differences.length || 1; // Avoid division by zero
  meanDifference.deltaX /= numDifferences;
  meanDifference.deltaY /= numDifferences;

  return meanDifference;
}

function calculateMeanAngle(angles){
  var sum = 0;
  for (let i = 1; i < angles.length; i++) {
    sum += angles[i];
  }
  // console.log(sum);
  if(angles.length == 0){
    return 0;
  }
  return sum/angles.length;
}


function mainloop() {
  // console.log(timer);

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  mousectrl();

  for (const ball of balls) {
    ball.drawBall();
    ball.updatePhysics();
    
    ball.drawPoints();
    // ball.fitCircle();
    ball.display();
    // if(ball.isMoving){
    //   console.log(ball.isMoving, ball.velo);
    // }
    // console.log(ball.isMoving);
  }
  requestAnimationFrame(mainloop);
}

let b1 = new Ball(200, 200, 30);
let b2 = new Ball(150, 100, 20);
mouseForce = 0.14;
friction = 0.04;

requestAnimationFrame(mainloop);



