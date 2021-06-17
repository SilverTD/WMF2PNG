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

function ToContext2D(needPage, scale)
{
    this.canvas = document.createElement("canvas");
    this.ctx = this.canvas.getContext("2d");
    this.bb = null;
    this.currPage = 0;
    this.needPage = needPage;
    this.scale = scale;
}
ToContext2D.prototype.StartPage = function(x,y,w,h) {
    if(this.currPage!=this.needPage) return;
    this.bb = [x,y,w,h];
    var scl = this.scale, dpr = window.devicePixelRatio;
    var cnv = this.canvas, ctx = this.ctx;
    cnv.width = Math.round(w*scl);  cnv.height = Math.round(h*scl);
    ctx.translate(0,h*scl);  ctx.scale(scl,-scl);
    cnv.setAttribute("style", "border:1px solid; width:"+(cnv.width/dpr)+"px; height:"+(cnv.height/dpr)+"px");
}
ToContext2D.prototype.Fill = function(gst, evenOdd) {
    if(this.currPage!=this.needPage) return;
    var ctx = this.ctx;
    ctx.beginPath();
    this._setStyle(gst, ctx);
    this._draw(gst.pth, ctx);
    ctx.fill();
}
ToContext2D.prototype.Stroke = function(gst) {
    if(this.currPage!=this.needPage) return;
    var ctx = this.ctx;
    ctx.beginPath();
    this._setStyle(gst, ctx);
    this._draw(gst.pth, ctx);
    ctx.stroke();
}
ToContext2D.prototype.PutText = function(gst, str, stw) {
    if(this.currPage!=this.needPage) return;
    var scl = this._scale(gst.ctm);
    var ctx = this.ctx;
    this._setStyle(gst, ctx);
    ctx.save();
    var m = [1,0,0,-1,0,0];  this._concat(m, gst.font.Tm);  this._concat(m, gst.ctm);
    //console.log(str, m, gst);  throw "e";
    ctx.transform(m[0],m[1],m[2],m[3],m[4],m[5]);
    ctx.fillText(str,0,0);
    ctx.restore();
}
ToContext2D.prototype.PutImage = function(gst, buff, w, h, msk) {
    if(this.currPage!=this.needPage) return;
    var ctx = this.ctx;

    if(buff.length==w*h*4) {
        buff = buff.slice(0);
        if(msk && msk.length==w*h*4) for(var i=0; i<buff.length; i+=4) buff[i+3] = msk[i+1];

        var cnv = document.createElement("canvas"), cctx = cnv.getContext("2d");
        cnv.width = w;  cnv.height = h;
        var imgd = cctx.createImageData(w,h);
        for(var i=0; i<buff.length; i++) imgd.data[i]=buff[i];
        cctx.putImageData(imgd,0,0);

        ctx.save();
        var m = [1,0,0,1,0,0];  this._concat(m, [1/w,0,0,-1/h,0,1]);  this._concat(m, gst.ctm);
        ctx.transform(m[0],m[1],m[2],m[3],m[4],m[5]);
        ctx.drawImage(cnv,0,0);
        ctx.restore();
    }
}
ToContext2D.prototype.ShowPage = function() {  this.currPage++;  }
ToContext2D.prototype.Done = function() {}


