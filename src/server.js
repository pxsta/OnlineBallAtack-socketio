//必要モジュール,クラスの読み込み
var serverBallAtackClass = require('../src/serverBallAtack.js');
var BallClass =serverBallAtackClass.ServerBallClass;
var CPUBallClass =serverBallAtackClass.ServerCPUBallClass;
var BallListClass =serverBallAtackClass.ServerBallListClass;
var MapClass =serverBallAtackClass.ServerMapClass;

var rigidUtil  = require('../src/util/rigidUtil.js');
var RigidUtility= rigidUtil.RigidUtility;


var MyApp={ config:{ServerHttpPort:8080
                   ,ServerAdress:"localhost"
                   ,FPS:60
                   }
           ,context:null
           ,ballList:null
           ,mapRadius:800
           ,map:null
};

//chachされなかった例外の処理
process.on('uncaughtException', function (err) {
    console.log('uncaughtException');
    conseole.dir(err);
});


var fs = require('fs');
var path = require('path');
var express = require('express')

var app=express();
var MemoryStore = express.session.MemoryStore;
var sessionStore = new MemoryStore();

app.configure(function(){
    app.use(express.cookieParser("pxsta"));
    app.use(express.session({ secret: "pxsta"
                             ,store: sessionStore}
    ));

});
app.configure('development', function(){
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
    app.use(express.errorHandler()); 
});

var writeResData = function(req,res,currentPath){
    console.log(currentPath);
    var extention = path.extname(currentPath);
    fs.readFile(__dirname + currentPath, function(err, data){
        if (err) {
            console.dir(err);
            return send404(res);
        }
            
            
        if(extention=='.html'){ res.writeHead(200, {'Content-Type': 'text/html'});}
        else if(extention=='.js'){ res.writeHead(200, {'Content-Type': 'text/javascript'});}
            
        data = data.toString().replace("<% ServerAdress %>",MyApp.config.ServerAdress);
        data = data.toString().replace("<% ServerHttpPort %>",MyApp.config.ServerHttpPort.toString());
           
        res.write(data, 'utf8');
        res.end();
    });
};
var send404 = function(res){
    res.writeHead(404);
    res.write('404');
    res.end();
}
app.get('/', function(req, res) {
    writeResData(req,res,'/../index.html');
});
app.get('/index.html', function(req, res) {
    writeResData(req,res,'/../index.html');
});
app.get('/scripts/*.js', function(req, res) {
    writeResData(req,res,'/..'+req.url);
});
app.get('/src/util/*.js', function(req, res) {
    writeResData(req,res,'/..'+req.url);
});
app.get('/src/client/*.js', function(req, res) {
    writeResData(req,res,'/..'+req.url);
});
app.get('*', function(req, res){
    res.send('Not found', 404);
});

var http = require('http').createServer(app).listen(MyApp.config.ServerHttpPort);
var io = require('socket.io').listen(http);
io.set('log level', 1);

var connect = require('connect');
var Session = connect.middleware.session.Session;
var parseCookie = require('cookie').parse;
io.set('authorization', function (handshakeData, callback) {
    if(handshakeData.headers.cookie) {
        //cookieを取得
        var cookie = handshakeData.headers.cookie;
        //cookieをパースしてExpressのセッションIDを取得する
        var sessionID = parseCookie(cookie)['connect.sid'];
        
        //Socketの再接続時のために、ExpressのセッションIDも保存しておく
        handshakeData.sessionID = sessionID;
        callback(null, true);
    } 
    else{
        //Cookieが見つからなかったとき
        return callback('Cookieが見つかりませんでした', false);
    }
 });


io.sockets.on('connection', function (connection) {
    console.log("connect:"+connection.id+" sessionID:"+connection.handshake.sessionID);
    
    //マップの基本情報を送る
    connection.emit("initMapData",JSON.stringify(MyApp.map.toJSON()));


    //クライアントからリセット(位置などの初期化)を要求されたとき
    connection.on("setInitBall",function(data) {
        data = data||{};
        var expSID =connection.handshake.sessionID;
        console.log("setInitBall:"+expSID);
        var newUserOption = {expressSessionID:expSID
                            ,socketID:connection.id
                            ,position:{x:150*(Math.random()*6-3),y:150*(Math.random()*6-3)}
                            ,playerName:data.playerName};
        
        //既にexpressSessionIDが登録済みの時はsocket.ioのsocketIDだけ更新する
        if(MyApp.ballList.hasBallByExpressSessionID(expSID)){
            MyApp.ballList.getByExpressSessionID(expSID).setSocketID(connection.id);
        }
        else{
            MyApp.ballList.add(BallClass(newUserOption));
        }

        //新規ユーザーのログインをすべての人に通知する
        io.sockets.emit("newBallLogin",JSON.stringify(newUserOption));
        //すでにログイン中のユーザー情報を送る
        var ballArray = MyApp.ballList.toArray();
        for(var i = 0;i<ballArray.length;i++){
            if(ballArray[i].getExpressSessionID()!=expSID){
                connection.emit("addBall",JSON.stringify(ballArray[i].toJSON()));
            }
        }
    });
    
    //クライアントがキーを押した時
    connection.on('keydown',function(code){
        var acRatio=50;
        var moveVector={x:0,y:0,mode:"normal"};
            if(37<=code&&code<=40||code==32){
              if(code==37){
                  moveVector.x+=(-1);
              }
              else if(code==39){
                  moveVector.x+=1;
              }
              else if(code==38){
                  moveVector.y+=(-1);
              }
              else if(code==40){
                  moveVector.y+=1;
              }
              else if(code==32){
                  //ターボ
                  moveVector.mode="tarbo";
              }
        }
        moveVector.x*=acRatio;
        moveVector.y*=acRatio;
        if(!MyApp.ballList.hasBall(connection.id)){
            console.log("error updateBallSpeed:ballList has not socketID: "+connection.id);
            return;
        }
        
        //ボールの行動バッファに加える
        MyApp.ballList.get(connection.id).setActionBuffer(function(){
            MyApp.ballList.get(connection.id).addSpeed(moveVector);
            MyApp.ballList.get(connection.id).setMode(moveVector.mode);
        });
    });
    
    //チャットメッセージを送受信する
    connection.on("chat",function(data){
        console.log(data);
        io.sockets.emit("chat",data);
    });
}); 



