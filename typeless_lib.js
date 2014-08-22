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
	dsp.draw_text("loading",0,0,this.h,this.color,"center");
	dsp.draw_text("-made with typeless engine-",0,this.h,this.h/2,this.color,"center");
}

/*******************************************************************************
 * Typeless engine - Game Object 
 ******************************************************************************/

function typeless_game(w,h){
	typeless_object.call(this);

	this.w=w;
	this.h=h;

	this.dsp=new typeless_display(this.w,this.h,document.body);
	this.DT=0;
	this.dt=0;
	this.t=0;

	this.loader=new typeless_loader(this.w/2,this.h/2,this.w,this.h/20);
	this.children.push(this.loader);

	this.events=[];
	this.events_queue=[];
	var me=this;
	this.dsp.canvas.addEventListener("keydown",function(e){me.events_queue.push(e);});
	this.dsp.canvas.addEventListener("keyup",function(e){me.events_queue.push(e);});
	this.dsp.canvas.addEventListener("mousedown",function(e){me.events_queue.push(e);});
}
typeless_inherit(typeless_game,typeless_object);

typeless_game.prototype.run=function(fps_cap){
	var me=this;

	if(fps_cap){
		this.DT=1000/fps_cap;
		(function cycle(t){
			me.dt=t-me.t;
			if(me.dt>me.DT){
				me.t=t-(me.dt%me.DT);	
				me.update_tree(me.dt);
				me.dsp.fill(me.color);
				me.draw_tree(me.dsp);
			}
			requestAnimationFrame(cycle);
		})(0);
	}else{
		(function cycle(t){
			me.dt=t-me.dt;
			me.update_tree(me.dt);
			me.dsp.fill(me.color);
			me.draw_tree(me.dsp);
			me.dt=t;
			requestAnimationFrame(cycle);
		})(0);
	}
}

typeless_game.prototype.draw=function(dsp){}

typeless_game.prototype.update=function(dt){
	this.events.splice(0);
	this.events=this.events.concat(this.events_queue);
	this.events_queue.splice(0);
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

function typeless_atile(tiles,Ts){
	typeless_object.call(this);

	this.tiles=tiles;
	this.Ts=Ts;

	this.animation_i=0;
	this.tile_i=0;
	this.tile=tiles[0][0];

	this.w=this.tile.w;
	this.h=this.tile.h;

	this.t=Ts[0];
}
typeless_inherit(typeless_atile,typeless_object);

typeless_atile.prototype.set_animation=function(animation_i){
	this.animation_i=animation_i;
	this.t=0;
}

typeless_atile.prototype.update=function(dt){
	this.t-=dt;
	if(this.t<=0){
		this.tile_i=(this.tile_i+1)%this.tiles[this.animation_i].length;	
		this.tile=this.tiles[this.animation_i][this.tile_i];
		this.t=this.Ts[this.animation_i];
	}
}

typeless_atile.prototype.draw=function(dsp){
	this.tile.draw_tree(dsp);
}

/*******************************************************************************
 * Typeless Library - Tilemap Object 
 ******************************************************************************/

function typeless_tilemap(tiles,map,render_r,render_c){
	typeless_object.call(this);

	this.tiles=tiles;
	this.map=map;
	this.render_c=render_c;
	this.w=render_c*tiles[0].w;
	this.render_r=render_r;
	this.h=render_r*tiles[0].h;
	this.dsp=new typeless_display(this.w,this.h,null);

	this.scroll_x=0;
	this.c=-5;
	this.scroll_y=0;
	this.r=-5;
}
typeless_inherit(typeless_tilemap,typeless_object);

typeless_tilemap.prototype.render_map=function(x,y){
	var new_c=Math.max(0,Math.floor(this.scroll_x/(this.tiles[0].w*this.zx)));
	var new_r=Math.max(0,Math.floor(this.scroll_y/(this.tiles[0].h*this.zy)));

	if(new_c<=this.c-2||new_c>=this.c+2||new_r<=this.r-2||new_r>=this.r+2){
		console.log("redraw");
		for(var i=new_r;i<new_r+this.render_r&&i<this.map.length;i++){
			for(var j=new_c;j<new_c+this.render_c&&j<this.map[0].length;j++){
				var tile=this.tiles[this.map[i][j]];
				this.dsp.x=(j-new_c)*tile.w;
				this.dsp.y=(i-new_r)*tile.h;
				tile.draw(this.dsp);
			}	
		}	
		this.r=new_r;
	this.y=new_r*this.tiles[0].h*this.zx;
		this.c=new_c;
	this.x=new_c*this.tiles[0].w*this.zy;
	}

}

typeless_tilemap.prototype.update=function(dt){
	this.render_map(this.x,this.y);
}

typeless_tilemap.prototype.draw=function(dsp){
	dsp.draw_image(this.dsp.canvas,{x:0,y:0,w:this.w,h:this.h},{x:0,y:0,w:this.w,h:this.h});
}

/*******************************************************************************
 * Typeless Library - Tween Object 
 ******************************************************************************/

function typeless_tween(property,T,f){
	typeless_object.call(this);

	this.visible=false;

	this.property=property;
	this.T=T;
	this.t=0;
	this.f=f;
}
typeless_inherit(typeless_tween,typeless_object);

typeless_tween.prototype.update=function(dt){
	this.t+=dt;
	if(this.t>=this.T && this.T>-1){
		this.deleted=true;
		dt=this.T-this.t+dt;
		this.t=this.T;
	}

	this.parent[this.property]=this.f.call(this,dt,this.t);
}
