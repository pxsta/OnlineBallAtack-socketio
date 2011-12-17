var DEBUG=false;
var MyApp={ config:{ ServerAdress:"localhost"
                   ,ServerHttpPort:8080
                   ,FPS:60
                   ,joinButtonID:"JoinButton"
                   ,joinNameID:"JoinName"
                   ,chatTextID:"ChatText"
                   ,chatButtonID:"ChatButton"
                  }
           ,mainLoopID:0
           ,context:null
           ,ballList:BallListClass()
           ,logWindow:logWindowClass()
           ,canvasSize:{width:600,height:600}
           ,sessionID:0
           ,getOffset:function(){
               if(!MyApp.ballList.hasBall(MyApp.socketID)){
                   console.log("".Format("error:BallList do not have ball(ID:{0})",MyApp.socketID));
                   return MyApp.prevOffset;
               }
               else{
                   var myBallPosition =MyApp.ballList.get(MyApp.socketID).getPosition();
               }
               MyApp.prevOffset={x:myBallPosition.x-MyApp.canvasSize.width/2,y:myBallPosition.y-MyApp.canvasSize.height/2};
               return MyApp.prevOffset;
           }
           ,prevOffset:{x:0,y:0}
           ,map:null
};


var connection = io.connect("".Format("http://{0}:{1}",MyApp.config.ServerAdress,MyApp.config.ServerHttpPort));


connection.on('connect', function () {
    console.log("Cliant-connect");
    console.log(connection);
    MyApp.socketID=connection.socket.sessionid;
});
connection.on('disconnect', function () {
    connection.disconnect();
    run_stop();
    console.log("disconnect");
});


//サーバからマップの基本情報を受け取る
connection.on('initMapData', function (msg) {
    console.log("initMapData");
    
    var messageJson = JSON.parse(msg);
    
    //マップを初期化する
    MyApp.map= MapClass(messageJson);
    
    //スタートボタン,チャットボタンを表示する
    $("#"+MyApp.config.joinButtonID).removeAttr('hidden');
    $("#"+MyApp.config.joinNameID).removeAttr('hidden');
    $("#"+MyApp.config.chatButtonID).removeAttr('hidden');
    $("#"+MyApp.config.chatTextID).removeAttr('hidden');
});


//新しいボールがログインした通知を受け取る
connection.on('newBallLogin', function (msg) {
    console.log("newBallLogin");
    var messageJson = JSON.parse(msg);
    MyApp.logWindow.add("".Format('NewBall:'+decodeURI(messageJson.playerName)));
    
    MyApp.ballList.add(BallClass(messageJson))
});

//既存のボールを追加する
connection.on('addBall', function (msg) {
    console.log("addBall");
    var messageJson = JSON.parse(msg);
    MyApp.ballList.add(BallClass(messageJson))
});

//ボールの情報を更新する
connection.on('updateBallInfo', function (msg) {
    var messageJson = JSON.parse(msg);
    //他のプレイヤーの情報を更新する
    for(var i=0;i<messageJson.ballList.length;i++){
        //もしもローカルのボールリストに存在しなければ追加する
        if(MyApp.ballList.hasBall(messageJson.ballList[i].socketID)){
            MyApp.ballList.get(messageJson.ballList[i].socketID).updateValue(messageJson.ballList[i]);
        }
        else{
            MyApp.ballList.add(BallClass(messageJson.ballList[i]))
        }
    }
    
    MyApp.logWindow.setStaticMessage(messageJson.ballList);
});

//チャットメッセージを受信する
connection.on('chat', function (msg) {
    MyApp.logWindow.add(decodeURI(msg));
});



window.onload = function()
{
     //ゲームスタートボタンにゲームスタートイベントを追加する
        $("#"+MyApp.config.joinButtonID).click(function(){
            var initOption={ball:{}};
            var inputName= $("#"+MyApp.config.joinNameID).attr("value");
            
            if(inputName&&inputName.length>0){
                initOption.ball.playerName=encodeURI(inputName.toString().substr(0,10));
                $("#"+MyApp.config.joinNameID).attr("hidden","hidden");
            }            
            
             init(initOption);
             run();
        });
        
        //チャットボタンにイベントをセットする
        $("#"+MyApp.config.chatButtonID).click(function(){
            var message= $("#"+MyApp.config.chatTextID).attr("value");
            if(message.length>0){
                connection.emit("chat",encodeURI(message.substr(0,50)));
                $("#"+MyApp.config.chatTextID).attr("value","");
            }
        });
        $("#"+MyApp.config.chatTextID).keydown(function(e){
            if(e.keyCode==13){
                $("#"+MyApp.config.chatButtonID).click();                
            }
        });
        
        //キーイベントを付加する
        $(window).keydown(function(e){
        //left:37 up:38 right:39 down:40 space:32
        var code=e.keyCode;
        if(37<=code&&code<=40||code==32){
            connection.emit("keydown",code);
            return true;
        }
        if(code==13&&MyApp.mainLoopID==0){
             $("#"+MyApp.config.joinButtonID).click();
        }
        return true;
    });
        
    //スタートメッセージを表示しておく
    $("#GameCanvas")[0].getContext("2d").fillText("Enterキー、または下部のStartボタンでスタート",20,20);
};

var init = function(my)
{
    my = my||{};
    
    MyApp.canvasSize.width=document.documentElement.clientWidth-10;
    MyApp.canvasSize.height=document.documentElement.clientHeight-10;

    var canvas = $("#GameCanvas")[0];
    canvas.width = MyApp.canvasSize.width;
    canvas.height= MyApp.canvasSize.height;
    
    MyApp.context = canvas.getContext("2d");
    MyApp.ballList =BallListClass();
    MyApp.logWindow = logWindowClass();
    
    //サーバーにリセット(位置などの初期化)要求を送信する
    connection.emit("setInitBall",my.ball);  
};
var showTitle = function(){
    $("#"+MyApp.config.joinButtonID).removeAttr('hidden');
}
var hideTitle = function(){
//    $("#"+MyApp.config.joinButtonID).attr("hidden","hidden");
}


var run = function()
{
    if(MyApp.mainLoopID!=0){
        console.log("already run");
        return;
    }
    
    MyApp.mainLoopID=setInterval(function()
    {
        update();
        draw();
    },1000.0/MyApp.config.FPS);
};
var run_stop=function(){
    clearInterval(MyApp.mainLoopID);
    MyApp.mainLoopID=0;
}

var update = function(){
    //落ちたフラグが立っているボールは削除する
    var ballArray = MyApp.ballList.toArray();
    for(var i=0;i<ballArray.length;i++){
        if(ballArray[i].getIsFall()){
            if(ballArray[i].getSocketID()==MyApp.socketID){
                //自分が落ちた時
                run_stop();
                showTitle();
                
            }
            else{
                //他人が落ちた時
                console.log("remove:"+ballArray[i].getSocketID());
                MyApp.ballList.remove(ballArray[i].getSocketID());
            }            
            MyApp.logWindow.add("".Format('BallDrop:'+decodeURI(ballArray[i].getPlayerName())));
        }
    }
};
var draw = function()
{
    var ctx = MyApp.context;
    var offset = MyApp.getOffset();
    
    //Canvasをゼロクリアする
    ctx.clearRect(0,0,MyApp.canvasSize.width,MyApp.canvasSize.height);


    //マップを描写
    MyApp.map.draw(ctx,MyApp.getOffset());
    
    // ボールを描写
    MyApp.ballList.draw(ctx,MyApp.getOffset());
   
    
   //ログ情報を描写
   MyApp.logWindow.draw(ctx);
};