var run = function()
{
    setInterval(function(){
           update();
           sync();
        },1000.0/MyApp.config.FPS);
};


var update = function()
{
    //落ちたフラグが立っているボールは削除する
    var ballArray = MyApp.ballList.toArray();
    for(var i=0;i<ballArray.length;i++){
        if(ballArray[i].getIsFall()){
            MyApp.ballList.remove(ballArray[i].getSocketID());
        }
    }
    
    var ballArray = MyApp.ballList.toArray();
    for(var i=0;i<ballArray.length-1;i++){
        for(var j=i+1;j<ballArray.length;j++){
            if(RigidUtility.isCollideCC(RigidUtility.CircleClass({position:ballArray[i].getPosition(),radius:ballArray[i].getRadius()}),
            RigidUtility.CircleClass({position:ballArray[j].getPosition(),radius:ballArray[j].getRadius()})
            )){
                                
                var obj1= RigidUtility.objectClass({weight:ballArray[i].getWeight(),speed:ballArray[i].getSpeed()});
                var obj2= RigidUtility.objectClass({weight:ballArray[j].getWeight(),speed:ballArray[j].getSpeed()});

                var obj1= RigidUtility.objectClass({weight:ballArray[i].getWeight(),speed:ballArray[i].getSpeed(),position:ballArray[i].getPosition()});
                var obj2= RigidUtility.objectClass({weight:ballArray[j].getWeight(),speed:ballArray[j].getSpeed(),position:ballArray[j].getPosition()});                

                RigidUtility.collisionObject(obj1,obj2);
                ballArray[i].setSpeed({x:obj1.getSpeed().x,y:obj1.getSpeed().y});
                ballArray[j].setSpeed({x:obj2.getSpeed().x,y:obj2.getSpeed().y});
                
                //衝突前の位置に戻す
                ballArray[i].setPosition(ballArray[i].getPreviousPositon().x,ballArray[i].getPreviousPositon().y);
                ballArray[j].setPosition(ballArray[j].getPreviousPositon().x,ballArray[j].getPreviousPositon().y)
                
                ballArray[i].setIsCollid(true);
                ballArray[j].setIsCollid(true);
            }
        }
    }
    
    //マップからはみ出していないか確認
    for(var i=0;i<ballArray.length;i++){
        //計算時はボールがマップから半分以上出たらアウトにするため、ボールの半径の分だけマップの半径を小さくして扱う
         var mapCircle =RigidUtility.CircleClass({position:MyApp.map.getPosition(),radius:MyApp.map.getRadius()-ballArray[i].getRadius()});
        if(!RigidUtility.isCollideCC(RigidUtility.CircleClass({position:ballArray[i].getPosition(),radius:ballArray[i].getRadius()}),
        mapCircle
        )){
            //落ちたものはボールオブジェクトに落ちたフラグをセットする
            console.log("落下:"+ballArray[i].getExpressSessionID());
            ballArray[i].setIsFall(true);
        }
    }


    //CPUを追加する
    if(ballArray.length<3){
        var expSID =-Math.random().toString();
        var SID =-Math.random().toString();
        console.log("addCPUBall:"+expSID);
        
        var newUserOption = {expressSessionID:expSID
                            ,socketID:SID
                            ,position:{x:150*(Math.random()*6-3),y:150*(Math.random()*6-3)}
                            ,playerName:"CPU"};
        
        MyApp.ballList.add(CPUBallClass(newUserOption));
        
        //新規ユーザーのログインをすべての人に通知する
        io.sockets.emit("newBallLogin",JSON.stringify(newUserOption));
    }
        
    //CPUが追尾するターゲットをセットする
    var param = {};
    param.targetPosition=MyApp.ballList.toArray()[0].getPosition();
    
    //更新
    MyApp.ballList.update(param);
};

var sync = function(){
    var ballArray = MyApp.ballList.toArray();
    var sendMessage = {};
    sendMessage.ballList = MyApp.ballList.toJSON();
    
    for(var i=0;i<ballArray.length;i++){
        //CUPはコネクションが無いので送らない
        var socketID = ballArray[i].getSocketID();
        if(socketID[0]!="-"){
            io.sockets.socket(socketID).volatile.emit("updateBallInfo",JSON.stringify(sendMessage));
        }
    }
}

var init = function()
{    
    MyApp.map= MapClass({radius:MyApp.mapRadius});  
    MyApp.ballList =BallListClass();
};


init();
run();
