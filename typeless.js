/*******************************************************************************
 * Typeless engine - Display 
 ******************************************************************************/

function typeless_display(w,h,dom_parent){
	this.canvas=document.createElement("canvas");
	this.canvas.width=w;
	this.canvas.height=h;
	this.canvas.tabIndex=0;

	this.context=this.canvas.getContext("2d");
	this.context.imageSmoothingEnabled=false;
	this.context.webkitImageSmoothingEnabled=false;
	this.context.mozImageSmoothingEnabled=false;

	this.x=0;
	this.y=0;
	this.zx=1;
	this.zy=1;
	this.a=0;

	if(dom_parent!=null){
		dom_parent.appendChild(this.canvas);
		this.canvas.focus();
	}
};

typeless_display.prototype.fill=function(color){
	this.context.fillStyle=color;
	this.context.fillRect(0,0,this.canvas.width,this.canvas.height);
};

typeless_display.prototype.draw_rectangle=function(x,y,w,h,color){
	this.context.fillStyle=color;
	this.context.fillRect(
		Math.round(this.x+this.zx*x),
		Math.round(this.y+this.zy*y),
		Math.round(this.zx*w),
		Math.round(this.zy*h)
	);
};
	
typeless_display.prototype.draw_text=function(text,x,y,h,color,align){
	this.context.font=this.zy*h+"px Courier New";
	this.context.fillStyle=color;
	this.context.textAlign=align;
	this.context.fillText(
		text,
		Math.round(this.x+this.zx*x),
		Math.round(this.y+this.zy*y)
	);
};

typeless_display.prototype.draw_image=function(img,src,dst){
	this.context.drawImage(
		img,
		Math.round(src.x),
		Math.round(src.y),
		Math.round(src.w),
		Math.round(src.h),
		Math.round(this.x+this.zx*dst.x),
		Math.round(this.y+this.zy*dst.y),
		Math.round(this.zx*dst.w),
		Math.round(this.zy*dst.h)
	);
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

	this.parent=null;
	this.children=[]
	this.push_child=this.children.push;
	this.pop_child=this.children.pop;
	this.splice_children=this.children.splice;
	var me=this;
	this.children.push=function(new_element){
		me.push_child.call(this,new_element);
		new_element.parent=me;
	}
	this.children.concat=function(new_array){
		for(var i=0; i<new_array.length; i++)
			this.push(new_array[i]);
	}
	this.children.pop=function(){
		var deleted=me.pop_child.call(this)	
		deleted.parent=null;
		return deleted;
	}
	this.children.splice=function(from,n){
		var deleted=me.splice_children.call(this,from,n);
		for(var i=0; i<deleted.length; i++)
			deleted[i].parent=null;
		return deleted;
	}
}

typeless_object.prototype.update_tree=function(dt){
	if(this.active){
		for(var i=0;i<this.children.length;i++){
			var chl=this.children[i];
			if(chl.deleted){
				this.children.splice(i,1);	
			}else if(chl.active){
				chl.update_tree(dt);
			}
		}
		this.update(dt);
	}
};

typeless_object.prototype.draw_tree=function(dsp){
	if(this.visible){
		var sx=dsp.x;
		var sy=dsp.y;
		dsp.x+=this.x*dsp.zx;
		dsp.y+=this.y*dsp.zy;
		dsp.zx*=this.zx;
		dsp.zy*=this.zy;
		dsp.a+=this.a;
		if(this.a!=0){
			dsp.context.save();		

			var rx=Math.cos(this.a)*dsp.x+Math.sin(this.a)*dsp.y;
			var ry=-Math.sin(this.a)*dsp.x+Math.cos(this.a)*dsp.y;
			dsp.x=rx;
			dsp.y=ry;
			dsp.context.rotate(this.a);
		}

		this.draw(dsp);
		for(var i=0;i<this.children.length;i++){
			var chl=this.children[i];
			if(chl.visible)
				chl.draw_tree(dsp);
		}

		dsp.x=sx;
		dsp.y=sy;
		dsp.a-=this.a;
		dsp.zx/=this.zx;
		dsp.zy/=this.zy;
		if(this.a!=0)
			dsp.context.restore();
	}
};

typeless_object.prototype.update=function(dt){};

typeless_object.prototype.draw=function(dsp){
	dsp.draw_rectangle(0,0,this.w,this.h,this.color);
};

typeless_object.prototype.drawing_rect=function(x,y){
	var obj=this;
	var tx=0;
	var tw=1;
	var ty=0;
	var th=1;

	if(x)
		tx=x;
	if(y)
		ty=y;

	while(obj!=null){
		tx*=obj.zx;
		tw*=obj.zx;
		ty*=obj.zy;
		th*=obj.zx;
		if(obj.a!=0){
			var rx=Math.cos(obj.a)*tx-Math.sin(obj.a)*ty;
			var ry=Math.sin(obj.a)*tx+Math.cos(obj.a)*ty;
			tx=rx;
			ty=ry;
		}
		tx+=obj.x;
		ty+=obj.y;
		obj=obj.parent;
	}

	return({x:tx, y:ty, w:tw*this.w, h:th*this.h, zx:tw, zy:th});
}

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
