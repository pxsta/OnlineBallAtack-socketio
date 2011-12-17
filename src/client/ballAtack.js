var BallClass = function(my){
    var that={};
    my=my||{};

    my.position=my.position||{x:0,y:0};
    my.acceleration=my.acceleration||{x:0,y:0};
    my.speed =my.speed||{x:0,y:0};    
    my.weight=my.weight||1;
    my.radius=my.radius||50;
    my.color=my.color||{r:128,g:100,b:162,a:0.7};
    my.socketID=my.socketID||0;
    my.playerName=my.playerName||'';
    my.surviveTime = my.surviveTime||0;
    my.isFall=my.isFall||false;
    
    that.updateValue = function(value){
        my.position=value.position||my.position;    
        my.speed =value.speed||    my.speed;
        my.acceleration=value.acceleration||my.acceleration;
        my.weight=value.weight||my.weight;
        my.radius=value.radius||my.radius;
        my.color=value.color||my.color;
        my.socketID=value.socketID||my.socketID;
        my.playerName=value.playerName||my.playerName;
        my.isFall =value.isFall||my.isFall;
        my.surviveTime=value.surviveTime||my.surviveTime;
    };
    that.getPosition = function(){
        return my.position;
    };
    that.setPosition = function(x,y){
        my.position.x=x;
        my.position.y=y;
    };
    that.getSpeed =function(){
        return my.speed;
    };
    that.setSpeed=function(speed){
        my.speed=speed;
    };
    that.getAcceleration = function(){
        return my.acceleration;
    }
    that.setAcceleration = function(acceleration){
        my.acceleration=acceleration;
    }
    that.getWeight = function(){
        return my.weight;
    };
    that.setWeight= function(weight){
        my.weight= weight;
    };
    that.getRadius = function(){
        return my.radius;
    };
    that.setRadius= function(radius){
        my.radius= radius;
    };    
    that.getColor = function(){
        return my.color;
    };
    that.setColor= function(color){
        my.color= color;
    };
    that.getSocketID =function(){
        return my.socketID;
    };
    that.setSocketID =function(socketID){
        my.socketID= socketID;
    };
    
    that.getPlayerName = function(){
        return my.playerName;
    };
    that.setPlayerName= function(playerName){
        my.playerName= playerName;
    };
    that.setIsFall = function(isFall){
        my.isFall = isFall;
    };
    that.getIsFall = function(){
        return my.isFall;
    };
    that.setSurviveTime = function(time){
        my.surviveTime = time;
    };
    that.getSurviveTime = function(){
        return my.surviveTime;
    };
    that.draw = function(ctx,offset){
        var position = my.position;
        if(offset==undefined){
            offset={x:0,y:0};
        }
        
        ctx.save();
        ctx.beginPath();
        ctx.fillStyle = "".Format('rgba({0}, {1}, {2}, 0.7)',my.color.r,my.color.g,my.color.b);
        //オフセットを考慮して描写する(カメラの代わり)　
        ctx.arc(position.x-offset.x,position.y-offset.y, my.radius, 0,2 * Math.PI, true);
        ctx.fill();
        
        ctx.font = "20px 'MSPゴシック'";
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillText("Name:"+decodeURI(my.playerName), position.x-offset.x,position.y-offset.y-40);
        ctx.fillText("Time:"+my.surviveTime, position.x-offset.x,position.y-offset.y-20);
        if(DEBUG){
            ctx.fillText("ID:"+my.socketID, position.x-offset.x,position.y-offset.y);
            ctx.fillText("x:"+position.x+" y:"+position.y, position.x-offset.x,position.y-offset.y+20);
        }
        ctx.restore();
    };
    return that;
};
var BallListClass = function(my){
    var that={};
    my=my||{};
    
    my.ballList={};
    
    that.add=function(ball){
        if(ball.getSocketID() in my.ballList){
            return false;
        }
        else{
            my.ballList[ball.getSocketID()]=ball;
            return true;
        }
    };
    that.remove = function(socketID){
        if(socketID in my.ballList){
            delete my.ballList[socketID];
            return true;
        }
        else{
            return false;
        }    
    };
    that.hasBall = function(socketID){
        for(var i in my.ballList){
            if(my.ballList.hasOwnProperty(i)){
                if(my.ballList[i].getSocketID()==socketID){
                    return true;
                }
            }
        }
        return false;
    };
    that.draw = function(ctx,offset){
        for(var i in my.ballList){
              if (my.ballList.hasOwnProperty(i)){
                   my.ballList[i].draw(ctx,offset);
                }
        }
    };
    that.get=function(socketID){
        for(var i in my.ballList){
            if(my.ballList.hasOwnProperty(i)){
                if(my.ballList[i].getSocketID()==socketID){
                    return my.ballList[i];
                }
            }
        }
        return null;
    };
    that.toArray = function(){
        var array=[];
        for(var i in my.ballList){
            if(my.ballList.hasOwnProperty(i)){
                array.push(my.ballList[i]);
            }
        }
        return array;
    };
    return that;
};


