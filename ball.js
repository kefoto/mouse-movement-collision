//reference: https://www.youtube.com/watch?v=GcPT4kd9JSo&ab_channel=danielstuts
// requires npm install regression
// import * as Regression from 'regression';

// import * from "regression/dist/regression.min.js";
//the centripetal acceleration applies, but we have to find the radius of motion
const canvas = document.getElementById("physicsCanvas");
const ctx = canvas.getContext("2d");
var timer;

const balls = [];
var anglepre = 0;

let friction;
let mouseForce;
const epsilon = 1e-5;
let intervalId;
let movingBall;


function mainloop() {

  // if(timer === undefined){
  //   requestAnimationFrame(mainloop);
  // }
  console.log(timer);
  // timer = requestAnimationFrame(mainloop);
  // cancelAnimationFrame(timer);
  ctx.clearRect(0, 0, canvas.width, canvas.height);


  for (const ball of balls) {
    ball.updatePhysics();
    ball.drawBall();
    ball.drawPoints();
    // ball.fitCircle();
    ball.display();
  }


}

class Ball {
  constructor(x, y, r) {
    this.pos = new Vector(x,y);
    this.r = r;
    this.velo = new Vector(0, 0);
    this.acce = new Vector(0, 0);
    this.acceleration = 1;
    this.isDragging = false;
    this.isMoving = false;
    this._latest_points = [];
    this.a_r = 0;
    this.prev_acce_vector = new Vector(0,0);
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
    for (const _x_y of this._latest_points){
      ctx.arc(_x_y[0], _x_y[1], 10 , 0, 2*Math.PI);
    }
    ctx.strokeStyle = "orange";
    ctx.stroke();
    ctx.closePath();
  }

