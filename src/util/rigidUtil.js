var RigidUtility ={
    CircleClass:function(my){
        var that={};
        my=my||{};
        
        my.position =my.position||{x:0,y:0};
        my.radius=my.radius||0;
        
        
        that.getPosition=function(){
            return my.position;
        };
        that.setPosition =function(position){
            my.position =position;
        };
        that.getRadius= function(){
            return my.radius;
        };
        that.setRadius=function(radius){
            my.radius =radius;
        };    
        return that;
    }
    ,objectClass:function(my){
        var that={};
        my=my||{};
        
        my.position=my.position||{x:0,y:0};
        my.weight=my.weight||0;
        my.speed=my.speed||{x:0,y:0};
        
        that.getPosition=function(){
            return my.position;
        };
        that.setPosition =function(position){
            my.position =position;
        };
        that.getWeight = function(){
            return my.weight;
        };
        that.setWeight=function(weight){
            my.weight=weight;
        };
        that.getSpeed = function(){
            return my.speed;
        };
        that.setSpeed=function(speed){
            my.speed=speed;
        };
        
        return that;
    }
    ,isCollideCC: function(circle1,circle2){
        var r1=circle1.getRadius();
        var r2=circle2.getRadius();
        
        var c1p = circle1.getPosition();
        var c2p = circle2.getPosition();
        return Math.pow(c2p.x-c1p.x,2)+Math.pow(c2p.y-c1p.y,2)<=Math.pow(r1+r2,2);
    }
    ,collisionObject:function(obj1,obj2){
        var massRatio =1;
        var mass1=obj1.getWeight();
        var mass2=obj2.getWeight();
        var v1=obj1.getSpeed();
        var v2=obj2.getSpeed();
        
        //弾性係数
        var elast = 1;
        
        //重量差の重み
        var theataRatio=100;


        var o1p = obj1.getPosition();
        var o2p = obj2.getPosition();
        var theata = Math.atan2(o2p.y-o1p.y, o2p.x-o1p.x);
    
        //無理矢理正面からとして扱う
        theata=0;    

        
        //正面から衝突した時
        if(theata==0||Math.abs(Math.round(theata*theataRatio))==Math.round(((Math.PI/2)*theataRatio))){
            obj1.setSpeed({x:(-v1.x + v2.x )*( 1 + elast )/( (mass1/mass2)*massRatio + 1 ) + v1.x,
                           y:(-v1.y + v2.y )*( 1 + elast )/( (mass1/mass2)*massRatio + 1 ) + v1.y});
            obj2.setSpeed({x:( -v2.x + v1.x )*( 1 + elast )/( (mass2/mass1)*massRatio + 1 ) + v2.x,
                           y:( -v2.y + v1.y )*( 1 + elast )/( (mass2/mass1)*massRatio + 1 ) + v2.y});
         }
         else{
            var v1x =(-v1.x + v2.x )*( 1 + elast )/( (mass1/mass2)*massRatio + 1 ) + v1.x;
            var v1y =(-v1.y + v2.y )*( 1 + elast )/( (mass1/mass2)*massRatio + 1 ) + v1.y;
            var v2x =( -v2.x + v1.x )*( 1 + elast )/( (mass2/mass1)*massRatio + 1 ) + v2.x;
            var v2y =( -v2.y + v1.y )*( 1 + elast )/( (mass2/mass1)*massRatio + 1 ) + v2.y;
    
            var tv1 = Math.sqrt(Math.pow(v1x,2)+Math.pow(v1y,2));
            var tv2 = Math.sqrt(Math.pow(v2x,2)+Math.pow(v2y,2));
    
            obj1.setSpeed({x:tv1*Math.cos(theata-Math.PI/2),
                           y:tv1*Math.sin(theata-Math.PI/2)});
    
            obj2.setSpeed({x:tv2*Math.cos(theata),
                           y:tv2*Math.sin(theata)});
            }
    }
};


this["RigidUtility"]=RigidUtility;