ToContext2D.prototype._setStyle = function(gst, ctx) {
    var scl = this._scale(gst.ctm);
    ctx.fillStyle = this._getFill(gst.colr, gst.ca, ctx);
    ctx.strokeStyle=this._getFill(gst.COLR, gst.CA, ctx);

    ctx.lineCap = ["butt","round","square"][gst.lcap];
    ctx.lineJoin= ["miter","round","bevel"][gst.ljoin];
    ctx.lineWidth=gst.lwidth*scl;
    var dsh = gst.dash.slice(0);  for(var i=0; i<dsh.length; i++) dsh[i] = ToPDF._flt(dsh[i]*scl);
    ctx.setLineDash(dsh);
    ctx.miterLimit = gst.mlimit*scl;

    var fn = gst.font.Tf, ln = fn.toLowerCase();
    var p0 = ln.indexOf("bold")!=-1 ? "bold " : "";
    var p1 = (ln.indexOf("italic")!=-1 || ln.indexOf("oblique")!=-1) ? "italic " : "";
    ctx.font = p0+p1 + gst.font.Tfs+"px \""+fn+"\"";
}
ToContext2D.prototype._getFill = function(colr, ca, ctx)
{
    if(colr.typ==null) return this._colr(colr,ca);
    else {
        var grd = colr, crd = grd.crds, mat = grd.mat, scl=this._scale(mat), gf;
        if     (grd.typ=="lin") {
            var p0 = this._multPoint(mat,crd.slice(0,2)), p1 = this._multPoint(mat,crd.slice(2));
            gf=ctx.createLinearGradient(p0[0],p0[1],p1[0],p1[1]);
        }
        else if(grd.typ=="rad") {
            var p0 = this._multPoint(mat,crd.slice(0,2)), p1 = this._multPoint(mat,crd.slice(3));
            gf=ctx.createRadialGradient(p0[0],p0[1],crd[2]*scl,p1[0],p1[1],crd[5]*scl);
        }
        for(var i=0; i<grd.grad.length; i++)  gf.addColorStop(grd.grad[i][0],this._colr(grd.grad[i][1], ca));
        return gf;
    }
}
ToContext2D.prototype._colr  = function(c,a) {  return "rgba("+Math.round(c[0]*255)+","+Math.round(c[1]*255)+","+Math.round(c[2]*255)+","+a+")";  };
ToContext2D.prototype._scale = function(m)  {  return Math.sqrt(Math.abs(m[0]*m[3]-m[1]*m[2]));  };
ToContext2D.prototype._concat= function(m,w  ) {
        var a=m[0],b=m[1],c=m[2],d=m[3],tx=m[4],ty=m[5];
        m[0] = (a *w[0])+(b *w[2]);       m[1] = (a *w[1])+(b *w[3]);
        m[2] = (c *w[0])+(d *w[2]);       m[3] = (c *w[1])+(d *w[3]);
        m[4] = (tx*w[0])+(ty*w[2])+w[4];  m[5] = (tx*w[1])+(ty*w[3])+w[5];
}
ToContext2D.prototype._multPoint= function(m, p) {  var x=p[0],y=p[1];  return [x*m[0]+y*m[2]+m[4],   x*m[1]+y*m[3]+m[5]];  },
ToContext2D.prototype._draw  = function(path, ctx)
{
    var c = 0, crds = path.crds;
    for(var j=0; j<path.cmds.length; j++) {
        var cmd = path.cmds[j];
        if     (cmd=="M") {  ctx.moveTo(crds[c], crds[c+1]);  c+=2;  }
        else if(cmd=="L") {  ctx.lineTo(crds[c], crds[c+1]);  c+=2;  }
        else if(cmd=="C") {  ctx.bezierCurveTo(crds[c], crds[c+1], crds[c+2], crds[c+3], crds[c+4], crds[c+5]);  c+=6;  }
        else if(cmd=="Q") {  ctx.quadraticCurveTo(crds[c], crds[c+1], crds[c+2], crds[c+3]);  c+=4;  }
        else if(cmd=="Z") {  ctx.closePath();  }
    }
}

var UDOC = {};

