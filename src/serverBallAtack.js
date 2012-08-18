if (typeof window === 'undefined') {
    var ballAtackClass = require('../src/client/ballAtack.js');
    var BallClass = ballAtackClass.BallClass;
    var BallListClass = ballAtackClass.BallListClass;
    var MapClass = ballAtackClass.MapClass;
    
    var rigidUtil  = require('../src/util/rigidUtil.js');
    var RigidUtility= rigidUtil.RigidUtility;
}


var ServerBallClass = function(my){
    my=my||{};
    var that = BallClass(my);
    var defaultMode ="normal";
    //次に行う行動のバッファ
    var actionBuffer=null;
    //摩擦
    var friction =0.1;    
    //衝突時の摩擦
    var collidFriction =0.5;
    //連続衝突回数
    var collidContinueCount=0;

    
    my.expressSessionID = my.expressSessionID||'0';
    my.mode=my.mode||defaultMode;
    my.previousPosition={x:0,y:0};
    
    //ボールの最大/最低速度
    my.MAX_SPEED=10;
    my.MIN_SPEED=1;
    
    //この回数以上連続で衝突したら、重なっているとみなして強制的に削除のフラグを立てる
    my.maxCollidContinueCount=my.maxCollidContinueCount||30;
    my.isCollid =my.isCollid ||false;
    
    that.getExpressSessionID =function(){
        return my.expressSessionID;
    };
    that.setExpressSessionID =function(sessionID){
        my.expressSessionID= sessionID;
    };

    that.getByExpressSessionID=function(sessionID){
        return my.ballList[sessionID];
    };
    //クライアントから受信した命令を保存しておく
    that.setActionBuffer = function(func){
        //1つのみ上書き不可で保存
        if(actionBuffer==null){
            actionBuffer = func;
            return true;
        }
        else{
            return false;
        }
    };
    that.executeActionBaffa = function(){
        if(actionBuffer!=null){
            var result = actionBuffer();
            actionBuffer = null;
            return result;
        }
    }
    that.setMode = function(mode){
        my.mode =mode||defaultMode;
    }
    that.increaseSurviveTime = function(){
        my.surviveTime++;
    }
    that.setIsCollid = function(value){
        my.isCollid = value;
    };
    that.getPreviousPositon =function(){
        return my.previousPosition;
    }
    that.addSpeed = function(speed){
        my.speed.x+=speed.x;
        my.speed.y+=speed.y;
    }
    that.update =function(){
        that.executeActionBaffa();
        that.increaseSurviveTime();
        if(my.isCollid){
            collidContinueCount++;
            if(collidContinueCount>my.maxCollidContinueCount){
                my.isFall=true;
            }
            my.isCollid=false;
        }
        else{
            collidContinueCount=0;
        }
        
        //移動前の位置を保存
        my.previousPosition={x:my.position.x,y:my.position.y};
        updateSpeed();
        move();
    }
    var updateSpeed =function(){
        var ratio=10;
        //ターボ時にどれだけMAX_SPEEDを超過できるか
        var marginMaxSpeed=0;
        
        //ターボかどうか
        if(my.mode=="tarbo"){
            var theata = Math.atan2(my.speed.y, my.speed.x);
            marginMaxSpeed=5;
            
            var theata = Math.atan2(my.speed.y, my.speed.x);
            my.speed.x=15*Math.cos(theata);
            my.speed.y=15*Math.sin(theata);
            my.mode==defaultMode;
        }
        
        
        if(Math.abs(Math.round(my.acceleration.x*ratio))<=friction*ratio){
            my.acceleration.x=0;
        }
        if(Math.abs(Math.round(my.acceleration.y*ratio))<=friction*ratio){
            my.acceleration.y=0;
        }
         //速度がMIN_SPEED以下になったら摩擦力の影響で止める
        if(Math.abs(Math.round(my.speed.x*ratio))<=my.MIN_SPEED){
             my.speed.x=0;
        }
        if(Math.abs(Math.round(my.speed.y*ratio))<=my.MIN_SPEED){
              my.speed.y=0;
        }
        
        //摩擦力を考慮する
        if(my.speed.x<0){
            my.acceleration.x+=friction;
        }
        else if(my.speed.x>0){
            my.acceleration.x-=friction;
        } 
        
        if(my.speed.y<0){
            my.acceleration.y+=friction;
        }
        else if(my.speed.y>0){
            my.acceleration.y-=friction;
        } 
            
        my.speed.x+=my.acceleration.x;
        my.speed.y+=my.acceleration.y;
        
        if(Math.abs(my.speed.x)>=my.MAX_SPEED+marginMaxSpeed){
            my.speed.x=(my.MAX_SPEED+marginMaxSpeed)*(my.speed.x>=0?1:-1);
        }
        if(Math.abs(my.speed.y)>=my.MAX_SPEED+marginMaxSpeed){
            my.speed.y=(my.MAX_SPEED+marginMaxSpeed)*(my.speed.y>=0?1:-1);
        }
    };
    var move = function(){
        my.position.x+=my.speed.x;
        my.position.y+=my.speed.y;
    }
    
    //衝突後の加速度を計算する
    that.effectCollidFriction = function(){
        //摩擦力を考慮する
        if(my.acceleration.x<0){
            my.acceleration.x+=collidFriction;
        }
        else if(my.acceleration.x>0){
            my.acceleration.x-=collidFriction;
        } 
        
        if(my.acceleration.y<0){
            my.acceleration.y+=collidFriction;
        }
        else if(my.acceleration.y>0){
            my.acceleration.y-=collidFriction;
        } 
            
    }

    that.toJSON = function(){
        var jsonObj = {};
        jsonObj.position=my.position;    
        jsonObj.speed =my.speed;
        jsonObj.acceleration=my.acceleration;
        jsonObj.weight=my.weight;
        jsonObj.radius=my.radius;
        jsonObj.color=my.color;
        jsonObj.socketID=my.socketID;
        
        //ExpressのSessionIDは含めない
        //jsonObj.expressSessionID=my.expressSessionID;
        jsonObj.playerName=my.playerName;
        jsonObj.isFall=my.isFall;
        jsonObj.surviveTime=my.surviveTime;
        return jsonObj;
    };

    return that;
};

