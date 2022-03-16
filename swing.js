let canvas;
let ctx;

let width = 0.8*window.innerWidth;
let height = 0.8*window.innerHeight;

let t=0.01;
let g=100;

let flyTimer, swingTimer, gunTimer;

let bgr={x:0,y:0};
let ball={x:0,y:height,xSPeed:0,ySpeed:0,color:"green"};
let gun={x:0, y:height, angle:1.75*Math.PI, power:20, up:true};
let level = {current:0, reach:1, total:4}
let goal;

let play, choosingLevel;
let launch, swing;
let closest;

function object(x1,y1){
	this.x = x1;
	this.y = y1;
}

function tele(x11,y11,x21,y21,crossed){
	this.x1=x11;
	this.y1=y11;
	this.x2=x21;
	this.y2=y21;
	this.cross = crossed;
}

let pivots;
let traps;
let teles;

let score=[0,0,0,0];
let highScore=[0,0,0,0];

function drawStart(){
	ctx.clearRect(0,0,width,height);
	ctx.fillStyle = "#484848";
	ctx.fillRect(0,0,width,height);
	ctx.font = width/7 + 'px Cursive';
	ctx.fillStyle = "cyan";
	ctx.textAlign = "center";
	ctx.fillText("SWING",width/2,height/2);
}

function drawLevels(hover,choosed){
	let levelHover = hover;
	ctx.clearRect(0,0,width,height);
	ctx.fillStyle = "#484848";
	ctx.fillRect(0,0,width,height);
	if(!choosed){
		ctx.fillStyle="cyan";
		ctx.fillText("Levels",width/2,height/4);
	}else{
		ctx.fillStyle="red";
		ctx.fillText("Choose Again",width/2,height/4);
	}
	let side = width/(level.total*2+1);
	ctx.font = side + 'px Cursive';
	for(let i=0;i<level.total;i++){
		ctx.save();
		ctx.translate(side*(2*i+1),height/2);
		if(i===levelHover){
			ctx.fillStyle="black";
			ctx.fillRect(0,0,side,side);
			if(i+1>level.reach)
				ctx.fillStyle="red";
			else
				ctx.fillStyle="cyan";
			ctx.fillText(i+1,side/2,width/(level.total*2+2));
		}else{
			if(i+1>level.reach)
				ctx.fillStyle="red";
			else
				ctx.fillStyle="cyan";
			ctx.fillRect(0,0,side,side);
			ctx.fillStyle="black";
			ctx.fillText(i+1,side/2,width/(level.total*2+2));
		}
		ctx.restore();
		
		if(i<level.reach){
			ctx.save()
				ctx.translate(side*(2*i+1),height/2+1.2*side);
				for(let j=0;j<highScore[i];j++){
					drawStar(5,'cyan',0.4*side*j+width/100,0);
				}
			ctx.restore();
		}
	}
}

function drawSideTrap(x1,x2){
	let side = width/100;
	for(let i=0;i<(x2-x1)/side;i++){
		ctx.fillStyle= "black";
		ctx.save();
		ctx.translate(x1+side*i,0);
		ctx.beginPath();
		ctx.moveTo(0,0);
		ctx.lineTo(side/2,side/2);
		ctx.lineTo(side,0);
		ctx.closePath();
		ctx.fill();
		ctx.restore();
		ctx.save();
		ctx.translate(x1+side*i,height);
		ctx.beginPath();
		ctx.moveTo(0,0);
		ctx.lineTo(side/2,-0.5*side);
		ctx.lineTo(side,0);
		ctx.closePath();
		ctx.fill();
		ctx.restore();
	}
}

function drawGoal(){
	let side = width/50;
	ctx.save();
	ctx.translate(goal-bgr.x,0);
	for(let i=0;i<width/5/side;i++){
		for(let j=0; j<height/side; j++){
			if((i+j)%2===0)
				ctx.fillStyle="black";
			else
				ctx.fillStyle="yellow";
			ctx.fillRect(side*i,side*j,side,side);
		}
	}
	ctx.restore();
}

