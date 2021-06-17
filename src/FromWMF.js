	function FromWMF ()
	{
	}

	FromWMF.Parse = function(buff, genv)
	{
		buff = new Uint8Array(buff);  var off=0;
		var prms = {fill:false, strk:false, bb:[0,0,1,1], lbb:[0,0,1,1], scl:1, fnt:{nam:"Arial",hgh:25,und:false,orn:0,chrst:0}, tclr:[0,0,0], talg:0};

		var rS = FromWMF.B.readShort, rU = FromWMF.B.readUshort, rU32 = FromWMF.B.readUint;

		var key = rU32(buff,0);
		if(key==0x9AC6CDD7) {
			off = 6;
			var dpi = rS(buff, off+8);  prms.scl=120/dpi;
			for(var i=0; i<4; i++) {  prms.bb[i] = Math.round(rS(buff,off)*prms.scl);  off+=2;  }
			off+=2;
			//console.log(prms.bb, dpi);
			off += 6;
			//console.log(bb, dpi);
		}

		genv.StartPage(prms.bb[0],prms.bb[1],prms.bb[2],prms.bb[3]);



		var gst = UDOC.getState(prms.bb);

		var type = rU(buff, off);  off+=2;
		var hSiz = rU(buff, off);  off+=2;
		var vrsn = rU(buff, off);  off+=2;
		var size = rU32(buff, off);  off+=4;
		var nomb = rU(buff, off);  off+=2;
		var mRec = rU32(buff, off);  off+=4;
		var nomb = rU(buff, off);  off+=2;

		//console.log(type, hSiz, vrsn, size, nomb, mRec, nomb);

		//gst.colr= [0.8,0,0.8];     // purple fill color
		//gst.pth = {  cmds:["M","L","L","L","Z"], crds:[20,20,80,20,80,80,20,80]  };  // a square
		//genv.Fill(gst);
		//console.log(buff.slice(0,64));

		var tab = [];

		var opn=0;
		while(true) {

			var siz = rU32(buff, off)<<1;  off+=4;
			var fnc = rU  (buff, off);     off+=2;
			var fnm = FromWMF.K[fnc];
			var loff = off;

			//if(opn++==24) break;
			var obj = null;
			//console.log(fnm, siz);

			if(false) {}
			else if(fnm=="EOF") break;
			else if(fnm=="ESCAPE") {
				var esf = rU  (buff, off);     loff+=2;
				var fnm2 = FromWMF.K2[esf];
				console.log(fnm, fnm2);
			}
			else if(fnm=="SETMAPMODE" || fnm=="SETPOLYFILLMODE" || fnm=="SETBKMODE") {}
			else if(fnm=="SELECTOBJECT") {
				var ind = rU(buff, loff);  loff+=2;
				var co = tab[ind];  //console.log(co);
				if(co.t=="br") {
					prms.fill=co.stl!=1;
					if     (co.stl==0) {}
					else if(co.stl==1) {}
					else throw co.stl+" e";
					gst.colr=co.clr;
					//if(co.htc!=0) throw co.stl+" "+co.htc+" e";
				}
				else if(co.t=="pn") {
					var stl = (co.stl&7);
					prms.strk=stl!=5;
					if     (stl==0 || stl==6) gst.lwidth = co.px;
					else if(stl==5) {}
					else throw stl+" e";

					if((co.stl&0x1000)!=0) gst.ljoin=2;  // bevel
					else if((co.stl&0x2000)!=0) gst.ljoin=0;  // miter
					else gst.ljoin = 1;  // round
					gst.COLR=co.clr;
				}
				else if(co.t=="fn") {
					prms.fnt = co;
					gst.font.Tf = co.nam;
					gst.font.Tfs = Math.abs(co.hgh);
					gst.font.Tun = co.und;
				}
				else throw "e";
			}
			else if(fnm=="DELETEOBJECT") {
				var ind = rU(buff, loff);  loff+=2;
				tab[ind]=null;
			}
			else if(fnm=="SETWINDOWORG" || fnm=="SETWINDOWEXT") {
				var coff = fnm=="SETWINDOWORG" ? 0 : 2;
				prms.lbb[coff+1] = rS(buff, loff);  loff+=2;
				prms.lbb[coff  ] = rS(buff, loff);  loff+=2;
				FromWMF._updateCtm(prms, gst);
			}
			else if(fnm=="CREATEBRUSHINDIRECT") {
				obj = {t:"br"};
				obj.stl = rU(buff, loff);  loff+=2;
				obj.clr = [buff[loff]/255, buff[loff+1]/255, buff[loff+2]/255];  loff+=4;
				obj.htc = rU(buff, loff);  loff+=2;
			}
			else if(fnm=="CREATEPENINDIRECT") {
				obj = {t:"pn"};
				obj.stl = rU(buff, loff);  loff+=2;
				obj.px  = rS(buff, loff);  loff+=2;
				obj.py  = rS(buff, loff);  loff+=2;  //console.log(stl, px, py);
				obj.clr = [buff[loff]/255, buff[loff+1]/255, buff[loff+2]/255];  loff+=4;
			}
			else if(fnm=="CREATEFONTINDIRECT") {
				obj = {t:"fn", nam:""};
				//obj.stl = rU(buff, loff);  loff+=2;
				obj.hgh = rS(buff, loff);  loff += 2;
				loff += 2*2;
				obj.orn = rS(buff, loff)/10;  loff+=2;
				var wgh = rS(buff, loff);  loff+=2;  //console.log(wgh);
				obj.und = buff[loff+1];  loff += 2;
				obj.stk = buff[loff  ];  obj.chrst = buff[off+1];  loff += 2;  //console.log(obj.chrst);
				loff+=4;
				//console.log(PUtils.readASCII(buff, off, 200));
				while(buff[loff]!=0) {  obj.nam+=String.fromCharCode(buff[loff]);  loff++;  }
				if(wgh>500) obj.nam+="-Bold";
				//console.log(wgh, obj.nam);
				//console.log(obj);
			}
			else if(fnm=="CREATEPALETTE") {  obj = {t:"pl"};  }
			else if(fnm=="SETTEXTCOLOR") prms.tclr = [buff[loff]/255, buff[loff+1]/255, buff[loff+2]/255];
			else if(fnm=="SETTEXTALIGN") prms.talg = rU(buff, loff);
			else if(fnm=="MOVETO" ) {  UDOC.G.moveTo(gst, rS(buff,loff+2), rS(buff,loff));  }
			else if(fnm=="LINETO"   ) {
				if(gst.pth.cmds.length==0) {  var im=gst.ctm.slice(0);  UDOC.M.invert(im);  var p = UDOC.M.multPoint(im, gst.cpos);  UDOC.G.moveTo(gst, p[0], p[1]);  }
				UDOC.G.lineTo(gst, rS(buff,loff+2), rS(buff,loff));  var ofill=prms.fill;  prms.fill=false;  FromWMF._draw(genv, gst, prms);  prms.fill=ofill;
			}
			else if(fnm=="POLYPOLYGON") {
				var nop = rU(buff, loff);  loff+=2;
				var pi = loff;  loff+= nop*2;

				for(var i=0; i<nop; i++) {
					var ppp = rU(buff, pi+i*2);
					loff = FromWMF._drawPoly(buff,loff,ppp,gst, true);
				}
				FromWMF._draw(genv, gst, prms);
			}
			else if(fnm=="POLYGON" || fnm=="POLYLINE") {
				var ppp = rU(buff, loff);  loff+=2;
				loff = FromWMF._drawPoly(buff,loff,ppp,gst, fnm=="POLYGON");
				var ofill = prms.fill;  prms.fill = (ofill && fnm=="POLYGON");
				FromWMF._draw(genv, gst, prms);
				prms.fill = ofill;
			}
			else if(fnm=="RECTANGLE" || fnm=="ELLIPSE") {
				var y1 = rS(buff, loff);  loff+=2;
				var x1 = rS(buff, loff);  loff+=2;
				var y0 = rS(buff, loff);  loff+=2;
				var x0 = rS(buff, loff);  loff+=2;
				if(fnm=="RECTANGLE") {
					UDOC.G.moveTo(gst, x0,y0);  UDOC.G.lineTo(gst, x1,y0);  UDOC.G.lineTo(gst, x1,y1);  UDOC.G.lineTo(gst, x0,y1);
				} else {
					var x = (x0+x1)/2, y = (y0+y1)/2;
					UDOC.G.arc(gst,x,y,(y1-y0)/2,0,2*Math.PI, false);
				}
				UDOC.G.closePath(gst);
				var ofill = prms.fill;  prms.fill = true;
				FromWMF._draw(genv, gst, prms);
				prms.fill = ofill;
			}
			else if(fnm=="STRETCHDIB") {
				var rop = rU32(buff, loff);  loff+=4;
				var cu = rU(buff, loff);  loff+=2;
				var sh = rS(buff, loff);  loff+=2;
				var sw = rS(buff, loff);  loff+=2;
				var sy = rS(buff, loff);  loff+=2;
				var sx = rS(buff, loff);  loff+=2;
				var hD = rS(buff, loff);  loff+=2;
				var wD = rS(buff, loff);  loff+=2;
				var yD = rS(buff, loff);  loff+=2;
				var xD = rS(buff, loff);  loff+=2;
				//console.log(rop, cu, sx,sy,sw,sh,"-",dx,dy,dw,dh);
				var img = FromWMF._loadDIB(buff, loff);

				var ctm = gst.ctm.slice(0);
				gst.ctm = [1,0,0,1,0,0];
				UDOC.M.scale(gst.ctm, wD, -hD);
				UDOC.M.translate(gst.ctm, xD, yD+hD);
				UDOC.M.concat(gst.ctm, ctm);
				genv.PutImage(gst, img, sw, sh);
				gst.ctm = ctm;
			}
			else if(fnm=="EXTTEXTOUT") {
				var rfy = rS(buff, loff);  loff+=2;
				var rfx = rS(buff, loff);  loff+=2;

				gst.font.Tm = [1,0,0,-1,0,0];
				UDOC.M.rotate(gst.font.Tm, prms.fnt.orn*Math.PI/180);
				UDOC.M.translate(gst.font.Tm, rfx, rfy);

				var alg = prms.talg;
				if     ((alg&6)==6) gst.font.Tal = 2;
				else if((alg&7)==0) gst.font.Tal = 0;
				else if((alg&4)==0) gst.font.Tal = 4;
				else throw alg+" e";
				if((alg&24)==24) {}  // baseline
				else if((alg&24)==0) UDOC.M.translate(gst.font.Tm, 0, gst.font.Tfs);
				else throw "e";

				var crs = rU(buff, loff);  loff+=2;
				var ops = rU(buff, loff);  loff+=2;  //if(ops!=0) throw "e";
				if(ops&4) loff+=8;

				//console.log(buff.slice(loff, loff+crs));
				var str = "";
				for(var i=0; i<crs; i++) {
					var cc = buff[loff+i];
					if(cc>127) {  i++;  cc=(cc<<8)|buff[loff+i];  }
					str+=String.fromCharCode(cc);  //console.log(gst.font.Tfs, str);
				}
				//console.log(str);
				//for(var i=0; i<crs; i++) str+=String.fromCharCode(rU(buff,loff+i*2));  //console.log(gst.font.Tfs, str);
				var oclr = gst.colr;  gst.colr = prms.tclr;
				genv.PutText(gst, str, str.length*gst.font.Tfs*0.5);  gst.colr=oclr;
			}
			else {
				console.log(fnm, siz);
			}

			if(obj!=null) {
				var li = 0;
				while(tab[li]!=null) li++;
				tab[li]=obj;
			}

			off+=siz-6;
		}

		genv.ShowPage();  genv.Done();
	}
	FromWMF._loadDIB = function(buff, off) {
		var rS = FromWMF.B.readShort, rU = FromWMF.B.readUshort, rU32 = FromWMF.B.readUint;

		var hsize = rU32(buff, off);  off+=4;

		var w, h, cu;
		if(hsize==0xc) throw "e";
		else {
			w = rU32(buff, off);  off+=4;
			h = rU32(buff, off);  off+=4;
			var ps = rU(buff, off);  off+=2;  if(ps!= 1) throw "e";
			var bc = rU(buff, off);  off+=2;  if(bc!=1 && bc!=24 && bc!=32) throw bc+" e";
			//console.log(w,h,ps,bc);

			var cmpr = rU32(buff, off);  off+=4;  if(cmpr!=0) throw "e";
			var size = rU32(buff, off);  off+=4;
			var xppm = rU32(buff, off);  off+=4;
			var yppm = rU32(buff, off);  off+=4;
			    cu = rU32(buff, off);  off+=4;   //if(cu!=0) throw cu+" e";  // number of colors used ... 0: all colors
			var ci = rU32(buff, off);  off+=4;
			//console.log(cmpr, size, xppm, yppm, cu, ci);
		}

		var area = w*h;
		var img = new Uint8Array(area*4);
		var rl = Math.floor(((w * ps * bc + 31) & ~31) / 8);
		if(bc==1 )
			for(var y=0; y<h; y++) {
				var j = off+cu*4+(h-1-y)*rl;
				for(var x=0; x<w; x++) {
					var qi = (y*w+x)<<2, ind = (buff[j+(x>>>3)]>>>(7-(x&7)))&1;
					img[qi  ] = buff[off+ind*4+2];
					img[qi+1] = buff[off+ind*4+1];
					img[qi+2] = buff[off+ind*4+0];
					img[qi+3] = 255;
				}
			}
		if(bc==24) {
			for(var y=0; y<h; y++)
				for(var x=0; x<w; x++) {
					var qi = (y*w+x)<<2, ti=off+(h-1-y)*rl+x*3;
					img[qi  ] = buff[ti+2];
					img[qi+1] = buff[ti+1];
					img[qi+2] = buff[ti+0];
					img[qi+3] = 255;
				}
		}
		if(bc==32) {
			for(var y=0; y<h; y++)
				for(var x=0; x<w; x++) {
					var qi = (y*w+x)<<2, ti=off+(h-1-y)*rl+x*4;
					img[qi  ] = buff[ti+2];
					img[qi+1] = buff[ti+1];
					img[qi+2] = buff[ti+0];
					img[qi+3] = buff[ti+3];
				}
		}
		return img;
	}


	FromWMF._updateCtm = function(prms, gst) {
		var mat = [1,0,0,1,0,0];
		var lbb = prms.lbb, bb = prms.bb;

		UDOC.M.translate(mat, -lbb[0],-lbb[1]);
		UDOC.M.scale(mat, 1/lbb[2], 1/lbb[3]);

		UDOC.M.scale(mat, bb[2]-bb[0],bb[3]-bb[1]);
		UDOC.M.translate(mat, bb[0],bb[1]);

		gst.ctm = mat;
	}
	FromWMF._draw = function(genv, gst, prms) {
		if(prms.fill                 ) genv.Fill  (gst, false);
		if(prms.strk && gst.lwidth!=0) genv.Stroke(gst, false);
		UDOC.G.newPath(gst);
	}
	FromWMF._drawPoly = function(buff, off, ppp, gst, cls) {
		var rS = FromWMF.B.readShort;
		for(var j=0; j<ppp; j++) {
			var px = rS(buff, off);  off+=2;
			var py = rS(buff, off);  off+=2;
			if(j==0) UDOC.G.moveTo(gst,px,py);  else UDOC.G.lineTo(gst,px,py);
		}
		if(cls) UDOC.G.closePath(gst);
		return off;
	}

	FromWMF.B = {
		uint8 : new Uint8Array(4),
		readShort  : function(buff,p)  {  var u8=FromWMF.B.uint8;  u8[0]=buff[p];  u8[1]=buff[p+1];  return FromWMF.B.int16 [0];  },
		readUshort : function(buff,p)  {  var u8=FromWMF.B.uint8;  u8[0]=buff[p];  u8[1]=buff[p+1];  return FromWMF.B.uint16[0];  },
		readUint   : function(buff,p)  {  var u8=FromWMF.B.uint8;  u8[0]=buff[p];  u8[1]=buff[p+1];  u8[2]=buff[p+2];  u8[3]=buff[p+3];  return FromWMF.B.uint32[0];  },
		//readUint   : function(buff,p)  {  return (buff[p]*(256*256*256)) + ((buff[p+1]<<16) | (buff[p+2]<< 8) | buff[p+3]);  },
		readASCII  : function(buff,p,l){  var s = "";  for(var i=0; i<l; i++) s += String.fromCharCode(buff[p+i]);  return s;    }
	}
	FromWMF.B.int16  = new Int16Array (FromWMF.B.uint8.buffer);
	FromWMF.B.uint16 = new Uint16Array(FromWMF.B.uint8.buffer);
	FromWMF.B.uint32 = new Uint32Array(FromWMF.B.uint8.buffer);


	FromWMF.C = {
		META_EOF : 0x0000,
		META_REALIZEPALETTE : 0x0035,
		META_SETPALENTRIES : 0x0037,
		META_SETBKMODE : 0x0102,
		META_SETMAPMODE : 0x0103,
		META_SETROP2 : 0x0104,
		META_SETRELABS : 0x0105,
		META_SETPOLYFILLMODE : 0x0106,
		META_SETSTRETCHBLTMODE : 0x0107,
		META_SETTEXTCHAREXTRA : 0x0108,
		META_RESTOREDC : 0x0127,
		META_RESIZEPALETTE : 0x0139,
		META_DIBCREATEPATTERNBRUSH : 0x0142,
		META_SETLAYOUT : 0x0149,
		META_SETBKCOLOR : 0x0201,
		META_SETTEXTCOLOR : 0x0209,
		META_OFFSETVIEWPORTORG : 0x0211,
		META_LINETO : 0x0213,
		META_MOVETO : 0x0214,
		META_OFFSETCLIPRGN : 0x0220,
		META_FILLREGION : 0x0228,
		META_SETMAPPERFLAGS : 0x0231,
		META_SELECTPALETTE : 0x0234,
		META_POLYGON : 0x0324,
		META_POLYLINE : 0x0325,
		META_SETTEXTJUSTIFICATION : 0x020A,
		META_SETWINDOWORG : 0x020B,
		META_SETWINDOWEXT : 0x020C,
		META_SETVIEWPORTORG : 0x020D,
		META_SETVIEWPORTEXT : 0x020E,
		META_OFFSETWINDOWORG : 0x020F,
		META_SCALEWINDOWEXT : 0x0410,
		META_SCALEVIEWPORTEXT : 0x0412,
		META_EXCLUDECLIPRECT : 0x0415,
		META_INTERSECTCLIPRECT : 0x0416,
		META_ELLIPSE : 0x0418,
		META_FLOODFILL : 0x0419,
		META_FRAMEREGION : 0x0429,
		META_ANIMATEPALETTE : 0x0436,
		META_TEXTOUT : 0x0521,
		META_POLYPOLYGON : 0x0538,
		META_EXTFLOODFILL : 0x0548,
		META_RECTANGLE : 0x041B,
		META_SETPIXEL : 0x041F,
		META_ROUNDRECT : 0x061C,
		META_PATBLT : 0x061D,
		META_SAVEDC : 0x001E,
		META_PIE : 0x081A,
		META_STRETCHBLT : 0x0B23,
		META_ESCAPE : 0x0626,
		META_INVERTREGION : 0x012A,
		META_PAINTREGION : 0x012B,
		META_SELECTCLIPREGION : 0x012C,
		META_SELECTOBJECT : 0x012D,
		META_SETTEXTALIGN : 0x012E,
		META_ARC : 0x0817,
		META_CHORD : 0x0830,
		META_BITBLT : 0x0922,
		META_EXTTEXTOUT : 0x0a32,
		META_SETDIBTODEV : 0x0d33,
		META_DIBBITBLT : 0x0940,
		META_DIBSTRETCHBLT : 0x0b41,
		META_STRETCHDIB : 0x0f43,
		META_DELETEOBJECT : 0x01f0,
		META_CREATEPALETTE : 0x00f7,
		META_CREATEPATTERNBRUSH : 0x01F9,
		META_CREATEPENINDIRECT : 0x02FA,
		META_CREATEFONTINDIRECT : 0x02FB,
		META_CREATEBRUSHINDIRECT : 0x02FC,
		META_CREATEREGION : 0x06FF
	};

	FromWMF.C2 = {
		NEWFRAME : 0x0001,
		ABORTDOC : 0x0002,
		NEXTBAND : 0x0003,
		SETCOLORTABLE : 0x0004,
		GETCOLORTABLE : 0x0005,
		FLUSHOUT : 0x0006,
		DRAFTMODE : 0x0007,
		QUERYESCSUPPORT : 0x0008,
		SETABORTPROC : 0x0009,
		STARTDOC : 0x000A,
		ENDDOC : 0x000B,
		GETPHYSPAGESIZE : 0x000C,
		GETPRINTINGOFFSET : 0x000D,
		GETSCALINGFACTOR : 0x000E,
		META_ESCAPE_ENHANCED_METAFILE : 0x000F,
		SETPENWIDTH : 0x0010,
		SETCOPYCOUNT : 0x0011,
		SETPAPERSOURCE : 0x0012,
		PASSTHROUGH : 0x0013,
		GETTECHNOLOGY : 0x0014,
		SETLINECAP : 0x0015,
		SETLINEJOIN : 0x0016,
		SETMITERLIMIT : 0x0017,
		BANDINFO : 0x0018,
		DRAWPATTERNRECT : 0x0019,
		GETVECTORPENSIZE : 0x001A,
		GETVECTORBRUSHSIZE : 0x001B,
		ENABLEDUPLEX : 0x001C,
		GETSETPAPERBINS : 0x001D,
		GETSETPRINTORIENT : 0x001E,
		ENUMPAPERBINS : 0x001F,
		SETDIBSCALING : 0x0020,
		EPSPRINTING : 0x0021,
		ENUMPAPERMETRICS : 0x0022,
		GETSETPAPERMETRICS : 0x0023,
		POSTSCRIPT_DATA : 0x0025,
		POSTSCRIPT_IGNORE : 0x0026,
		GETDEVICEUNITS : 0x002A,
		GETEXTENDEDTEXTMETRICS : 0x0100,
		GETPAIRKERNTABLE : 0x0102,
		EXTTEXTOUT : 0x0200,
		GETFACENAME : 0x0201,
		DOWNLOADFACE : 0x0202,
		METAFILE_DRIVER : 0x0801,
		QUERYDIBSUPPORT : 0x0C01,
		BEGIN_PATH : 0x1000,
		CLIP_TO_PATH : 0x1001,
		END_PATH : 0x1002,
		OPEN_CHANNEL : 0x100E,
		DOWNLOADHEADER : 0x100F,
		CLOSE_CHANNEL : 0x1010,
		POSTSCRIPT_PASSTHROUGH : 0x1013,
		ENCAPSULATED_POSTSCRIPT : 0x1014,
		POSTSCRIPT_IDENTIFY : 0x1015,
		POSTSCRIPT_INJECTION : 0x1016,
		CHECKJPEGFORMAT : 0x1017,
		CHECKPNGFORMAT : 0x1018,
		GET_PS_FEATURESETTING : 0x1019,
		MXDC_ESCAPE : 0x101A,
		SPCLPASSTHROUGH2 : 0x11D8
	}
	FromWMF.K = [];
	FromWMF.K2= [];

	(function() {
		var inp, out, stt;
		inp = FromWMF.C;   out = FromWMF.K;   stt=5;
		for(var p in inp) out[inp[p]] = p.slice(stt);
		inp = FromWMF.C2;  out = FromWMF.K2;  stt=0;
		for(var p in inp) out[inp[p]] = p.slice(stt);
		//console.log(FromWMF.K, FromWMF.K2);
	}  )();