UDOC.G = {
    concat : function(p,r) {
        for(var i=0; i<r.cmds.length; i++) p.cmds.push(r.cmds[i]);
        for(var i=0; i<r.crds.length; i++) p.crds.push(r.crds[i]);
    },
    getBB  : function(ps) {
        var x0=1e99, y0=1e99, x1=-x0, y1=-y0;
        for(var i=0; i<ps.length; i+=2) {  var x=ps[i],y=ps[i+1];  if(x<x0)x0=x; else if(x>x1)x1=x;  if(y<y0)y0=y;  else if(y>y1)y1=y;  }
        return [x0,y0,x1,y1];
    },
    rectToPath: function(r) {  return  {cmds:["M","L","L","L","Z"],crds:[r[0],r[1],r[2],r[1], r[2],r[3],r[0],r[3]]};  },
    // a inside b
    insideBox: function(a,b) {  return b[0]<=a[0] && b[1]<=a[1] && a[2]<=b[2] && a[3]<=b[3];   },
    isBox : function(p, bb) {
        var sameCrd8 = function(pcrd, crds) {
            for(var o=0; o<8; o+=2) {  var eq = true;  for(var j=0; j<8; j++) if(Math.abs(crds[j]-pcrd[(j+o)&7])>=2) {  eq = false;  break;  }    if(eq) return true;  }
            return false;
        };
        if(p.cmds.length>10) return false;
        var cmds=p.cmds.join(""), crds=p.crds;
        var sameRect = false;
        if((cmds=="MLLLZ"  && crds.length== 8)
         ||(cmds=="MLLLLZ" && crds.length==10) ) {
            if(crds.length==10) crds=crds.slice(0,8);
            var x0=bb[0],y0=bb[1],x1=bb[2],y1=bb[3];
            if(!sameRect) sameRect = sameCrd8(crds, [x0,y0,x1,y0,x1,y1,x0,y1]);
            if(!sameRect) sameRect = sameCrd8(crds, [x0,y1,x1,y1,x1,y0,x0,y0]);
        }
        return sameRect;
    },
    boxArea: function(a) {  var w=a[2]-a[0], h=a[3]-a[1];  return w*h;  },
    newPath: function(gst    ) {  gst.pth = {cmds:[], crds:[]};  },
    moveTo : function(gst,x,y) {  var p=UDOC.M.multPoint(gst.ctm,[x,y]);  //if(gst.cpos[0]==p[0] && gst.cpos[1]==p[1]) return;
                                    gst.pth.cmds.push("M");  gst.pth.crds.push(p[0],p[1]);  gst.cpos = p;  },
    lineTo : function(gst,x,y) {  var p=UDOC.M.multPoint(gst.ctm,[x,y]);  if(gst.cpos[0]==p[0] && gst.cpos[1]==p[1]) return;
                                    gst.pth.cmds.push("L");  gst.pth.crds.push(p[0],p[1]);  gst.cpos = p;  },
    curveTo: function(gst,x1,y1,x2,y2,x3,y3) {   var p;
        p=UDOC.M.multPoint(gst.ctm,[x1,y1]);  x1=p[0];  y1=p[1];
        p=UDOC.M.multPoint(gst.ctm,[x2,y2]);  x2=p[0];  y2=p[1];
        p=UDOC.M.multPoint(gst.ctm,[x3,y3]);  x3=p[0];  y3=p[1];  gst.cpos = p;
        gst.pth.cmds.push("C");
        gst.pth.crds.push(x1,y1,x2,y2,x3,y3);
    },
    closePath: function(gst  ) {  gst.pth.cmds.push("Z");  },
    arc : function(gst,x,y,r,a0,a1, neg) {

        // circle from a0 counter-clock-wise to a1
        if(neg) while(a1>a0) a1-=2*Math.PI;
        else    while(a1<a0) a1+=2*Math.PI;
        var th = (a1-a0)/4;

        var x0 = Math.cos(th/2), y0 = -Math.sin(th/2);
        var x1 = (4-x0)/3, y1 = y0==0 ? y0 : (1-x0)*(3-x0)/(3*y0);
        var x2 = x1, y2 = -y1;
        var x3 = x0, y3 = -y0;

        var p0 = [x0,y0], p1 = [x1,y1], p2 = [x2,y2], p3 = [x3,y3];

        var pth = {cmds:[(gst.pth.cmds.length==0)?"M":"L","C","C","C","C"], crds:[x0,y0,x1,y1,x2,y2,x3,y3]};

        var rot = [1,0,0,1,0,0];  UDOC.M.rotate(rot,-th);

        for(var i=0; i<3; i++) {
            p1 = UDOC.M.multPoint(rot,p1);  p2 = UDOC.M.multPoint(rot,p2);  p3 = UDOC.M.multPoint(rot,p3);
            pth.crds.push(p1[0],p1[1],p2[0],p2[1],p3[0],p3[1]);
        }

        var sc = [r,0,0,r,x,y];
        UDOC.M.rotate(rot, -a0+th/2);  UDOC.M.concat(rot, sc);  UDOC.M.multArray(rot, pth.crds);
        UDOC.M.multArray(gst.ctm, pth.crds);

        UDOC.G.concat(gst.pth, pth);
        var y=pth.crds.pop();  x=pth.crds.pop();
        gst.cpos = [x,y];
    },
    toPoly : function(p) {
        if(p.cmds[0]!="M" || p.cmds[p.cmds.length-1]!="Z") return null;
        for(var i=1; i<p.cmds.length-1; i++) if(p.cmds[i]!="L") return null;
        var out = [], cl = p.crds.length;
        if(p.crds[0]==p.crds[cl-2] && p.crds[1]==p.crds[cl-1]) cl-=2;
        for(var i=0; i<cl; i+=2) out.push([p.crds[i],p.crds[i+1]]);
        if(UDOC.G.polyArea(p.crds)<0) out.reverse();
        return out;
    },
    fromPoly : function(p) {
        var o = {cmds:[],crds:[]};
        for(var i=0; i<p.length; i++) { o.crds.push(p[i][0], p[i][1]);  o.cmds.push(i==0?"M":"L");  }
        o.cmds.push("Z");
        return o;
    },
    polyArea : function(p) {
        if(p.length <6) return 0;
        var l = p.length - 2;
        var sum = (p[0]-p[l]) * (p[l+1]+p[1]);
        for(var i=0; i<l; i+=2)
            sum += (p[i+2]-p[i]) * (p[i+1]+p[i+3]);
        return - sum * 0.5;
    },
    polyClip : function(p0, p1) {  // p0 clipped by p1
        var cp1, cp2, s, e;
        var inside = function (p) {
            return (cp2[0]-cp1[0])*(p[1]-cp1[1]) > (cp2[1]-cp1[1])*(p[0]-cp1[0]);
        };
        var isc = function () {
            var dc = [ cp1[0] - cp2[0], cp1[1] - cp2[1] ],
                dp = [ s[0] - e[0], s[1] - e[1] ],
                n1 = cp1[0] * cp2[1] - cp1[1] * cp2[0],
                n2 = s[0] * e[1] - s[1] * e[0],
                n3 = 1.0 / (dc[0] * dp[1] - dc[1] * dp[0]);
            return [(n1*dp[0] - n2*dc[0]) * n3, (n1*dp[1] - n2*dc[1]) * n3];
        };
        var out = p0;
        cp1 = p1[p1.length-1];
        for (j in p1) {
            var cp2 = p1[j];
            var inp = out;
            out = [];
            s = inp[inp.length - 1]; //last on the input list
            for (i in inp) {
                var e = inp[i];
                if (inside(e)) {
                    if (!inside(s)) {
                        out.push(isc());
                    }
                    out.push(e);
                }
                else if (inside(s)) {
                    out.push(isc());
                }
                s = e;
            }
            cp1 = cp2;
        }
        return out
    }
}
UDOC.M = {
    getScale : function(m) {  return Math.sqrt(Math.abs(m[0]*m[3]-m[1]*m[2]));  },
    translate: function(m,x,y) {  UDOC.M.concat(m, [1,0,0,1,x,y]);  },
    rotate   : function(m,a  ) {  UDOC.M.concat(m, [Math.cos(a), -Math.sin(a), Math.sin(a), Math.cos(a),0,0]);  },
    scale    : function(m,x,y) {  UDOC.M.concat(m, [x,0,0,y,0,0]);  },
    concat   : function(m,w  ) {
        var a=m[0],b=m[1],c=m[2],d=m[3],tx=m[4],ty=m[5];
        m[0] = (a *w[0])+(b *w[2]);       m[1] = (a *w[1])+(b *w[3]);
        m[2] = (c *w[0])+(d *w[2]);       m[3] = (c *w[1])+(d *w[3]);
        m[4] = (tx*w[0])+(ty*w[2])+w[4];  m[5] = (tx*w[1])+(ty*w[3])+w[5];
    },
    invert   : function(m    ) {
        var a=m[0],b=m[1],c=m[2],d=m[3],tx=m[4],ty=m[5], adbc=a*d-b*c;
        m[0] = d/adbc;  m[1] = -b/adbc;  m[2] =-c/adbc;  m[3] =  a/adbc;
        m[4] = (c*ty - d*tx)/adbc;  m[5] = (b*tx - a*ty)/adbc;
    },
    multPoint: function(m, p ) {  var x=p[0],y=p[1];  return [x*m[0]+y*m[2]+m[4],   x*m[1]+y*m[3]+m[5]];  },
    multArray: function(m, a ) {  for(var i=0; i<a.length; i+=2) {  var x=a[i],y=a[i+1];  a[i]=x*m[0]+y*m[2]+m[4];  a[i+1]=x*m[1]+y*m[3]+m[5];  }  }
}
UDOC.C = {
    srgbGamma : function(x) {  return x < 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1.0 / 2.4) - 0.055;  },
    cmykToRgb : function(clr) {
        var c=clr[0], m=clr[1], y=clr[2], k=clr[3];
        // return [1-Math.min(1,c+k), 1-Math.min(1, m+k), 1-Math.min(1,y+k)];
        var r = 255
        + c * (-4.387332384609988  * c + 54.48615194189176  * m +  18.82290502165302  * y + 212.25662451639585 * k +  -285.2331026137004)
        + m * ( 1.7149763477362134 * m - 5.6096736904047315 * y + -17.873870861415444 * k - 5.497006427196366)
        + y * (-2.5217340131683033 * y - 21.248923337353073 * k +  17.5119270841813)
        + k * (-21.86122147463605  * k - 189.48180835922747);
        var g = 255
        + c * (8.841041422036149   * c + 60.118027045597366 * m +  6.871425592049007  * y + 31.159100130055922 * k +  -79.2970844816548)
        + m * (-15.310361306967817 * m + 17.575251261109482 * y +  131.35250912493976 * k - 190.9453302588951)
        + y * (4.444339102852739   * y + 9.8632861493405    * k -  24.86741582555878)
        + k * (-20.737325471181034 * k - 187.80453709719578);
        var b = 255
        + c * (0.8842522430003296  * c + 8.078677503112928  * m +  30.89978309703729  * y - 0.23883238689178934 * k + -14.183576799673286)
        + m * (10.49593273432072   * m + 63.02378494754052  * y +  50.606957656360734 * k - 112.23884253719248)
        + y * (0.03296041114873217 * y + 115.60384449646641 * k + -193.58209356861505)
        + k * (-22.33816807309886  * k - 180.12613974708367);

        return [Math.max(0, Math.min(1, r/255)), Math.max(0, Math.min(1, g/255)), Math.max(0, Math.min(1, b/255))];
        //var iK = 1-c[3];
        //return [(1-c[0])*iK, (1-c[1])*iK, (1-c[2])*iK];
    },
    labToRgb  : function(lab) {
        var k = 903.3, e = 0.008856, L = lab[0], a = lab[1], b = lab[2];
        var fy = (L+16)/116, fy3 = fy*fy*fy;
        var fz = fy - b/200, fz3 = fz*fz*fz;
        var fx = a/500 + fy, fx3 = fx*fx*fx;
        var zr = fz3>e ? fz3 : (116*fz-16)/k;
        var yr = fy3>e ? fy3 : (116*fy-16)/k;
        var xr = fx3>e ? fx3 : (116*fx-16)/k;

        var X = xr*96.72, Y = yr*100, Z = zr*81.427, xyz = [X/100,Y/100,Z/100];
        var x2s = [3.1338561, -1.6168667, -0.4906146, -0.9787684,  1.9161415,  0.0334540, 0.0719453, -0.2289914,  1.4052427];

        var rgb = [ x2s[0]*xyz[0] + x2s[1]*xyz[1] + x2s[2]*xyz[2],
                    x2s[3]*xyz[0] + x2s[4]*xyz[1] + x2s[5]*xyz[2],
                    x2s[6]*xyz[0] + x2s[7]*xyz[1] + x2s[8]*xyz[2]  ];
        for(var i=0; i<3; i++) rgb[i] = Math.max(0, Math.min(1, UDOC.C.srgbGamma(rgb[i])));
        return rgb;
    }
}