  display(){
    this.velo.drawVec(550, 400, 10, "green");
    this.acce.unit().drawVec(550, 400, 50, "blue");
    
    ctx.beginPath();
    ctx.arc(550, 400, 50, 0, 2*Math.PI);
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

  updatePhysics() {
    cancelAnimationFrame(timer);
    if (this.isDragging) {
      // debugger;
      const temp = calculateDifferencesAndMean(this._latest_points);
      var centripetalVeloChange;
      if(Math.abs(temp.deltaX) < epsilon && Math.abs(temp.deltaY) < epsilon){
        this.acce.x = this.acce.y = 0;
        centripetalVeloChange = new Vector(0,0);
      } else {

        //TODO: DECREASE the number of calculation
          
          this.acce.x = temp.deltaX * this.acceleration;
          this.acce.y = temp.deltaY * this.acceleration;

          // console.log(cal_Angle_V(this.prev_acce_vector, this.acce));
          this.prev_acce_vector = this.acce.copy();

          this.velo = this.velo.add(this.acce).mult(1 - friction);

          // console.log(this.velo);

        // if (this.velo.mag() > 0 && (this.a_r > epsilon && this.a_r < 2000)) {
          

        //   //TODO: this reaches the infinity, the 
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
      this.velo = this.velo.mult(1 - friction);
      
      if (this.velo <= epsilon){
        if(this.velo.mag() !== 0){
          this.velo = new Vector(0,0);
          this.isMoving = false;
        } 
      } else {
        this.pos = this.pos.add(this.velo);
      }
  

      // Check for collision with canvas borders
      this.handleWallCollision();

      // Check for collision with other balls
      for (const otherBall of balls) {
        if (this !== otherBall) {
          // this.handleBallCollision(otherBall);
        }
      }
    }

    if (balls.some(ball => ball.isMoving || ball.isDragging)) {
      timer = requestAnimationFrame(mainloop);
    }


  }

  handleWallCollision() {
    if (this.pos.x < this.r || this.pos.x > canvas.width - this.r) {
      this.velo.x *= -1; // Reverse velocity on collision with horizontal borders
    }
    if (this.pos.y < this.r || this.pos.y > canvas.height - this.r) {
      this.velo.y *= -1; // Reverse velocity on collision with vertical borders
    }
  }

  // handleBallCollision(otherBall) {
  //   const distance = this.pos.subtr(otherBall.pos).mag();
  //   const combinedRadius = this.r + otherBall.r;

  //   if (distance < combinedRadius) {
  //     // Collision detected, update velocities for both balls
  //     let normal = this.pos.subtr(otherBall.pos).unit();
  //     let relativeVelocity = this.velo.subtr(otherBall.velo);

  //     const impulse =
  //       (2 * relativeVelocity.dot(normal)) /
  //       (1 / this.mass + 1 / otherBall.mass);

  //     this.velo = this.velo.subtr(normal.mult(impulse / this.mass));
  //     otherBall.velo = otherBall.velo.add(normal.mult(impulse / otherBall.mass));

  //     // Move balls away from each other to prevent sticking
  //     const overlap = combinedRadius - distance;
  //     const moveVec = normal.mult(overlap / 2);

  //     this.pos = this.pos.add(moveVec);
  //     otherBall.pos = otherBall.pos.subtr(moveVec);
  //   }
  // }

  fitCircle() {
    // Check if we have enough points (at least 3)
    if (this._latest_points.length < 3) {
      return;
      console.error("Insufficient points to fit a circle");
      // return null;
    }

    let meanX = 0;
    let meanY = 0;
    for (let i = 0; i < this._latest_points.length; i++) {
      meanX += this._latest_points[i][0];
      meanY += this._latest_points[i][1];
    }
  
    meanX /= this._latest_points.length;
    meanY /= this._latest_points.length;
  
    // Initialize variables for the least squares method
    let sumX = 0;
    let sumY = 0;
    let sumX2 = 0;
    let sumY2 = 0;
    let sumXY = 0;
    let sumX3 = 0;
    let sumY3 = 0;
    let sumX2Y = 0;
    let sumXY2 = 0;
  
    // Calculate the necessary sums
    for (let i = 0; i < this._latest_points.length; i++) {
      let x = (this._latest_points[i][0] - meanX);
      let y = (this._latest_points[i][1] - meanY);
  
      sumX += x;
      sumY += y;
      sumX2 += x * x;
      sumY2 += y * y;
      sumXY += x * y;
      sumX3 += x * x * x;
      sumY3 += y * y * y;
      sumX2Y += x * x * y;
      sumXY2 += x * y * y;
    }

    const A = [
      [sumX2, sumXY, sumX],
      [sumXY, sumY2, sumY],
      [sumX, sumY, this._latest_points.length]
    ];

    
  
    // Calculate coefficients for the circle equation
    let N = this._latest_points.length;
    let D = N * sumX2 - sumX * sumX;
  
    // Calculate circle parameters
    const B = [sumX * meanX + sumY * meanY, sumX2 * meanY - sumY * meanX, sumX * meanY - sumY2 * meanX];

    let svdResult = SVDJS.SVD(A);

    const solution = svdResult.v.map((row, i) => svdResult.u.map(col => col[i]).reduce((acc, val, j) => acc + val * B[j], 0));


    let a = solution[0];
    let b = solution[1];
    let c = solution[2];
    this.a_r = Math.sqrt(a * a + b * b - 4 * c) / 2;
    //because the number is too big
    //TODO: put a logistic function in it range from 0 to 30
    // this.a_r = Math.sqrt(this.a_r);
    if(D == 0){
      this.a_r = 0;
    } else if(isNaN(this.a_r)){
      this.a_r = 0;
    }
    // console.log(N,D,a,b,c);
    // console.log(svdResult);

    
    // console.log("Predicted Radius:", this.a_r);

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

  normal(){
    return new Vector(-this.y, this.x).unit();
  }

  copy(){
    return new Vector(this.x, this.y);
  }


  unit(){
    if(this.mag() === 0){
        return new Vector(0,0);
    } else {
        return new Vector(this.x/this.mag(), this.y/this.mag());
    }
  }

  drawVec(start_x, start_y, n, color){
    ctx.beginPath();
    ctx.moveTo(start_x, start_y);
    ctx.lineTo(start_x + this.x * n, start_y + this.y * n);
    ctx.strokeStyle = color;
    ctx.stroke();
    ctx.closePath();
  }

  dot(v1){
    return this.x * v1.x + this.y * v1.y;
  } 
}

// function 
function calculateDifferencesAndMean(points) {
  const differences = [];

  // Calculate differences between consecutive points
  for (let i = 1; i < points.length; i++) {
    const deltaX = points[i][0] - points[i - 1][0];
    const deltaY = points[i][1] - points[i - 1][1];


    differences.push({
      deltaX,
      deltaY
    });
  }

  // Calculate the mean of differences
  const meanDifference = differences.reduce(
    (sum, diff) => {
      sum.deltaX += diff.deltaX;
      sum.deltaY += diff.deltaY;
      return sum;
    },
    { deltaX: 0, deltaY: 0}
  );

  // console.log(meanDifference);

  // Divide by the number of differences to get the mean
  const numDifferences = differences.length || 1; // Avoid division by zero
  meanDifference.deltaX /= numDifferences;
  meanDifference.deltaY /= numDifferences;

  return meanDifference;
}


function mousectrl() {
  canvas.addEventListener("mousedown", function (event) {
    // console.log("Mouse down event");
    // cancelAnimationFrame(timer);
    const mouseX = event.clientX - canvas.getBoundingClientRect().left;
    const mouseY = event.clientY - canvas.getBoundingClientRect().top;

    for (const ball of balls) {
      const distance = Math.sqrt(
        (mouseX - ball.pos.x) ** 2 + (mouseY - ball.pos.y) ** 2
      );
      if (distance < ball.r) {
        ball.isDragging = true;
        ball.isMoving = true;
        ball.addPosition(ball.pos.x, ball.pos.y); 
        movingBall = ball;
        timer = requestAnimationFrame(mainloop);
        // startTime = new Date().getTime();   
        break;
      }
    }
    // clearInterval(intervalId);

    if(movingBall == null){
      return;
    } else {
      if(intervalId === null){
        intervalId = setInterval(function () {
          movingBall.addPosition(movingBall.pos.x, movingBall.pos.y);
    
          if (movingBall._latest_points.length >= 3){
            movingBall.fitCircle();
          }
            
          // console.log(movingBall.pos.x, movingBall.pos.y, (new Date().getTime() - startTime) / 1000);
        }, 25);      
      }
          
    }
    // console.log(_latest_points.toString());
      
  });

  canvas.addEventListener("mousemove", _.throttle(function (event) {
    // console.log()
    
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

    if (balls.some(ball => ball.isMoving || ball.isDragging)) {
      timer = requestAnimationFrame(mainloop);
    }

  }, 60));

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

  document.addEventListener("DOMContentLoaded", function () {
  // Your initialization code here
  // For example, creating balls and setting up the canvas
  let b1 = new Ball(200, 200, 30);
  let b2 = new Ball(150, 100, 20);
  mouseForce = 0.1;
  friction = 0.04;
  // Start the animation loop
    console.log("loaded");
    timer = requestAnimationFrame(mainloop);
  });
}

// Add event listeners
function calculateAngle(x, y) {
  // Use Math.atan2 to calculate the angle in radians
  const angleRadians = Math.atan2(y, x);

  // Convert radians to degrees if needed
  const angleDegrees = (angleRadians * 180) / Math.PI;

  return angleDegrees;
}

function cal_Angle_V(vx,vy){
  const dot = vx.dot(vy);
  const magx = vx.mag();
  const magy = vy.mag();

  if (magx === 0 || magy === 0) {
    // console.error("Cannot calculate angle with zero-length vector.");
    return 0;
  }

  const cosTheta = dot / (magx * magy);
  
  const theta = Math.acos(cosTheta);
  // console.log(vx,vy, cosTheta, theta);

  if (isNaN(theta)){
    return 0;
  }

  return theta * 180 / Math.PI;
}

function distance(x, y){
  return Math.sqrt(x ** 2 + y ** 2);
}


mousectrl();
// requestAnimationFrame(mainloop);


//TODO: fix this, start this 

//       //TODO: Check for collision with other balls
//       for (const otherBall of balls) {
//         if (ball !== otherBall) {
//           const distance = Math.sqrt(
//             (ball.x - otherBall.x) ** 2 + (ball.y - otherBall.y) ** 2
//           );
//           const combinedRadius = ball.radius + otherBall.radius;

//           if (distance < combinedRadius) {
//             // Collision detected, update velocities for both balls
//             const angle = Math.atan2(
//               otherBall.y - ball.y,
//               otherBall.x - ball.x
//             );
//             const magnitude1 = Math.sqrt(ball.vx ** 2 + ball.vy ** 2);
//             const magnitude2 = Math.sqrt(otherBall.vx ** 2 + otherBall.vy ** 2);

//             const direction1 = Math.atan2(ball.vy, ball.vx);
//             const direction2 = Math.atan2(otherBall.vy, otherBall.vx);

//             const newVx1 = magnitude1 * Math.cos(direction1 - angle);
//             const newVy1 = magnitude1 * Math.sin(direction1 - angle);
//             const newVx2 = magnitude2 * Math.cos(direction2 - angle);
//             const newVy2 = magnitude2 * Math.sin(direction2 - angle);

//             const finalVx1 =
//               ((ball.radius - otherBall.radius) * newVx1 +
//                 2 * otherBall.radius * newVx2) /
//               (ball.radius + otherBall.radius);
//             const finalVx2 =
//               (2 * ball.radius * newVx1 +
//                 (otherBall.radius - ball.radius) * newVx2) /
//               (ball.radius + otherBall.radius);

//             ball.vx =
//               Math.cos(angle) * finalVx1 +
//               Math.cos(angle + Math.PI / 2) * newVy1;
//             ball.vy =
//               Math.sin(angle) * finalVx1 +
//               Math.sin(angle + Math.PI / 2) * newVy1;

//             otherBall.vx =
//               Math.cos(angle) * finalVx2 +
//               Math.cos(angle + Math.PI / 2) * newVy2;
//             otherBall.vy =
//               Math.sin(angle) * finalVx2 +
//               Math.sin(angle + Math.PI / 2) * newVy2;

//             // Move balls away from each other to prevent sticking
//             const overlap = combinedRadius - distance;
//             const moveX = (overlap / 2) * Math.cos(angle);
//             const moveY = (overlap / 2) * Math.sin(angle);

//             ball.x -= moveX;
//             ball.y -= moveY;
//             otherBall.x += moveX;
//             otherBall.y += moveY;
//           }
//         }
//       }
//     }
//   }
// }

// export default api;