function drawGun(){
	let side = width/10;
	ctx.save();
	ctx.translate(gun.x-bgr.x,height);
	ctx.clearRect(0,0,side,-1*side);
	ctx.fillStyle="yellow";
	ctx.strokeStyle="green";
	ctx.beginPath();
	ctx.moveTo(0,0);
	ctx.lineTo(0,-side);
	ctx.arc(0,0,side,1.5*Math.PI,0);
	ctx.lineTo(0,0);
	ctx.fill();
	ctx.moveTo(0,0);
	ctx.lineTo(side*Math.cos(gun.angle),side*Math.sin(gun.angle));
	ctx.stroke();
	ctx.beginPath();
	ctx.fillStyle="green";
	ctx.moveTo(0,0);
	ctx.lineTo(0,-0.01*side*gun.power);
	ctx.arc(0,0,0.01*side*gun.power,1.5*Math.PI,0);
	ctx.lineTo(0,0);
	ctx.fill();
	ctx.restore();
}

function drawEllipse(x,y,cross){
	if(cross)
		ctx.fillStyle="brown";
	else
		ctx.fillStyle="orange";
	ctx.beginPath();
	ctx.ellipse(x,y,width/200,height/25,0,0,2*Math.PI);
	ctx.fill();
}

function drawStar(spikes,color,x1,y1){
	let outerRadius=width/100;
	let innerRadius=width/200;
	let rot=1.5*Math.PI;
	let step=Math.PI/spikes;
	let x = x1;
	let y = y1;
	ctx.save();
	ctx.beginPath();
	ctx.moveTo(x1,y1-outerRadius);
	for(let j=0;j<spikes;j++){
		x=x1+Math.cos(rot)*outerRadius;
		y=y1+Math.sin(rot)*outerRadius;
		ctx.lineTo(x,y);
		rot+=step;
		x=x1+Math.cos(rot)*innerRadius;
		y=y1+Math.sin(rot)*innerRadius;
		ctx.lineTo(x,y);
		rot+=step;
	}
	ctx.lineTo(x1,y1-outerRadius);
	ctx.closePath();
	ctx.fillStyle=color;
	ctx.fill();
	ctx.restore();
}

function drawCircle(x,y,radius){
	ctx.beginPath();
	ctx.arc(x,y,radius,0,2*Math.PI);
	ctx.fillStyle=ball.color;
	ctx.fill();
}

function drawString(){
	ctx.save();
	ctx.strokeStyle=ball.color;
	ctx.beginPath();
	ctx.moveTo(pivots[closest].x-bgr.x,pivots[closest].y-bgr.y);
	ctx.lineTo(ball.x-bgr.x,ball.y-bgr.y);
	ctx.stroke();
	ctx.restore();
}

function draw(){
	if(goal-bgr.x<width){
		ctx.clearRect(0,0,goal-bgr.x,height);
		drawGoal();
	}else
		ctx.clearRect(0,0,width,height);
	
	if(bgr.x<width/10){
		drawSideTrap(width/10-bgr.x,width);
		drawGun();
	}else{
		if(goal-bgr.x>width)
			drawSideTrap(0,width);
		else
			drawSideTrap(0,goal-bgr.x);
	}
	
	for(let i=0; i<pivots.length; i++){
		drawCircle(pivots[i].x-bgr.x,pivots[i].y-bgr.y,width/500);
	}
	for(let i=0; i<traps.length; i++){
		drawStar(8,'red',traps[i].x-bgr.x,traps[i].y-bgr.y);
	}
	for(let i=0; i<stars.length; i++){
		drawStar(5,'blue',stars[i].x-bgr.x,stars[i].y-bgr.y);
	}
	for(let i=0; i<teles.length; i++){
		drawEllipse(teles[i].x1-bgr.x,teles[i].y1-bgr.y,teles[i].cross);
		drawEllipse(teles[i].x2-bgr.x,teles[i].y2-bgr.y,teles[i].cross);
	}
	
	if(launch)
		drawCircle(ball.x-bgr.x,ball.y-bgr.y,width/100);
	if(swing)
		drawString();
}

function level1(){
	let temp;
	temp = new object(0.3*width,0.65*height);
	stars.push(temp);
	temp = new object(0.6*width,0.52*height);
	stars.push(temp);
	temp = new object(0.9*width,0.6*height);
	stars.push(temp);
	score[0]=0;
	goal=width;
}