var ServerCPUBallClass = function(my){
    my=my||{};    
    var that =ServerBallClass(my);
    that.oldUpdate = that.update;
    
    my.color={r:Math.floor(Math.random()*255),g:Math.floor(Math.random()*255),b:Math.floor(Math.random()*255)};
    my.mapRadius =my.mapRadius ||800;
    my.maxMoveCount=my.maxMoveCount||150;
    my.maxChaseCount=my.maxChaseCount||Math.random()*70+180;
    my.maxStopCount=my.maxStopCount||130;
    my.changeCount=my.changeCount||50;
    my.maxAutoAcceleration=my.maxAutoAcceleration||0.4;
    my.minAutoAcceleration=my.minAutoAcceleration||0.2;
    my.checkWillDropRate =my.checkWillDropRate||Math.round(Math.random()*50)+10;
    
    var randBase =Math.random();
    my.weight=randBase*0.5+0.3;
    my.radius=randBase*30+40;
    
    

    //現在の動作を何回行ったかのカウンタ
    var moveCount=0;
    var prevAcceleration={x:0,y:0};
    
    var generateRandomAcceleration = function(){
        return {x:(Math.random()*my.maxAutoAcceleration+my.minAutoAcceleration)*((Math.round(Math.random()*1000)%2==0)?1:-1),y:(Math.random()*my.maxAutoAcceleration+my.minAutoAcceleration)*(Math.round(Math.random()*1000)%2==0?1:-1)};
    }
    
    //落ちるようであれば修正する
    var checkWillDrop =function(moveTime){
        moveTime=moveTime||my.changeCount;
   
        //落ちるようであれば方向を変える
        var mapCircle =RigidUtility.CircleClass({position:{x:0,y:0},radius:my.mapRadius*0.75-my.radius});
        var willPos = {x:my.position.x,y:my.position.y};
           
        //到達予想地点を割り出す
        for(var i=0,cx=prevAcceleration.x+my.speed.x,cy=prevAcceleration.y+my.speed.y;i<moveTime;i++){
            willPos.x+=cx;
            willPos.y+=cy;
            if(Math.abs(cx)<my.MAX_SPEED){
                cx+=cx;
            }
            else{
                cx=my.MAX_SPEED*cx<0?-1:1;
            }
            if(Math.abs(cy)<my.MAX_SPEED){
                cy+=cy;
            }
            else{
                cy=my.MAX_SPEED*cy<0?-1:1;
            }
        }
        if(!my.isCollid&&!RigidUtility.isCollideCC(RigidUtility.CircleClass(
            {position:willPos,
             radius:my.radius}),
             mapCircle)){
                var theata = Math.atan2(-my.position.y, -my.position.x);
                var tv1=1;
                prevAcceleration={x:tv1*Math.cos(theata),
                                  y:tv1*Math.sin(theata)};
                return true;
            }
            return false;
    };
    
    that.update = function(param){
        param = param||{};
        
        

        //動く
        if(moveCount<my.maxMoveCount){
            moveCount++;
            //動く方向を定期的に変える
            if(moveCount%my.changeCount==0){
                prevAcceleration=generateRandomAcceleration();
                checkWillDrop(my.changeCount);
            }
            that.addSpeed(prevAcceleration);
        }
        //停止したまま
        else if (my.maxMoveCount<=moveCount&&moveCount<my.maxMoveCount+my.maxStopCount){
            moveCount++;
            prevAcceleration={x:0,y:0};
            if(checkWillDrop(1)){
                that.addSpeed(prevAcceleration);
            }
            
        }
        else if(my.maxMoveCount+my.maxStopCount<=moveCount&&moveCount<my.maxMoveCount+my.maxStopCount+my.maxChaseCount){
            moveCount++;
            var theata = Math.atan2(param.targetPosition.y-my.position.y, param.targetPosition.x-my.position.x);
            var tv1=1;
            prevAcceleration={x:tv1*Math.cos(theata),
                              y:tv1*Math.sin(theata)};
            
            if(Math.round(Math.random()*100)%my.checkWillDropRate==0){
                checkWillDrop(1);
            }
            that.addSpeed(prevAcceleration);

        }
        else{
            moveCount=0;
        }

        that.oldUpdate();
    }
    return that;
}

var ServerBallListClass = function(my){
    my=my||{};
    var that =BallListClass(my);
    
    that.hasBallByExpressSessionID = function(sessionID){
        return sessionID in my.ballList;
    }
    that.update = function(param){
        for(var i in my.ballList){
              if (my.ballList.hasOwnProperty(i)){
                   my.ballList[i].update(param);
                }
        }
    };    
    that.toJSON = function(){
        var jsonObj =[];
        for(var i in my.ballList){
              if (my.ballList.hasOwnProperty(i)){
                   jsonObj.push(my.ballList[i].toJSON());
                }
        }        
        return jsonObj;
    }
    return that;
}
var ServerMapClass = function(my){
    my=my||{};
    var that =MapClass(my);
    
    that.toJSON = function(){
        var jsonObj = {};
        jsonObj.position=my.position;    
        jsonObj.radius=my.radius;
        jsonObj.color=my.color;
        return jsonObj;
    };

    return that;
};

this["ServerBallClass"]=ServerBallClass;
this["ServerCPUBallClass"]=ServerCPUBallClass;
this["ServerBallListClass"]=ServerBallListClass;
this["ServerMapClass"]=ServerMapClass;