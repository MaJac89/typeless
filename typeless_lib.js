/******************************************************************************
 * Typeless engine - Loader Object
 *
 *	Simple class to register assets and preload them.
 *
 * Example:
 *
 *	loader=new typless_loader();
 *
 *	loader.add_img("example.png");
 *	loader.add_audio("example.mp3");
 *	loader.add_video("example.mp4");
 *
 *	loader.load_start(function(){console.log("loaded!");});
 *****************************************************************************/

function typeless_loader(x,y,w,h){
	typeless_object.call(this);

	this.assets=[];
	this.to_load=0;
	this.load_end=function(){};

	this.x=x;
	this.y=y;
	this.w=w;
	this.h=h;
	this.color="#ffffff";

	this.min_duration=5000;
}
typeless_inherit(typeless_loader,typeless_object)

typeless_loader.prototype.add_img=function(img_path){
	return this.add_asset("img","load",img_path);
}

typeless_loader.prototype.add_video=function(video_path){
	return this.add_asset("video","canplaythrough",video_path);
}

typeless_loader.prototype.add_audio=function(audio_path){
	return this.add_asset("audio","canplaythrough",audio_path);
}

typeless_loader.prototype.add_asset=function(type,load_event,media_path){
	this.to_load++;	

	var new_media=document.createElement(type);
	if(type=="audio"||type=="video"){
		new_media.muted=true;
		new_media.autoplay=true;
	}
	var me=this;
	new_media.addEventListener(load_event,function(evn){
		me.to_load--;
		if(type=="audio"||type=="video"){
			new_media.muted=false;
			new_media.currentPosition=0;
			new_media.pause();
		}
	});

	this.assets.push({
		dom:new_media,
		src:media_path
	});

	return new_media;
}

typeless_loader.prototype.load_start=function(load_end){
	this.load_end=load_end;

	for(var i=0; i<this.assets.length; i++){
		var ass=this.assets[i];
		ass.dom.src=ass.src;
	}
}

typeless_loader.prototype.update=function(dt){
	if(this.min_duration>0){
		this.min_duration-=dt;
	}else if(this.min_duration<=0 && this.to_load==0){
		this.deleted=true;
		this.load_end();
	}
}

typeless_loader.prototype.draw=function(dsp){
	dsp.draw_text("loading",0,0,this.h,this.color);
	dsp.draw_text("-made with typeless engine-",0,this.h,this.h/2,this.color);
}

/*******************************************************************************
 * Typeless engine - Game Object 
 ******************************************************************************/

function typeless_game(w,h,zx,zy){
	typeless_object.call(this);

	this.w=w;
	this.h=h;
	this.zx=zx;
	this.zy=zy;

	this.dsp=new typeless_display(this.w*this.zx,this.h*this.zy,document.body);
	this.DT=0;
	this.dt=0;
	this.t=0;

	this.loader=new typeless_loader(this.w/2,this.h/2,this.w,this.h/20);
	this.children.push(this.loader);
}
typeless_inherit(typeless_game,typeless_object);

typeless_game.prototype.run=function(fps_cap){
	var me=this;

	if(fps_cap){
		this.DT=1000/fps_cap;
		(function cycle(t){
			me.dt=t-me.t;
			if(me.DT==1||me.dt>me.DT){
				me.t=t-(me.dt%me.DT);	
				me.update_tree(me.dt);
				me.draw_tree(me.dsp);
			}
			requestAnimationFrame(cycle);
		})(0);
	}else{
		(function cycle(t){
			me.dt=t-me.dt;
			me.update_tree(me.dt);
			me.draw_tree(me.dsp);
			me.dt=t;
			requestAnimationFrame(cycle);
		})(0);
	}
}

/*******************************************************************************
 * Typeless Library - Tile Object 
 ******************************************************************************/

function typeless_tile(tileset,r,c,w,h){
	typeless_object.call(this);

	this.tileset=tileset;

	this.tile_rect=tileset.get_tile_rect(r,c,w,h);
	this.w=this.tile_rect.w;
	this.h=this.tile_rect.h;
	this.rect={x:0,y:0,w:this.w,h:this.h};
}
typeless_inherit(typeless_tile,typeless_object);

typeless_tile.prototype.draw=function(dsp){
	dsp.draw_image(this.tileset.img,this.tile_rect,this.rect);
}

/*******************************************************************************
 * Typeless Library - Animated Tile Object
 ******************************************************************************/

function typeless_atile(tiles,T){
	typeless_object.call(this);

	this.tiles=tiles;
	
	this.tile_i=0;
	this.tile=tiles[0];
	for(var i=0;i<tiles.length;i++){
		tiles[i].visible=false;
		this.children.push(tiles[i]);
	}

	this.w=this.tile.w;
	this.h=this.tile.h;

	this.T=T;
	this.t=T;
}
typeless_inherit(typeless_atile,typeless_object)

typeless_atile.prototype.update=function(dt){
	this.t-=dt;
	if(this.t<=0){
		this.tile.visible=false;
		this.tile_i=(this.tile_i+1)%this.tiles.length;	
		this.tile=this.tiles[this.tile_i];
		this.tile.visible=true;

		this.t=this.T;
	}
}

typeless_atile.prototype.draw=function(dsp){}