function level2(){
	let temp;
	for(let i=1; i<10; i++){
		temp = new object(0.2*width*i,0.2*height);
		pivots.push(temp);
	}
	for(let i=0; i<10; i++){
		temp = new object(0.2*width*i+0.1*width,0.6*height);
		traps.push(temp);
	}
	for(let i=0; i<10; i++){
		temp = new object(0.2*width*i+0.1*width,0.4*height);
		traps.push(temp);
	}
	for(let i=0; i<10; i++){
		temp = new object(0.2*width*i+0.15*width,0.8*height);
		traps.push(temp);
	}
	temp = new object(0.125*width,0.7*height);
	stars.push(temp);
	temp = new object(0.9*width,0.2*height);
	stars.push(temp);
	temp = new object(1.75*width,0.5*height);
	stars.push(temp);
	score[1]=0;	
	goal=2*width;
}

function level3(){
	let temp;
	temp = new tele(0.25*width,0.25*height,0.5*width,0.9*height,false);
	teles.push(temp);
	temp = new tele(0.25*width,0.5*height,0.5*width,0.5*height,false);
	teles.push(temp);
	temp = new tele(0.25*width,0.75*height,0.5*width,0.1*height,false);
	teles.push(temp);
	temp = new tele(0.75*width,0.25*height,width,0.05*height,false);
	teles.push(temp);
	temp = new object(1.05*width,0.05*height);
	stars.push(temp);
	temp = new object(1.1*width,0.05*height);
	stars.push(temp);
	temp = new object(1.15*width,0.05*height);
	stars.push(temp);
	for(let i=0;i<height/0.02/width-1;i++){
		temp = new object(0.3*width,0.02*width*(i+0.75));
		traps.push(temp);
	}
	score[2]=0;
	goal=1.2*width;
}

function level4(){
	let temp;
	for(let i=0;i<height/width/0.03;i++){
		temp = new object(0.25*width+i*0.01*width,height-0.02*width*(i+0.75));
		traps.push(temp);
	}
	for(let i=0;i<height/width/0.02;i++){
		temp = new object(0.85*width+i*0.01*width,height-0.02*width*(i+0.75));
		traps.push(temp);
	}
	for(let i=0;i<height/2/0.02/width;i++){
		temp = new object(1.375*width,0.02*width*(i+0.75));
		traps.push(temp);
	}
	temp = new object(0.3*width,0.1*height);
	pivots.push(temp);
	temp = new object(0.65*width,0.5*height);
	pivots.push(temp);
	temp = new object(1.25*width,0.5*height);
	pivots.push(temp);
	temp = new tele(0.55*width,0.2*height,0.85*width,0.2*height,false);
	teles.push(temp);
	temp = new tele(0.15*width,0.15*height,0.85*width,0.8*height,false);
	teles.push(temp);
	temp = new tele(0.45*width,0.8*height,1.25*width,0.25*height,false);
	teles.push(temp);
	temp = new object(0.175*width,0.15*height);
	stars.push(temp);
	temp = new object(0.475*width,0.8*height);
	stars.push(temp);
	temp = new object(1.25*width,0.75*height);
	stars.push(temp);
	score[3]=0;
	goal=1.5*width;
}

function stop(){
	if(launch){
		if(swing)
			clearInterval(swingTimer);
		else
			clearInterval(flyTimer);
	}else
		clearInterval(gunTimer);
	choosingLevel=false;
	play=false;
	launch=false;
	swing=false;
	pivots = [];
	traps = [];
	stars = [];
	teles = [];
	ball.color="green";
	ball.x=0;
	ball.y=height;
	ball.xSpeed=0;
	ball.ySpeed=0;
	bgr.x=0;
	bgr.y=0;
	gun.angle=1.75*Math.PI;
	gun.power=20;
}

function start(){
	ctx.clearRect(0,0,width,height);
	play=true;
	switch(level.current){
		case 2:
			level2();
			break;
		case 3:
			level3();
			break;
		case 4:
			level4();
			break;
		default:
			level1();
	}
	if(level.reach===1)
		document.getElementById("play").innerHTML = "Play Game";
	else{
		if(level.reach>level.current)
			document.getElementById("play").innerHTML = "Next";
		else
			document.getElementById("play").innerHTML = "Previous";
	}
	draw();
}

function lose(){
	ball.color="red";
	draw();
	stop();
	document.getElementById("play").innerHTML = "Try Again";
	score[level.current-1] = 0;
}