UDOC.getState = function(crds) {
    return {
        font : UDOC.getFont(),
        dd: {flat:1},  // device-dependent
        space :"/DeviceGray",
        // fill
        ca: 1,
        colr  : [0,0,0],
        sspace:"/DeviceGray",
        // stroke
        CA: 1,
        COLR : [0,0,0],
        bmode: "/Normal",
        SA:false, OPM:0, AIS:false, OP:false, op:false, SMask:"/None",
        lwidth : 1,
        lcap: 0,
        ljoin: 0,
        mlimit: 10,
        SM : 0.1,
        doff: 0,
        dash: [],
        ctm : [1,0,0,1,0,0],
        cpos: [0,0],
        pth : {cmds:[],crds:[]},
        cpth: crds ? UDOC.G.rectToPath(crds) : null  // clipping path
    };
}

UDOC.getFont = function() {
    return {
        Tc: 0, // character spacing
        Tw: 0, // word spacing
        Th:100, // horizontal scale
        Tl: 0, // leading
        Tf:"Helvetica-Bold",
        Tfs:1, // font size
        Tmode:0, // rendering mode
        Trise:0, // rise
        Tk: 0,  // knockout
        Tal:0,  // align, 0: left, 1: right, 2: center
        Tun:0,  // 0: no, 1: underline

        Tm :[1,0,0,1,0,0],
        Tlm:[1,0,0,1,0,0],
        Trm:[1,0,0,1,0,0]
    };
}