var MapClass = function(my){
    var that = {};
    my = my || {};
    
    my.position=my.position||{x:0,y:0};    
    my.radius=my.radius||500;
    my.color=my.color||{r:0,g:0,b:0,a:0.7};
    
    that.getPosition = function(){
        return my.position;
    };

    that.getRadius = function(){
        return my.radius;
    };
    that.getColor = function(){
        return my.color;
    };
    
    that.draw = function(ctx,offset){
        var position = my.position;
        if(offset==undefined){
            offset={x:0,y:0};
        }
        
       ctx.save();
       ctx.beginPath();
       ctx.fillStyle = "".Format('rgba({0}, {1}, {2}, 0.7)',my.color.r,my.color.g,my.color.b);
       ctx.arc(-offset.x, -offset.y, my.radius, 0,2 * Math.PI, true);
       ctx.fill();
       ctx.restore();
           
       if(DEBUG){
           ctx.save();
           ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
           ctx.fillText("x:"+position.x+" y:"+position.y, position.x-offset.x,position.y-offset.y);
           ctx.restore();
        }
    };
    return that;
};

var logWindowClass = function(my){
    my=my||{};
    var that={};
    
    //ログの最大保持数
    my.maxStoreSize=my.maxStoreSize||12;
    my.backgroundColor = {r:102,g:153,b:255,a:0.3};
    my.position=my.position||{x:0,y:0};
    
    //ログの文字列の配列
    my.messageStack =[];
    my.staticMessageArray = [];
    
    that.add = function(log){
        my.messageStack.unshift(log);
        my.messageStack=my.messageStack.slice(0,my.maxStoreSize);
    };
    that.setStaticMessage = function(ballArray){
        var logArray=[];
        for(var i=0;i<ballArray.length;i++){
            logArray.push("".Format("{0}. {1}:{2}",i+1,decodeURI(ballArray[i].playerName),ballArray[i].surviveTime));
        }
        my.staticMessageArray = logArray;
    };
    that.draw = function(ctx){
        ctx.save();
        ctx.fillStyle = "".Format('rgba({0}, {1}, {2}, {3})',my.backgroundColor.r,my.backgroundColor.g,my.backgroundColor.b,my.backgroundColor.a);
        ctx.fillRect(my.position.x,my.position.y,250,20*(my.maxStoreSize+my.staticMessageArray.length+3));
        
        ctx.font = "20px 'MSPゴシック'";
        ctx.fillStyle = 'rgba(0, 0, 0, 1)';
        for(var i =0;i<my.staticMessageArray.length;i++){
             ctx.fillText(my.staticMessageArray[i], my.position.x,my.position.y+20*(i+1),250);
        }
        
        for(var i =0;i<my.messageStack.length;i++){
             ctx.fillText(my.messageStack[i], my.position.x,my.position.y+20*(i+my.staticMessageArray.length+2),250);
        }
        ctx.restore();
    };
    return that;
};


//サーバサイドとクライアントサイド両方で用いる。
this["BallClass"]=BallClass;
this["BallListClass"]=BallListClass;
this["MapClass"]=MapClass;