function win(){
	ball.color="yellow";
	draw();
	stop();
	if(score[level.current-1]>highScore[level.current-1])
		highScore[level.current-1]=score[level.current-1];
	if(level.current==level.reach){
		if(level.reach<4){
			level.reach++;
			document.getElementById("play").innerHTML = "Next";
		}else{
			if(level.current===level.reach){
				document.getElementById("play").innerHTML = "Play Again";
				level.current=1;
			}else{
				document.getElementById("play").innerHTML = "Next";
			}
		}
	}
	let cheers;
	switch(score[level.current-1]){
		case 1:
			cheers="Nice";
			break;
		case 2:
			cheers="Awesome";
			break;
		case 3:
			cheers="Perfect";
			break;
		default:
			cheers="Good Job";
	}
	if(document.getElementById("play").innerHTML==="Play Again")
		cheers="You win";
	document.getElementById("board").innerHTML = "<span style='font-size:"+width/20+"px'>"+cheers+"</span>";
}

function xBorder(){
	if(play){
		if((ball.x>width/2)&&(bgr.x<(goal-0.8*width)))
			bgr.x = ball.x-width/2;
		if(ball.x>goal)
			win();
		if(ball.x<-width/200)
			lose();
	}
}

function yBorder(){
	if(play){
		if(ball.y<width*3/200||ball.y>height-width*3/200)
			lose();
	}
}

function hit(){
	if(play){
		for(let i=0;i<traps.length;i++){
			let distance = Math.sqrt((ball.x-traps[i].x)*(ball.x-traps[i].x)
			+(ball.y-traps[i].y)*(ball.y-traps[i].y));
			distance -= 0.01*width;
			if(distance<0.01*width)
				lose();
		}
		for(let i=0;i<stars.length;i++){
			let distance = Math.sqrt((ball.x-stars[i].x)*(ball.x-stars[i].x)
			+(ball.y-stars[i].y)*(ball.y-stars[i].y));
			distance -= 0.01*width;
			if(distance<0.01*width){
				stars.splice(i,1);
				score[level.current-1]++;
			}
		}
		for(let i=0;i<teles.length;i++){
			if(!teles[i].cross&&
			teles[i].x1-ball.x<0.005*width&&teles[i].x1-ball.x>-0.005*width&&
			teles[i].y1-ball.y<0.04*height&&teles[i].y1-ball.y>-0.04*height)
			{
				if(swing){
					clearInterval(swingTimer);
					swing=false;
					flyTime();
				}
				ball.x=teles[i].x2;
				ball.y=teles[i].y2;
				teles[i].cross=true;
				if(ball.x>goal-0.5*width)
					bgr.x=goal-0.8*width;
			}
			if(!teles[i].cross&&
			teles[i].x2-ball.x<0.005*width&&teles[i].x2-ball.x>-0.005*width&&
			teles[i].y2-ball.y<0.04*height&&teles[i].y2-ball.y>-0.04*height)
			{
				if(swing){
					clearInterval(swingTimer);
					swing=false;
					flyTime();
				}
				ball.x=teles[i].x1;
				ball.y=teles[i].y1;
				teles[i].cross=true;
				if(ball.x>goal-0.5*width)
					bgr.x=goal-0.8*width;
			}
		}
	}
}

function flyTime(){
	flyTimer = setInterval(function(){
		ball.x += ball.xSpeed*t;
		ball.y += ball.ySpeed*t + 0.5**g*t*t;
		ball.ySpeed += g*t;
		draw();
		yBorder();
		xBorder();
		hit();
	},1);
}

function swingTime(){
	let distance;
	for(let i=0; i<pivots.length; i++){
		let currentDistance = Math.sqrt((ball.x-pivots[i].x)*(ball.x-pivots[i].x)
		+(ball.y-pivots[i].y)*(ball.y-pivots[i].y));
		if(i===0){
			closest=i;
			distance=currentDistance;
			}else{
				if(currentDistance < distance){
					closest=i;
					distance = currentDistance;
				}
			}
	}
	let angle = Math.atan2(ball.x-pivots[closest].x,ball.y-pivots[closest].y);
	let	speed = ball.xSpeed*Math.cos(angle)-ball.ySpeed*Math.sin(angle);
	let aSpeed = speed/distance;
	let aAcc;
	swingTimer=setInterval(function() {
		aAcc = -0.01*g*Math.sin(angle);
		angle += 2*aSpeed*t + 2*aAcc*t*t;
		aSpeed += aAcc*2*t;
		if(angle>Math.PI)
			angle -= 2*Math.PI;
		if(angle<Math.PI)
			angle += 2*Math.PI;
		speed = aSpeed*distance;
		ball.xSpeed = speed*Math.cos(angle);
		ball.ySpeed = -1*speed*Math.sin(angle);	
		ball.x = pivots[closest].x + distance*Math.sin(angle);
		ball.y = pivots[closest].y + distance*Math.cos(angle);
		draw();
		yBorder();
		xBorder();
		hit();
	},1);
}