const WMF2PNG = (() => {

function WMF2PNG_()
{
}

WMF2PNG_.prototype.getBase64 = async function(file)
{
    return new Promise((res, rej) => {
        const reader = new FileReader();
        reader.onload = () => {
          res(reader.result);
        };
        reader.readAsDataURL(file);
    });
};

WMF2PNG_.prototype.getPNG = async function(file)
{
    if (typeof file === "string") {
        const base64 = file.replace(/.*;base64,/, '');
        return this.transformWMF(base64);
    }
    const src = await this.getBase64(file);
    const base64 = src.replace(/.*;base64,/, '');
    return this.transformWMF(base64);
};

WMF2PNG_.prototype.transformWMF = function(base64)
{
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = rawData.length - 1; i >= 0; --i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    let pNum = 0;
    let scale = 1;
    let wrt = new ToContext2D(pNum, scale);
    FromWMF.Parse(outputArray, wrt);
    let canvas = wrt.canvas;
    let { width, height } = canvas;
    let ctx = canvas.getContext('2d');
    let { data } = ctx.getImageData(0, 0, width, height);
    let row_len = width * 4;
    let col_len = height;
    let arr = [];
    for (let i = 0; i < col_len; i++) {
        let per_arr = data.slice(i * row_len, (i + 1) * row_len)
        arr.push(per_arr)
    }
    var canvas2 = document.createElement('canvas');
    canvas2.width = width
    canvas2.height = height
    let ctx2 = canvas2.getContext('2d');
    let n = row_len * col_len
    let arr2 = new Uint8ClampedArray(n)
    let curr_row = 0;
    let len = arr.length;
    for (let i = len - 1; i >= 0; i--) {
        let curr_row = arr[i]
        for (let j = 0; j < curr_row.length; j++) {
            arr2[(len - i) * row_len + j] = curr_row[j]
        }
    }
    let imageData = new ImageData(arr2, width, height)
    ctx2.putImageData(imageData, 0, 0)
    let dataurl = canvas2.toDataURL()
    let img = new Image()
    img.src = dataurl
    img.width = width
    img.height = height
    return img.outerHTML;
};

return new WMF2PNG_();

})();
