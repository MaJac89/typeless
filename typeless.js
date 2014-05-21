/*******************************************************************************
 * Typeless engine - Display 
 ******************************************************************************/

function typeless_display(w,h,dom_parent){
	this.canvas=document.createElement("canvas");
	this.canvas.width=w;
	this.canvas.height=h;

	this.context=this.canvas.getContext("2d");
	this.context.imageSmoothingEnabled=false;
	this.context.webkitImageSmoothingEnabled=false;
	this.context.mozImageSmoothingEnabled=false;

	dom_parent.appendChild(this.canvas);
};

typeless_display.prototype.fill=function(color){
	this.context.fillStyle=color;
	this.context.fillRect(0,0,this.canvas.width,this.canvas.height);
};

typeless_display.prototype.draw_rectangle=function(x,y,w,h,color){
	this.context.fillStyle=color;
	this.context.fillRect(x,y,w,h);
};
	
typeless_display.prototype.draw_text=function(text,x,y,h,color){
	this.context.font=h+"px Courier New";
	this.context.fillStyle=color;
	this.context.textAlign="center";
	this.context.fillText(text,x,y);
};

typeless_display.prototype.draw_image=function(img,src,dst){
	this.context.drawImage(img,src.x,src.y,src.w,src.h,dst.x,dst.y,dst.w,dst.h);
}

/*******************************************************************************
 * Typeless engine - Base Object 
 ******************************************************************************/

function typeless_object(){
	this.deleted=false;
	this.active=true;
	this.visible=true;

	this.x=0;
	this.y=0;
	this.w=0;
	this.h=0;
	this.a=0;
	this.zx=1;
	this.zy=1;
	this.color="#000000"

	this.children=[]
}

typeless_object.prototype.update_tree=function(dt){
	if(this.active){
		this.update(dt);

		for(var i=0;i<this.children.length;i++){
			var chl=this.children[i];
			if(chl.deleted){
				this.children.splice(i,1);	
			}else if(chl.active){
				chl.update_tree(dt);
			}
		}
	}
};

typeless_object.prototype.draw_tree=function(dsp){
	if(this.visible){
		dsp.context.save();
		if(this.x!=0||this.y!=0)
			dsp.context.translate(this.x,this.y);
		if(this.zx!=0 || this.zy!=0)
			dsp.context.scale(this.zx,this.zy);
		if(this.a!=0)
			dsp.context.rotate(this.a);
		this.draw(dsp);

		for(var i=0;i<this.children.length;i++){
			var chl=this.children[i];
			if(chl.visible){
				dsp.context.save();
				chl.draw_tree(dsp);
				dsp.context.restore();
			}
		}
		dsp.context.restore();
	}
};

typeless_object.prototype.update=function(dt){};

typeless_object.prototype.draw=function(dsp){
	dsp.draw_rectangle(0,0,this.w,this.h,this.color);
};

/*******************************************************************************
 * Typeless Library - Tileset
 ******************************************************************************/

function typeless_tileset(img,tile_w,tile_h,tile_p){
	this.img=img;
	this.tile_w=tile_w;
	this.tile_h=tile_h;
	this.tile_p=tile_p;
}

typeless_tileset.prototype.get_tile_rect=function(r,c,w,h){
	return {
		x:(this.tile_w+this.tile_p)*c+this.tile_p,
		y:(this.tile_h+this.tile_p)*r+this.tile_p,
		w:this.tile_w*w,
		h:this.tile_h*h
	};
}

/*******************************************************************************
 * Typeless engine - Utility Functions 
 ******************************************************************************/

function typeless_inherit(child,base){
	for(var i in base.prototype)
		child.prototype[i]=base.prototype[i];
}

function typeless_get_time(){
	return (new Date()).getTime();
}