function playGame(){
	stop();
	switch(document.getElementById("play").innerHTML){
		case "Previous":
			level.current--;
			break;
		case "Next":
			level.current++;
			break;
		case "Try Again":
			break;
		case "Play Again":
			level.current=1;
			break;
		default:
			level.current=1;
			level.reach=4;
	}
	document.getElementById("board").innerHTML = "<span style='font-size:"+width/15+"px'>Level "+level.current+"</span>";
	start();
}

function chooseLevel(){
	stop();
	choosingLevel=true;
	drawLevels(-1,false);
	
	let wrongChoice = false;
	
	let side = width/(level.total*2+1);
	canvas.addEventListener("mousemove", function(e){
		e.preventDefault();
		if(choosingLevel){
			for(let i=0; i<level.total; i++){
				if(e.offsetX>side*(2*i+1)&&e.offsetX<side*(2*i+2)
				&&e.offsetY>height/2&&e.offsetY<height/2+side){
					drawLevels(i,wrongChoice);
					break;
				}else
					drawLevels(-1,wrongChoice);
			}
		}
	});
	canvas.addEventListener("click", function(e){
		e.preventDefault();
		if(choosingLevel){
			let clicked=false;
				for(let i=0; i<level.total; i++){
					if(e.offsetX>side*(2*i+1)&&e.offsetX<side*(2*i+2)
					&&e.offsetY>height/2&&e.offsetY<height/2+side){
						if(i+1>level.reach){
							wrongChoice=true;
							drawLevels(i,wrongChoice);
						}else{
							clicked=true;
							level.current=i+1;
							break;
						}
					}
				}
			if(clicked){
				document.getElementById("board").innerHTML = "<span style='font-size:"+width/15+"px'>Level "+level.current+"</span>";
				stop();
				start();
			}
		}
	});
}

function restartGame(){
	stop();
	if(level.current===0)
		level.current=1;
	document.getElementById("board").innerHTML = "<span style='font-size:"+width/15+"px'>Level "+level.current+"</span>";
	start();
}

function setup(){
	canvas = document.getElementById("surface");
	ctx = canvas.getContext("2d");
	ctx.canvas.width  = width;
	ctx.canvas.height = height;
	play=false;
	drawStart();
	
	canvas.addEventListener("mousemove", function(e){
		e.preventDefault();
		if(!launch&&play){
			gun.angle = Math.atan2((e.offsetY-gun.y),(e.offsetX-gun.x));
			if(gun.angle/Math.PI>-0.45&&gun.angle/Math.PI<-0.05){
				draw();
			}
		}
		
	});
	canvas.addEventListener("mousedown", function(e){
		e.preventDefault();
		if(play){
			if(!launch){
				gun.power = 20;
				gunTimer = setInterval(function(){
					if(gun.power===20)
						gun.up=true;
					if(gun.power===100)
						gun.up=false;
					if(gun.up)
						gun.power++;
					else
						gun.power--;
					draw();
			},10);
			}else{
				if(pivots.length>0){
					swing=true;
					clearInterval(flyTimer);
					swingTime();
				}
				}
			}
	});
	canvas.addEventListener("mouseup",function(e) {
		e.preventDefault();
		if(play){
			if(!launch){
				clearInterval(gunTimer);
				launch=true;
				ball.x+=100*Math.cos(gun.angle);
				ball.y+=100*Math.sin(gun.angle);
				ball.xSpeed = 5*gun.power*Math.cos(gun.angle);
				ball.ySpeed = 5*gun.power*Math.sin(gun.angle);	
				flyTime();
			}
			if(swing){
				clearInterval(swingTimer);
				swing=false;
				flyTime();
			}
		}
	});
}
