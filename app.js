(function(){
'use strict';
/* ---------- constants ---------- */
var W=1600,H=1000,GRID=20,KEY='wirebench:v1';
var AMP={1:10,1.5:16,2.5:25,4:32,6:40,10:63,16:80};
var SIZES=[1,1.5,2.5,4,6,10,16];
var WT={live:{name:'Live'},neutral:{name:'Neutral'},earth:{name:'Earth'},switched:{name:'Switched live'}};
var KIND_OK={L:['live','switched'],S:['switched','live'],N:['neutral'],E:['earth'],X:['live','neutral','earth','switched']};
var KIND_WIRE={L:'live',S:'switched',N:'neutral',E:'earth'};
var KIND_NAME={L:'live',S:'switched live',N:'neutral',E:'earth',X:'any'};

/* ---------- component library ---------- */
function T(id,x,y,kind,dir,label){return {id:id,x:x,y:y,kind:kind,dir:dir,label:label||id}}
function bar(kind){var t=[];[20,60,100].forEach(function(x,i){t.push(T('t'+(i+1),x,0,kind,'t','Top '+(i+1)))});[20,60,100].forEach(function(x,i){t.push(T('b'+(i+1),x,40,kind,'b','Bottom '+(i+1)))});return t}
var COMPS={
 supply:{name:'Mains supply',cat:'Supply',w:140,h:120,desc:'Single-phase incoming supply',
  terms:[T('L',140,20,'L','r','Live'),T('N',140,60,'N','r','Neutral'),T('E',140,100,'E','r','Earth')],
  draw:function(){return '<rect class="body" width="140" height="120" rx="4"/><path class="line" d="M22 60c8-24 22-24 30 0s22 24 30 0"/><path class="line" d="M96 20h44M96 60h44M96 100h44"/>'}},
 breaker:{name:'Circuit breaker',cat:'Protection',w:80,h:40,desc:'MCB. Trips on overload or short circuit',
  terms:[T('in',0,20,'L','l','In'),T('out',80,20,'L','r','Out')],link:[['in','out','oc']],
  props:{rating:16},fields:[{k:'rating',l:'Rating',u:'A',min:2,max:125,step:1}],
  detail:function(i){return i.props.rating+' A'},
  draw:function(){return '<rect class="frame" x="8" y="2" width="64" height="36" rx="3"/><path class="line" d="M0 20h22M58 20h22M22 20L52 6"/><circle class="dot" cx="22" cy="20" r="3"/><circle class="dot" cx="58" cy="20" r="3"/><rect class="body" x="30" y="24" width="20" height="10" rx="2"/>'}},
 fuse:{name:'Fuse',cat:'Protection',w:80,h:40,desc:'Cartridge fuse. Melts on overload',
  terms:[T('in',0,20,'L','l','In'),T('out',80,20,'L','r','Out')],link:[['in','out','oc']],
  props:{rating:13},fields:[{k:'rating',l:'Rating',u:'A',min:1,max:125,step:1}],
  detail:function(i){return i.props.rating+' A'},
  draw:function(){return '<path class="line" d="M0 20h80"/><rect class="body" x="20" y="10" width="40" height="20" rx="2"/><path class="line" d="M20 20h40"/>'}},
 rcd:{name:'RCD',cat:'Protection',w:100,h:80,desc:'Residual current device. Trips on earth leakage',
  terms:[T('Lin',0,20,'L','l','Live in'),T('Nin',0,60,'N','l','Neutral in'),T('Lout',100,20,'L','r','Live out'),T('Nout',100,60,'N','r','Neutral out')],
  link:[['Lin','Lout','rcd'],['Nin','Nout','rcd']],
  props:{ma:30},fields:[{k:'ma',l:'Trip current',u:'mA',min:10,max:500,step:10}],
  detail:function(i){return i.props.ma+' mA'},
  draw:function(){return '<rect class="body" width="100" height="80" rx="4"/><path class="line" d="M0 20h100M0 60h100"/><circle class="ring" cx="50" cy="40" r="15"/>'}},
 switch:{name:'Switch',cat:'Control',w:80,h:40,desc:'One-way light switch',
  terms:[T('in',0,20,'L','l','Live in'),T('out',80,20,'S','r','Switched live')],link:[['in','out','pass']],
  draw:function(){return '<path class="line" d="M0 20h22M58 20h22M22 20L54 4"/><circle class="dot" cx="22" cy="20" r="3"/><circle class="dot" cx="58" cy="20" r="3"/>'}},
 light:{name:'Light',cat:'Loads',w:80,h:80,desc:'Lamp or light fitting',load:true,
  terms:[T('L',0,20,'L','l','Live'),T('N',0,60,'N','l','Neutral')],
  props:{watts:60},fields:[{k:'watts',l:'Power',u:'W',min:1,max:5000,step:1}],
  detail:function(i){return i.props.watts+' W'},
  draw:function(){return '<rect class="body" width="80" height="80" rx="4"/><path class="line" d="M0 20h20M0 60h20"/><circle class="ring" cx="52" cy="40" r="20"/><path class="line" d="M38 26l28 28M66 26L38 54"/>'}},
 socket:{name:'Socket outlet',cat:'Loads',w:80,h:120,desc:'Wall socket with earth',load:true,
  terms:[T('L',0,20,'L','l','Live'),T('N',0,60,'N','l','Neutral'),T('E',0,100,'E','l','Earth')],
  props:{watts:1000},fields:[{k:'watts',l:'Expected load',u:'W',min:1,max:7000,step:50}],
  detail:function(i){return i.props.watts+' W'},
  draw:function(){return '<rect class="body" width="80" height="120" rx="4"/><path class="line" d="M0 20h22M0 60h22M0 100h22"/><rect class="ring" x="32" y="22" width="36" height="76" rx="7"/><circle class="dot" cx="50" cy="44" r="4"/><circle class="dot" cx="50" cy="76" r="4"/>'}},
 appliance:{name:'Appliance',cat:'Loads',w:100,h:120,desc:'Heater, motor or fixed appliance',load:true,
  terms:[T('L',0,20,'L','l','Live'),T('N',0,60,'N','l','Neutral'),T('E',0,100,'E','l','Earth')],
  props:{watts:2000},fields:[{k:'watts',l:'Power',u:'W',min:1,max:20000,step:50}],
  detail:function(i){return i.props.watts+' W'},
  draw:function(){return '<rect class="body" width="100" height="120" rx="4"/><path class="line" d="M0 20h24M0 60h24M0 100h24"/><circle class="ring" cx="62" cy="60" r="27"/><path class="line" d="M47 60c4-11 9-11 15 0s11 11 15 0"/>'}},
 junction:{name:'Junction box',cat:'Connections',w:60,h:80,desc:'Joins conductors together',link:'all',
  terms:[T('a',0,20,'X','l','Left 1'),T('b',0,60,'X','l','Left 2'),T('c',60,20,'X','r','Right 1'),T('d',60,60,'X','r','Right 2')],
  draw:function(){return '<rect class="body" width="60" height="80" rx="4"/><path class="line" d="M0 20h20M0 60h20M40 20h20M40 60h20M20 20v40M40 20v40"/>'}},
 nbar:{name:'Neutral bar',cat:'Connections',w:120,h:40,desc:'Common point for neutral wires',link:'all',
  terms:bar('N'),draw:function(){return '<path class="line" d="M20 0v12M60 0v12M100 0v12M20 28v12M60 28v12M100 28v12"/><rect class="body" x="0" y="12" width="120" height="16" rx="2" style="stroke:var(--w-neutral)"/>'}},
 ebar:{name:'Earth bar',cat:'Connections',w:120,h:40,desc:'Common point for earth wires',link:'all',
  terms:bar('E'),draw:function(){return '<path class="line" d="M20 0v12M60 0v12M100 0v12M20 28v12M60 28v12M100 28v12"/><rect class="body" x="0" y="12" width="120" height="16" rx="2" style="stroke:var(--w-earth)"/>'}}
};
var CATS=['Supply','Protection','Control','Loads','Connections'];

/* ---------- state ---------- */
var S={projects:[],cur:null};
var U={sel:null,wiring:null,cursor:{x:0,y:0},drag:null,zoom:1,wmode:'auto',size:2.5,view:'dashboard',undo:[],redo:[],place:0,
  gview:'colours',gq:'',gcat:'All',io:null,newOpen:false,confirmDel:null,checklist:{}};
var $=function(id){return document.getElementById(id)};
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function uid(){return Math.random().toString(36).slice(2,9)}
function snap(v){return Math.round(v/GRID)*GRID}
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function cur(){return S.projects.find(function(p){return p.id===S.cur})||S.projects[0]}
function itemOf(p,id){return p.items.find(function(i){return i.id===id})}
function nm(it){return it.label||COMPS[it.type].name}
function toast(m){var t=$('toast');t.textContent=m;clearTimeout(toast.t);toast.t=setTimeout(function(){t.textContent=''},3500)}

/* ---------- storage ---------- */
/* ---------- geometry ---------- */
var DIRS=['l','t','r','b'];
function rotDir(d,rot){var n=((rot||0)/90)%4;return DIRS[(DIRS.indexOf(d)+n+4)%4]}
function termPos(it,t){var c=COMPS[it.type],cx=c.w/2,cy=c.h/2,dx=t.x-cx,dy=t.y-cy,r=(((it.rot||0)%360)+360)%360,rx,ry;
  if(r===0){rx=dx;ry=dy}else if(r===90){rx=-dy;ry=dx}else if(r===180){rx=-dx;ry=-dy}else{rx=dy;ry=-dx}
  return {x:it.x+cx+rx,y:it.y+cy+ry}}
function itemBox(it){var c=COMPS[it.type],cx=it.x+c.w/2,cy=it.y+c.h/2,odd=((it.rot||0)/90)%2===1,w=odd?c.h:c.w,h=odd?c.w:c.h;
  return {x1:cx-w/2,y1:cy-h/2,x2:cx+w/2,y2:cy+h/2,cx:cx}}
function termOf(it,id){return COMPS[it.type].terms.find(function(t){return t.id===id})}
var VEC={l:{x:-1,y:0},r:{x:1,y:0},t:{x:0,y:-1},b:{x:0,y:1}};
function routePts(p1,d1,p2,d2,off){
  var s1={x:p1.x+VEC[d1].x*14,y:p1.y+VEC[d1].y*14},s2={x:p2.x+VEC[d2].x*14,y:p2.y+VEC[d2].y*14};
  var h1=d1==='l'||d1==='r',h2=d2==='l'||d2==='r',mid;
  if(h1&&h2){var mx=(s1.x+s2.x)/2+off;mid=[{x:mx,y:s1.y},{x:mx,y:s2.y}]}
  else if(!h1&&!h2){var my=(s1.y+s2.y)/2+off;mid=[{x:s1.x,y:my},{x:s2.x,y:my}]}
  else if(h1&&!h2){mid=[{x:s2.x,y:s1.y}]}
  else{mid=[{x:s1.x,y:s2.y}]}
  return [p1,s1].concat(mid,[s2,p2])}
function ptsStr(pts){return pts.map(function(p,i){return (i?'L':'M')+Math.round(p.x*10)/10+' '+Math.round(p.y*10)/10}).join('')}
function wirePath(p,w,idx){
  var a=itemOf(p,w.a.item),b=itemOf(p,w.b.item);if(!a||!b)return '';
  var ta=termOf(a,w.a.term),tb=termOf(b,w.b.term);if(!ta||!tb)return '';
  return ptsStr(routePts(termPos(a,ta),rotDir(ta.dir,a.rot),termPos(b,tb),rotDir(tb.dir,b.rot),((idx*37)%7-3)*8))}

/* ---------- markup ---------- */
function symbolSvg(type,cls){var c=COMPS[type];return '<svg viewBox="-6 -6 '+(c.w+12)+' '+(c.h+12)+'" class="'+(cls||'')+'" aria-hidden="true">'+c.draw()+'</svg>'}
function diagramMarkup(p,o){
  o=o||{};var fl=o.flags||{items:{},wires:{}},sel=o.sel,out='';
  var bodies='',terms='',labels='';
  p.items.forEach(function(it){
    var c=COMPS[it.type],isSel=sel&&sel.type==='item'&&sel.id===it.id,f=fl.items[it.id];
    var tr='translate('+it.x+' '+it.y+') rotate('+(it.rot||0)+' '+c.w/2+' '+c.h/2+')';
    bodies+='<g class="item" data-item="'+it.id+'" transform="'+tr+'">'+c.draw()
      +(f==='error'||f==='warn'?'<rect class="flagbox '+f+'" x="-7" y="-7" width="'+(c.w+14)+'" height="'+(c.h+14)+'" rx="7"/>':'')
      +(isSel?'<rect class="selbox" x="-6" y="-6" width="'+(c.w+12)+'" height="'+(c.h+12)+'" rx="6"/>':'')
      +'<rect class="hit" x="-3" y="-3" width="'+(c.w+6)+'" height="'+(c.h+6)+'"/></g>';
    if(!o.thumb){
      terms+='<g transform="'+tr+'">'+c.terms.map(function(t){
        var on=U.wiring&&U.wiring.item===it.id&&U.wiring.term===t.id;
        return '<circle class="thit" data-item="'+it.id+'" data-term="'+t.id+'" cx="'+t.x+'" cy="'+t.y+'" r="11"/>'
          +'<circle class="term k'+t.kind+(on?' on':'')+'" cx="'+t.x+'" cy="'+t.y+'" r="5.5" pointer-events="none"/>'}).join('')+'</g>';
    }
    var bx=itemBox(it);
    labels+='<text class="lbl" x="'+bx.cx+'" y="'+(bx.y2+(it.type==='nbar'||it.type==='ebar'?4:20))+'" text-anchor="middle">'+esc(nm(it))+'</text>';
    if(c.detail)labels+='<text class="sub" x="'+bx.cx+'" y="'+(bx.y2+(it.type==='nbar'||it.type==='ebar'?18:34))+'" text-anchor="middle">'+esc(c.detail(it))+'</text>';
  });
  var wires='';
  p.wires.forEach(function(w,i){
    var d=wirePath(p,w,i);if(!d)return;
    var isSel=sel&&sel.type==='wire'&&sel.id===w.id,f=fl.wires[w.id];
    if(isSel)wires+='<path class="whalo sel" d="'+d+'"/>';
    else if(f==='error'||f==='warn')wires+='<path class="whalo '+f+'" d="'+d+'"/>';
    wires+='<path class="w w-'+w.type+'" d="'+d+'"/>';
    if(w.type==='earth')wires+='<path class="w-earth2" d="'+d+'"/>';
    if(!o.thumb)wires+='<path class="whit" data-wire="'+w.id+'" d="'+d+'"/>';
  });
  var pend='';
  if(U.wiring&&!o.thumb){var ia=itemOf(p,U.wiring.item);if(ia){var ta=termOf(ia,U.wiring.term),pa=termPos(ia,ta),da=rotDir(ta.dir,ia.rot);
    pend='<path class="wpend" d="'+ptsStr([pa,{x:pa.x+VEC[da].x*14,y:pa.y+VEC[da].y*14},{x:U.cursor.x,y:pa.y+VEC[da].y*14*(da==='t'||da==='b'?1:0)},U.cursor])+'"/>'}}
  return bodies+wires+pend+terms+labels}
function canvasInner(p){
  return '<defs><pattern id="g" width="'+GRID+'" height="'+GRID+'" patternUnits="userSpaceOnUse"><path class="gridline" d="M'+GRID+' 0H0V'+GRID+'"/></pattern></defs><rect width="'+W+'" height="'+H+'" fill="url(#g)"/>'+diagramMarkup(p,{sel:U.sel,flags:analyze(p).flags})}
function thumbSvg(p){
  if(!p.items.length)return '<svg viewBox="0 0 400 150"><text x="200" y="80" text-anchor="middle" class="sub">Empty project</text></svg>';
  var x1=1e9,y1=1e9,x2=-1e9,y2=-1e9;p.items.forEach(function(it){var b=itemBox(it);x1=Math.min(x1,b.x1);y1=Math.min(y1,b.y1);x2=Math.max(x2,b.x2);y2=Math.max(y2,b.y2+34)});
  var pad=30;return '<svg viewBox="'+(x1-pad)+' '+(y1-pad)+' '+(x2-x1+pad*2)+' '+(y2-y1+pad*2)+'" preserveAspectRatio="xMidYMid meet">'+diagramMarkup(p,{thumb:true,flags:{items:{},wires:{}}})+'</svg>'}

/* ---------- safety analysis ---------- */
function analyze(p){
  var issues=[],flags={items:{},wires:{}},adj={},deg={};
  function nid(i,t){return i+':'+t}
  function add(a,b,tag){(adj[a]=adj[a]||[]).push([b,tag]);(adj[b]=adj[b]||[]).push([a,tag])}
  p.wires.forEach(function(w){add(nid(w.a.item,w.a.term),nid(w.b.item,w.b.term),null);
    deg[nid(w.a.item,w.a.term)]=(deg[nid(w.a.item,w.a.term)]||0)+1;deg[nid(w.b.item,w.b.term)]=(deg[nid(w.b.item,w.b.term)]||0)+1});
  p.items.forEach(function(it){var c=COMPS[it.type];
    if(c.link==='all'){for(var i=0;i<c.terms.length;i++)for(var j=i+1;j<c.terms.length;j++)add(nid(it.id,c.terms[i].id),nid(it.id,c.terms[j].id),'pass')}
    else if(c.link)c.link.forEach(function(l){add(nid(it.id,l[0]),nid(it.id,l[1]),l[2])})});
  function reach(starts,block){var seen={},q=[];starts.forEach(function(s){seen[s]=1;q.push(s)});
    while(q.length){var n=q.pop();(adj[n]||[]).forEach(function(e){if(e[1]&&block.indexOf(e[1])>=0)return;if(!seen[e[0]]){seen[e[0]]=1;q.push(e[0])}})}return seen}
  var rank={error:3,warn:2,info:1};
  function iss(sev,msg,ref,guide){issues.push({sev:sev,msg:msg,ref:ref,guide:guide});
    if(ref&&ref.item){if(!flags.items[ref.item]||rank[sev]>rank[flags.items[ref.item]])flags.items[ref.item]=sev}
    if(ref&&ref.wire){if(!flags.wires[ref.wire]||rank[sev]>rank[flags.wires[ref.wire]])flags.wires[ref.wire]=sev}}
  var supplies=p.items.filter(function(i){return i.type==='supply'});
  var sL=supplies.map(function(s){return nid(s.id,'L')}),sN=supplies.map(function(s){return nid(s.id,'N')}),sE=supplies.map(function(s){return nid(s.id,'E')});
  var rAll=reach(sL,[]),rOC=reach(sL,['oc']),rRCD=reach(sL,['rcd']),rN=reach(sN,[]),rE=reach(sE,[]);
  if(p.items.length&&!supplies.length)iss('info','No mains supply in this project. Add one so the checks can trace circuits.',null,'lighting');
  // wire colour vs terminal
  p.wires.forEach(function(w){[w.a,w.b].forEach(function(e){var it=itemOf(p,e.item);if(!it)return;var t=termOf(it,e.term);if(!t)return;
    if(KIND_OK[t.kind].indexOf(w.type)<0)iss('error',WT[w.type].name+' wire connected to a '+KIND_NAME[t.kind]+' terminal ('+nm(it)+', '+t.label+').',{wire:w.id},'colours')})});
  p.items.forEach(function(it){var c=COMPS[it.type];
    var used=c.terms.some(function(t){return deg[nid(it.id,t.id)]});
    if(!used){iss('info',nm(it)+' is not connected to anything.',{item:it.id});return}
    if(c.load){
      var L=nid(it.id,'L');
      if(!rAll[L]){if(supplies.length)iss('warn',nm(it)+' is not connected to the supply live.',{item:it.id},'lighting')}
      else{
        if(rOC[L])iss('error',nm(it)+' is fed with no circuit breaker or fuse between it and the supply.',{item:it.id},'cable-breaker');
        if(it.type==='socket'&&rRCD[L])iss('warn',nm(it)+' has no RCD in its supply path.',{item:it.id},'rcd-sockets');
      }
      c.terms.forEach(function(t){
        if(t.kind==='N'){var n=nid(it.id,t.id);
          if(!deg[n])iss('warn',nm(it)+' has no neutral connected.',{item:it.id},'lighting');
          else if(supplies.length&&!rN[n])iss('warn','Neutral of '+nm(it)+' does not reach the supply neutral.',{item:it.id},'lighting')}
        if(t.kind==='E'){var e=nid(it.id,t.id);
          if(!deg[e])iss('warn',nm(it)+' has no earth connected.',{item:it.id},'earthing');
          else if(supplies.length&&!rE[e])iss('warn','Earth of '+nm(it)+' does not reach the supply earth.',{item:it.id},'earthing')}});
    }
    if(it.type==='breaker'||it.type==='fuse'){
      var rating=+it.props.rating||0,seenW={};
      p.wires.forEach(function(w){if(seenW[w.id])return;if(w.a.item===it.id||w.b.item===it.id){seenW[w.id]=1;
        if(AMP[w.size]&&AMP[w.size]<rating)iss('error','Cable too small on the '+(w.a.item===it.id?termOf(it,w.a.term):termOf(it,w.b.term)).label.toLowerCase()+' side of '+nm(it)+': '+w.size+' mm² carries about '+AMP[w.size]+' A, the breaker is rated '+rating+' A.',{wire:w.id},'cable-breaker')}});
      var down=reach([nid(it.id,'out')],['oc']),watts=0;
      p.items.forEach(function(o){if(COMPS[o.type].load&&down[nid(o.id,'L')])watts+=+o.props.watts||0});
      var amps=watts/(p.voltage||230);
      if(amps>rating&&rating>0)iss('warn','Connected load is about '+amps.toFixed(1)+' A, above the '+rating+' A rating of '+nm(it)+'.',{item:it.id},'cable-breaker');
    }
  });
  var errors=issues.filter(function(i){return i.sev==='error'}).length,warns=issues.filter(function(i){return i.sev==='warn'}).length;
  issues.sort(function(a,b){return rank[b.sev]-rank[a.sev]});
  return {issues:issues,errors:errors,warns:warns,score:Math.max(0,100-errors*25-warns*8),flags:flags}}

/* ---------- templates ---------- */
function mk(id,type,x,y,props,label){return {id:id,type:type,x:x,y:y,rot:0,label:label||'',props:Object.assign({},COMPS[type].props||{},props||{})}}
function wr(id,a,b,type,size){var A=a.split('.'),B=b.split('.');return {id:id,a:{item:A[0],term:A[1]},b:{item:B[0],term:B[1]},type:type,size:size}}
var TEMPLATES={
 lighting:{name:'Lighting circuit',desc:'RCD, 6 A breaker, switch and one light',build:function(){return {name:'Hallway lighting',voltage:230,notes:'One-way lighting circuit on a 6 A breaker.',
  items:[mk('s1','supply',40,60),mk('r1','rcd',260,60,{ma:30}),mk('m1','breaker',420,60,{rating:6},'Lighting breaker'),mk('sw1','switch',560,60),mk('l1','light',720,60,{watts:60},'Hallway light')],
  wires:[wr('w1','s1.L','r1.Lin','live',1.5),wr('w2','s1.N','r1.Nin','neutral',1.5),wr('w3','r1.Lout','m1.in','live',1.5),wr('w4','m1.out','sw1.in','live',1.5),wr('w5','sw1.out','l1.L','switched',1.5),wr('w6','r1.Nout','l1.N','neutral',1.5)]}}},
 sockets:{name:'Kitchen sockets',desc:'RCD, 32 A breaker, socket and heater',build:function(){return {name:'Kitchen sockets',voltage:230,notes:'Radial power circuit, 4 mm² cable on a 32 A breaker.',
  items:[mk('s1','supply',40,60),mk('r1','rcd',260,60,{ma:30}),mk('m1','breaker',420,60,{rating:32},'Kitchen breaker'),mk('so1','socket',700,40,{watts:1000},'Worktop socket'),mk('ap1','appliance',700,220,{watts:2000},'Under-counter heater')],
  wires:[wr('w1','s1.L','r1.Lin','live',4),wr('w2','s1.N','r1.Nin','neutral',4),wr('w3','r1.Lout','m1.in','live',4),wr('w4','m1.out','so1.L','live',4),wr('w5','m1.out','ap1.L','live',4),
    wr('w6','r1.Nout','so1.N','neutral',4),wr('w7','r1.Nout','ap1.N','neutral',4),wr('w8','s1.E','so1.E','earth',2.5),wr('w9','s1.E','ap1.E','earth',2.5)]}}},
 heater:{name:'Garage heater (needs review)',desc:'Includes a cable that is too small and a missing earth',build:function(){return {name:'Garage heater',voltage:230,notes:'Draft. Open the checks panel to see what needs fixing.',
  items:[mk('s1','supply',40,60),mk('m1','breaker',320,60,{rating:32},'Heater breaker'),mk('ap1','appliance',540,60,{watts:3000},'Garage heater')],
  wires:[wr('w1','s1.L','m1.in','live',1.5),wr('w2','m1.out','ap1.L','live',1.5),wr('w3','s1.N','ap1.N','neutral',1.5)]}}},
 blank:{name:'Blank project',desc:'Start from an empty canvas',build:function(){return {name:'Untitled project',voltage:230,notes:'',items:[],wires:[]}}}
};
function newProject(tpl,name){var p=TEMPLATES[tpl].build();p.id=uid();if(name)p.name=name;if(A.profile&&A.profile.voltage)p.voltage=A.profile.voltage;p.updated=Date.now();S.projects.unshift(p);return p}

/* ---------- history ---------- */
function snapshot(){var p=cur();U.undo.push(JSON.stringify({items:p.items,wires:p.wires}));if(U.undo.length>80)U.undo.shift();U.redo=[]}
function restore(str){var p=cur(),d=JSON.parse(str);p.items=d.items;p.wires=d.wires;U.sel=null;U.wiring=null}
function undo(){if(!U.undo.length)return;var p=cur();U.redo.push(JSON.stringify({items:p.items,wires:p.wires}));restore(U.undo.pop());commit(true)}
function redo(){if(!U.redo.length)return;var p=cur();U.undo.push(JSON.stringify({items:p.items,wires:p.wires}));restore(U.redo.pop());commit(true)}
function commit(full){cur().updated=Date.now();save();refreshCanvas();refreshChecks();if(full)refreshProps();refreshToolbar()}

/* ---------- actions ---------- */
function addItem(type,x,y){var p=cur(),c=COMPS[type];snapshot();
  var it={id:uid(),type:type,x:clamp(snap(x),0,W-c.w),y:clamp(snap(y),0,H-c.h),rot:0,label:'',props:Object.assign({},c.props||{})};
  p.items.push(it);U.sel={type:'item',id:it.id};commit(true)}
function addAtCenter(type){var c=COMPS[type],wrap=$('cwrap'),z=U.zoom,off=(U.place++%6)*20;
  addItem(type,(wrap.scrollLeft+wrap.clientWidth/2)/z-c.w/2+off-40,(wrap.scrollTop+wrap.clientHeight/2)/z-c.h/2+off-40)}
function delSel(){var p=cur();if(!U.sel)return;snapshot();
  if(U.sel.type==='item'){p.items=p.items.filter(function(i){return i.id!==U.sel.id});p.wires=p.wires.filter(function(w){return w.a.item!==U.sel.id&&w.b.item!==U.sel.id})}
  else p.wires=p.wires.filter(function(w){return w.id!==U.sel.id});
  U.sel=null;commit(true)}
function rotSel(){var p=cur();if(!U.sel||U.sel.type!=='item')return;snapshot();var it=itemOf(p,U.sel.id);it.rot=((it.rot||0)+90)%360;commit(true)}
function connect(a,b){var p=cur();
  if(a.item===b.item){toast('Pick a terminal on a different component.');return}
  var dup=p.wires.some(function(w){return (w.a.item===a.item&&w.a.term===a.term&&w.b.item===b.item&&w.b.term===b.term)||(w.a.item===b.item&&w.a.term===b.term&&w.b.item===a.item&&w.b.term===a.term)});
  if(dup){toast('Those terminals are already wired together.');return}
  var ia=itemOf(p,a.item),ib=itemOf(p,b.item),ka=termOf(ia,a.term).kind,kb=termOf(ib,b.term).kind,type=U.wmode;
  if(type==='auto'){if(ka==='S'||kb==='S')type='switched';else type=KIND_WIRE[ka]||KIND_WIRE[kb]||'live'}
  snapshot();var w={id:uid(),a:a,b:b,type:type,size:type==='earth'?Math.min(U.size,2.5):U.size};
  p.wires.push(w);U.sel={type:'wire',id:w.id};commit(true)}

/* ---------- canvas / events ---------- */
function svgPt(e){var cv=$('cv'),pt=cv.createSVGPoint();pt.x=e.clientX;pt.y=e.clientY;var m=cv.getScreenCTM();return m?pt.matrixTransform(m.inverse()):{x:0,y:0}}
function refreshCanvas(){var cv=$('cv');cv.setAttribute('width',W*U.zoom);cv.setAttribute('height',H*U.zoom);cv.setAttribute('viewBox','0 0 '+W+' '+H);cv.innerHTML=canvasInner(cur());
  var h=$('hint');
  if(U.wiring){var it=itemOf(cur(),U.wiring.item);h.textContent='Wiring from '+(it?nm(it):'')+'. Click another terminal to finish, Esc to cancel.'}
  else if(U.sel)h.textContent=U.sel.type==='item'?'Drag to move. R rotates, Delete removes. Click a terminal to start a wire.':'Wire selected. Change its type or cable size on the right, Delete removes it.';
  else h.textContent='Click a component on the left to add it. Click a terminal dot to start a wire.'}
function bindCanvas(){
  var cv=$('cv');
  cv.addEventListener('pointerdown',function(e){
    var t=e.target,p=cur();var pt=svgPt(e);U.cursor=pt;
    var te=t.closest&&t.closest('[data-term]');
    if(te){e.preventDefault();var ref={item:te.getAttribute('data-item'),term:te.getAttribute('data-term')};
      if(!U.wiring){U.wiring=ref;U.sel=null;refreshCanvas();refreshProps()}
      else if(U.wiring.item===ref.item&&U.wiring.term===ref.term){U.wiring=null;refreshCanvas()}
      else{var a=U.wiring;U.wiring=null;connect(a,ref)}
      return}
    var ie=t.closest&&t.closest('[data-item]');
    if(ie){e.preventDefault();var id=ie.getAttribute('data-item'),it=itemOf(p,id);U.wiring=null;U.sel={type:'item',id:id};
      U.drag={id:id,dx:pt.x-it.x,dy:pt.y-it.y,moved:false,snap:JSON.stringify({items:p.items,wires:p.wires})};
      try{cv.setPointerCapture(e.pointerId)}catch(x){}refreshCanvas();refreshProps();return}
    var we=t.closest&&t.closest('[data-wire]');
    if(we){U.wiring=null;U.sel={type:'wire',id:we.getAttribute('data-wire')};refreshCanvas();refreshProps();return}
    U.sel=null;U.wiring=null;refreshCanvas();refreshProps()});
  cv.addEventListener('pointermove',function(e){
    var pt=svgPt(e);U.cursor=pt;
    if(U.drag){var p=cur(),it=itemOf(p,U.drag.id),c=COMPS[it.type];
      var nx=clamp(snap(pt.x-U.drag.dx),0,W-c.w),ny=clamp(snap(pt.y-U.drag.dy),0,H-c.h);
      if(nx!==it.x||ny!==it.y){if(!U.drag.moved){U.drag.moved=true;U.undo.push(U.drag.snap);U.redo=[]}it.x=nx;it.y=ny;refreshCanvas();refreshChecks()}}
    else if(U.wiring)refreshCanvas()});
  function end(){if(U.drag){var m=U.drag.moved;U.drag=null;if(m)commit(false);refreshToolbar()}}
  cv.addEventListener('pointerup',end);cv.addEventListener('pointercancel',end);
  var wrap=$('cwrap');
  wrap.addEventListener('dragover',function(e){e.preventDefault()});
  wrap.addEventListener('drop',function(e){e.preventDefault();var type=e.dataTransfer&&e.dataTransfer.getData('text/plain');if(!COMPS[type])return;var pt=svgPt(e),c=COMPS[type];addItem(type,pt.x-c.w/2,pt.y-c.h/2)})}

/* ---------- palette & toolbar ---------- */
function buildPalette(){
  var h='';CATS.forEach(function(cat){h+='<div class="pal-cat">'+cat+'</div>';
    Object.keys(COMPS).filter(function(k){return COMPS[k].cat===cat}).forEach(function(k){var c=COMPS[k];
      h+='<button class="pal" draggable="true" data-add="'+k+'" title="'+esc(c.desc)+'">'+symbolSvg(k)+'<span><b>'+c.name+'</b><small>'+esc(c.desc)+'</small></span></button>'})});
  var pl=$('palette');pl.innerHTML=h;
  pl.addEventListener('click',function(e){var b=e.target.closest('[data-add]');if(b)addAtCenter(b.getAttribute('data-add'))});
  pl.addEventListener('dragstart',function(e){var b=e.target.closest('[data-add]');if(b){e.dataTransfer.setData('text/plain',b.getAttribute('data-add'));e.dataTransfer.effectAllowed='copy'}})}
function buildToolbar(){
  $('csize').innerHTML=SIZES.map(function(s){return '<option value="'+s+'"'+(s===U.size?' selected':'')+'>'+s+' mm² · '+AMP[s]+' A</option>'}).join('');
  $('csize').addEventListener('change',function(){U.size=+this.value});
  $('wmode').addEventListener('click',function(e){var b=e.target.closest('[data-wmode]');if(!b)return;U.wmode=b.getAttribute('data-wmode');refreshToolbar()});
  $('pname').addEventListener('input',function(){cur().name=this.value;cur().updated=Date.now();save()});
  $('toolbar').addEventListener('click',function(e){var b=e.target.closest('[data-act]');if(!b)return;var a=b.getAttribute('data-act');
    if(a==='undo')undo();else if(a==='redo')redo();else if(a==='rotate')rotSel();else if(a==='delete')delSel();
    else if(a==='zoomin'){U.zoom=Math.min(1.5,Math.round((U.zoom+.25)*100)/100);refreshCanvas();refreshToolbar()}
    else if(a==='zoomout'){U.zoom=Math.max(.5,Math.round((U.zoom-.25)*100)/100);refreshCanvas();refreshToolbar()}})}
function refreshToolbar(){
  var p=cur();if(document.activeElement!==$('pname'))$('pname').value=p.name;
  Array.prototype.forEach.call($('wmode').children,function(b){b.setAttribute('aria-pressed',String(b.getAttribute('data-wmode')===U.wmode))});
  $('b-undo').disabled=!U.undo.length;$('b-redo').disabled=!U.redo.length;
  $('b-rot').disabled=!(U.sel&&U.sel.type==='item');$('b-del').disabled=!U.sel;
  $('zl').textContent=Math.round(U.zoom*100)+'%'}

/* ---------- inspector ---------- */
function refreshProps(){
  var p=cur(),el=$('props'),h='';
  if(U.sel&&U.sel.type==='item'){var it=itemOf(p,U.sel.id);if(!it){U.sel=null;return refreshProps()}var c=COMPS[it.type];
    h+='<h2 class="insp-h">'+c.name+'</h2><div class="stack"><label class="f">Label<input type="text" id="i-label" value="'+esc(it.label)+'" placeholder="'+esc(c.name)+'" maxlength="40"></label>';
    (c.fields||[]).forEach(function(f){h+='<label class="f">'+f.l+' ('+f.u+')<input type="number" data-prop="'+f.k+'" min="'+f.min+'" max="'+f.max+'" step="'+f.step+'" value="'+it.props[f.k]+'"></label>'});
    h+='<div class="row2"><button class="btn" data-act2="rotate">Rotate 90°</button><button class="btn danger" data-act2="delete">Delete</button></div>';
    h+='<div class="note">Terminal colours: <i class="sw" style="background:var(--w-live)"></i>live <i class="sw" style="background:var(--w-switched)"></i>switched <i class="sw" style="background:var(--w-neutral)"></i>neutral <i class="sw" style="background:var(--w-earth)"></i>earth</div></div>'}
  else if(U.sel&&U.sel.type==='wire'){var w=p.wires.find(function(x){return x.id===U.sel.id});if(!w){U.sel=null;return refreshProps()}
    var ia=itemOf(p,w.a.item),ib=itemOf(p,w.b.item);
    h+='<h2 class="insp-h">Wire</h2><div class="stack"><div class="note">'+esc(nm(ia))+' · '+esc(termOf(ia,w.a.term).label)+' → '+esc(nm(ib))+' · '+esc(termOf(ib,w.b.term).label)+'</div>'
      +'<label class="f">Conductor<select id="w-type">'+Object.keys(WT).map(function(k){return '<option value="'+k+'"'+(k===w.type?' selected':'')+'>'+WT[k].name+'</option>'}).join('')+'</select></label>'
      +'<label class="f">Cable size<select id="w-size">'+SIZES.map(function(s){return '<option value="'+s+'"'+(s===w.size?' selected':'')+'>'+s+' mm² · about '+AMP[s]+' A</option>'}).join('')+'</select></label>'
      +'<button class="btn danger" data-act2="delete">Delete wire</button></div>'}
  else{
    h+='<h2 class="insp-h">Project</h2><div class="stack"><label class="f">Supply voltage<select id="p-volt">'+[120,230,240].map(function(v){return '<option value="'+v+'"'+(v===p.voltage?' selected':'')+'>'+v+' V</option>'}).join('')+'</select></label>'
      +'<label class="f">Notes<textarea id="p-notes" rows="3" maxlength="600" placeholder="Room, circuit number, who checked it">'+esc(p.notes||'')+'</textarea></label></div>';
    var counts={};p.items.forEach(function(i){var n=COMPS[i.type].name+(COMPS[i.type].detail?' '+COMPS[i.type].detail(i):'');counts[n]=(counts[n]||0)+1});
    var cables={};p.wires.forEach(function(w){cables[w.size]=(cables[w.size]||0)+1});
    h+='<h2 class="insp-h" style="margin-top:18px">Parts list</h2>';
    if(!p.items.length)h+='<div class="note">Nothing placed yet.</div>';
    else h+='<table class="parts">'+Object.keys(counts).map(function(k){return '<tr><td>'+esc(k)+'</td><td>×'+counts[k]+'</td></tr>'}).join('')
      +Object.keys(cables).sort(function(a,b){return a-b}).map(function(k){return '<tr><td>Cable runs '+k+' mm²</td><td>×'+cables[k]+'</td></tr>'}).join('')+'</table>';
    h+='<h2 class="insp-h" style="margin-top:18px">Wire colours</h2><div class="legend"><span><i class="sw" style="background:var(--w-live)"></i>Live</span><span><i class="sw" style="background:var(--w-switched)"></i>Switched live</span><span><i class="sw" style="background:var(--w-neutral)"></i>Neutral</span><span><i class="sw" style="background:var(--w-earth)"></i>Earth (green and yellow stripe)</span></div>'}
  el.innerHTML=h}
function bindInspector(){
  var el=$('props');
  el.addEventListener('input',function(e){var t=e.target,p=cur();
    if(t.id==='i-label'){var it=itemOf(p,U.sel.id);it.label=t.value;cur().updated=Date.now();save();refreshCanvas();refreshChecks()}
    else if(t.hasAttribute('data-prop')){var it2=itemOf(p,U.sel.id),v=parseFloat(t.value);if(!isFinite(v))return;it2.props[t.getAttribute('data-prop')]=clamp(v,+t.min,+t.max);cur().updated=Date.now();save();refreshCanvas();refreshChecks()}
    else if(t.id==='p-notes'){p.notes=t.value;p.updated=Date.now();save()}});
  el.addEventListener('change',function(e){var t=e.target,p=cur();
    if(t.id==='w-type'||t.id==='w-size'){snapshot();var w=p.wires.find(function(x){return x.id===U.sel.id});if(t.id==='w-type')w.type=t.value;else w.size=+t.value;commit(false)}
    else if(t.id==='p-volt'){p.voltage=+t.value;commit(true)}
    else if(t.hasAttribute('data-prop')){snapshot()}});
  el.addEventListener('click',function(e){var b=e.target.closest('[data-act2]');if(!b)return;if(b.getAttribute('data-act2')==='rotate')rotSel();else delSel()})}
function refreshChecks(){
  var a=analyze(cur()),h='<h2 class="insp-h">Design checks</h2>';
  var cls=a.errors?'err':a.warns?'warn':'ok',txt=a.errors?'Needs fixing':a.warns?'Review warnings':'No issues found';
  h+='<div class="score"><span class="badge '+cls+'">'+txt+'</span><span class="note mono">'+a.errors+' errors · '+a.warns+' warnings</span></div>';
  if(!a.issues.length)h+='<div class="note">Every load has protection, a neutral and an earth, and every cable suits its breaker.</div>';
  a.issues.forEach(function(i,n){h+='<div class="issue '+i.sev+'" data-issue="'+n+'" role="button" tabindex="0">'+esc(i.msg)+(i.guide?'<small><a data-guide="'+i.guide+'">Read the guide</a></small>':'')+'</div>'});
  h+='<p class="note" style="margin-top:12px">These checks catch common mistakes in the diagram. They do not replace a qualified electrician or your local wiring rules.</p>';
  var el=$('checks');el.innerHTML=h;el._issues=a.issues}
function bindChecks(){var el=$('checks');
  function act(e){var g=e.target.closest('[data-guide]');if(g){e.preventDefault();e.stopPropagation();U.gview=g.getAttribute('data-guide');go('guides');return}
    var b=e.target.closest('[data-issue]');if(!b)return;var i=el._issues[+b.getAttribute('data-issue')];if(!i||!i.ref)return;
    U.sel=i.ref.item?{type:'item',id:i.ref.item}:{type:'wire',id:i.ref.wire};refreshCanvas();refreshProps();refreshToolbar()}
  el.addEventListener('click',act);el.addEventListener('keydown',function(e){if(e.key==='Enter')act(e)})}

/* ---------- projects view ---------- */
function ago(t){var s=(Date.now()-t)/1000;if(s<60)return 'just now';if(s<3600)return Math.floor(s/60)+' min ago';if(s<86400)return Math.floor(s/3600)+' h ago';return Math.floor(s/86400)+' d ago'}
function renderProjects(){
  var h='<div class="page-h"><h1>Projects</h1><span class="note">'+S.projects.length+' saved in this browser</span><span class="sp"></span><button class="btn" data-pa="import">Import JSON</button><button class="btn primary" data-pa="new">New project</button></div>';
  if(U.newOpen){h+='<div class="panel"><b>Start a project from</b><div class="tpl">'+Object.keys(TEMPLATES).map(function(k){return '<button data-tpl="'+k+'"><b>'+TEMPLATES[k].name+'</b><span>'+TEMPLATES[k].desc+'</span></button>'}).join('')+'</div></div>'}
  if(U.io){h+='<div class="panel"><b>'+(U.io.mode==='export'?'Project JSON':'Paste project JSON')+'</b><p class="note" style="margin:4px 0 8px">'+(U.io.mode==='export'?'Copied to the clipboard when the browser allows it. Select and copy it yourself otherwise.':'Paste a project exported from Wirebench, then import it.')+'</p><textarea id="io-text" rows="8" spellcheck="false">'+esc(U.io.text||'')+'</textarea><div style="display:flex;gap:8px;margin-top:8px">'+(U.io.mode==='import'?'<button class="btn primary" data-pa="doimport">Import</button>':'')+'<button class="btn" data-pa="closeio">Close</button></div></div>'}
  h+='<div class="grid">'+S.projects.map(function(p){var a=analyze(p),cls=a.errors?'err':a.warns?'warn':'ok',txt=a.errors?a.errors+' error'+(a.errors>1?'s':''):a.warns?a.warns+' warning'+(a.warns>1?'s':''):'Clear';
    var del=U.confirmDel===p.id;
    return '<div class="card'+(p.id===S.cur?' cur':'')+'"><div class="thumb" data-open="'+p.id+'" title="Open in designer">'+thumbSvg(p)+'</div><div class="bd"><h3>'+esc(p.name)+'</h3>'
      +'<div class="meta">'+p.items.length+' parts · '+p.wires.length+' wires · '+ago(p.updated)+'</div>'
      +'<div><span class="badge '+cls+'">'+txt+'</span></div>'
      +(p.notes?'<div class="note" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+esc(p.notes)+'</div>':'')
      +'<div class="acts"><button class="btn sm primary" data-open="'+p.id+'">Open</button><button class="btn sm" data-dup="'+p.id+'">Duplicate</button><button class="btn sm" data-exp="'+p.id+'">Export</button>'
      +(del?'<button class="btn sm danger" data-del2="'+p.id+'">Confirm delete</button><button class="btn sm" data-pa="canceldel">Cancel</button>':'<button class="btn sm danger" data-del="'+p.id+'">Delete</button>')
      +'</div></div></div>'}).join('')+'</div>';
  $('projects').innerHTML=h}
function bindProjects(){$('projects').addEventListener('click',function(e){
  var t=e.target,g;
  if((g=t.closest('[data-open]'))){S.cur=g.getAttribute('data-open');U.sel=null;U.wiring=null;U.undo=[];U.redo=[];save();go('designer');return}
  if((g=t.closest('[data-tpl]'))){var p=newProject(g.getAttribute('data-tpl'));S.cur=p.id;U.newOpen=false;U.undo=[];U.redo=[];U.sel=null;save();go('designer');toast('Created '+p.name);return}
  if((g=t.closest('[data-dup]'))){var o=S.projects.find(function(x){return x.id===g.getAttribute('data-dup')}),c=JSON.parse(JSON.stringify(o));c.id=uid();c.name=o.name+' copy';c.updated=Date.now();S.projects.splice(S.projects.indexOf(o),0,c);save();renderProjects();toast('Duplicated');return}
  if((g=t.closest('[data-exp]'))){var q=S.projects.find(function(x){return x.id===g.getAttribute('data-exp')}),txt=JSON.stringify({name:q.name,voltage:q.voltage,notes:q.notes,items:q.items,wires:q.wires},null,1);
    U.io={mode:'export',text:txt};try{navigator.clipboard.writeText(txt).then(function(){toast('Copied to clipboard')},function(){})}catch(x){}renderProjects();var ta=$('io-text');if(ta){ta.focus();ta.select()}return}
  if((g=t.closest('[data-del]'))){U.confirmDel=g.getAttribute('data-del');renderProjects();return}
  if((g=t.closest('[data-del2]'))){var id=g.getAttribute('data-del2');S.projects=S.projects.filter(function(x){return x.id!==id});
    if(!S.projects.length)newProject('blank');if(S.cur===id)S.cur=S.projects[0].id;U.confirmDel=null;save();renderProjects();toast('Project deleted');return}
  if((g=t.closest('[data-pa]'))){var a=g.getAttribute('data-pa');
    if(a==='new'){U.newOpen=!U.newOpen;renderProjects()}
    else if(a==='import'){U.io={mode:'import',text:''};renderProjects();var ta2=$('io-text');if(ta2)ta2.focus()}
    else if(a==='closeio'){U.io=null;renderProjects()}
    else if(a==='canceldel'){U.confirmDel=null;renderProjects()}
    else if(a==='doimport')doImport()}})}
function doImport(){
  var txt=$('io-text').value,d;
  try{d=JSON.parse(txt)}catch(e){toast('That is not valid JSON.');return}
  if(!d||!Array.isArray(d.items)||!Array.isArray(d.wires)){toast('Missing items or wires.');return}
  var items=d.items.filter(function(i){return i&&COMPS[i.type]}).map(function(i){var c=COMPS[i.type];return {id:String(i.id||uid()),type:i.type,x:clamp(+i.x||0,0,W-c.w),y:clamp(+i.y||0,0,H-c.h),rot:[0,90,180,270].indexOf(+i.rot)>=0?+i.rot:0,label:String(i.label||'').slice(0,40),props:Object.assign({},c.props||{},i.props||{})}});
  var byId={};items.forEach(function(i){byId[i.id]=i});
  var wires=d.wires.filter(function(w){return w&&w.a&&w.b&&byId[w.a.item]&&byId[w.b.item]&&termOf(byId[w.a.item],w.a.term)&&termOf(byId[w.b.item],w.b.term)&&WT[w.type]}).map(function(w){return {id:String(w.id||uid()),a:{item:w.a.item,term:w.a.term},b:{item:w.b.item,term:w.b.term},type:w.type,size:AMP[w.size]?+w.size:2.5}});
  var p={id:uid(),name:String(d.name||'Imported project').slice(0,60),voltage:[120,230,240].indexOf(+d.voltage)>=0?+d.voltage:230,notes:String(d.notes||'').slice(0,600),items:items,wires:wires,updated:Date.now()};
  S.projects.unshift(p);S.cur=p.id;U.io=null;U.undo=[];U.redo=[];U.sel=null;save();go('designer');toast('Imported '+p.name)}

/* ---------- guides ---------- */
function kv(rows){return rows.map(function(r){return '<tr>'+r.map(function(c,i){return (i===0?'<td><b>':'<td>')+c+(i===0?'</b></td>':'</td>')}).join('')+'</tr>'}).join('')}
var GUIDES=[
 {id:'colours',cat:'Basics',title:'Wire colours',sum:'Which colour is which, by region',body:function(){return '<p class="lead">Colour tells the next person what a conductor does. Wirebench draws wires in a fixed scheme on screen. Real cable colours depend on where you live.</p>'
  +'<div class="scroll-x"><table class="t"><thead><tr><th>Conductor</th><th>Philippinese, Asia (current)</th><th>US, America</th><th>On screen</th></tr></thead><tbody>'
  +kv([['Live','Brown','Black (red for a second phase)','<i class="sw" style="background:var(--w-live)"></i>Brown'],['Neutral','Blue','White or grey','<i class="sw" style="background:var(--w-neutral)"></i>Blue'],['Earth','Green and yellow','Green or bare copper','<i class="sw" style="background:var(--w-earth)"></i>Green, yellow dashes'],['Switched live','Brown, sleeved if reused','Black or red','<i class="sw" style="background:var(--w-switched)"></i>Purple']])
  +'</tbody></table></div><h3>Good habits</h3><ul><li>Use sleeving when a conductor has to do a different job from its colour, such as a blue wire used as a switched live in old two-core cable.</li><li>Never use green or green and yellow for anything but earth.</li><li>Older installations use older colours. Treat any unexpected colour as unknown until you have tested it.</li></ul>'}},
 {id:'cable-breaker',cat:'Basics',title:'Cable size and breaker rating',sum:'Why the breaker must suit the cable',body:function(){return '<p class="lead">A breaker protects the cable behind it. If the breaker rating is higher than what the cable can carry, the cable can overheat before the breaker trips.</p>'
  +'<p>Rule of thumb: <b>breaker rating ≤ cable current capacity</b>. The table shows rough capacities for twin and earth copper cable in typical conditions. Insulation, bundled cables and hot rooms all reduce them, so check the full tables in your wiring rules.</p>'
  +'<div class="scroll-x"><table class="t"><thead><tr><th>Cable</th><th>About</th><th>Typical use</th><th>Common breaker</th></tr></thead><tbody>'
  +kv([['1.0 mm²','10 A','Light fittings, small loads','6 A'],['1.5 mm²','16 A','Lighting circuits','6 A, 10 A'],['2.5 mm²','25 A','Socket circuits','16 A, 20 A'],['4 mm²','32 A','Cooker, larger socket circuits','32 A'],['6 mm²','40 A','Electric shower','40 A'],['10 mm²','63 A','Large showers, sub-mains','50 A, 63 A'],['16 mm²','80 A','EV charger, sub-mains','63 A']])
  +'</tbody></table></div><h3>What the checker looks for</h3><ul><li>A cable on a breaker terminal that carries less than the breaker rating.</li><li>Total connected load on a breaker that exceeds its rating. Wirebench adds up the watts, divides by the supply voltage and compares.</li><li>A load wired straight to the supply with no breaker or fuse.</li></ul>'}},
 {id:'lighting',cat:'Circuits',title:'Lighting circuit',sum:'Switch, light, neutral, in order',body:function(){return '<p class="lead">A one-way lighting circuit sends the live through a switch to the lamp. The neutral goes straight to the lamp.</p>'
  +'<ol><li>Supply live goes through the RCD and a 6 A breaker.</li><li>Live runs to the switch input.</li><li>The switch output (switched live) runs to the lamp live terminal.</li><li>Neutral runs from the supply to the lamp neutral, without passing through the switch.</li><li>Metal fittings also need an earth connection.</li></ol>'
  +'<div class="callout">Switch the live, never the neutral. A switched neutral leaves the lamp live when the switch is off.</div><p>Try it: open the <b>Hallway lighting</b> sample in Projects.</p>'}},
 {id:'rcd-sockets',cat:'Circuits',title:'Sockets and RCD protection',sum:'Why every socket needs leakage protection',body:function(){return '<p class="lead">An RCD compares the current in the live and neutral. If some leaks to earth, through a person for example, it cuts the supply in a fraction of a second.</p>'
  +'<ul><li>A 30 mA RCD is the usual rating for sockets that could power handheld or outdoor equipment.</li><li>The RCD sits upstream of the breaker and covers every load behind it.</li><li>Press the test button every few months.</li></ul><h3>In Wirebench</h3><p>The checker traces each socket back to the supply. If it can reach the supply without crossing an RCD, you get a warning.</p>'
  +'<div class="callout">Rules for socket circuits vary by country, including ring and radial layouts. Check the rules where you work.</div>'}},
 {id:'earthing',cat:'Circuits',title:'Earthing',sum:'Giving fault current a safe path',body:function(){return '<p class="lead">If a live conductor touches a metal case, the earth wire gives that fault current an easy path back to the supply. The surge trips the breaker and the case stops being live.</p>'
  +'<ul><li>Every socket and every metal-cased appliance needs an earth connection.</li><li>The earth wire must reach the supply earth through connected conductors. A loose end gives no protection.</li><li>Use an earth bar when several earths meet in one place.</li><li>Double-insulated fittings carry no earth connection to the lamp, which is why the light in Wirebench has no earth terminal.</li></ul>'}},
 {id:'safe-work',cat:'Safety',title:'Safe working checklist',sum:'Before you touch a conductor',body:function(){var items=['Plan the job and check which circuits it touches.','Switch off at the breaker or consumer unit.','Lock the breaker off and tag it so nobody switches it back on.','Prove your voltage tester works on a known live source.','Test every conductor you will touch, including earth to neutral and live to earth.','Prove the tester again on the known source.','Only then start work, one circuit at a time.','After finishing, test continuity and insulation before re-energising.'];
  return '<p class="lead">Do these in order every time. Tick them off as you go.</p>'+items.map(function(t,i){var d=U.checklist[i];return '<label class="chk'+(d?' done':'')+'"><input type="checkbox" data-chk="'+i+'"'+(d?' checked':'')+'><span>'+t+'</span></label>'}).join('')
  +'<div class="callout">In many places, fixed wiring work must be done or signed off by a licensed electrician. Check before you start.</div>'}},
 {id:'symbols',cat:'Basics',title:'Symbols in Wirebench',sum:'What each component stands for',body:function(){return '<p class="lead">Each part has terminals marked by a coloured dot: brown for live, purple for switched live, blue for neutral, green for earth and grey for any.</p><div class="legend-sym">'
  +Object.keys(COMPS).map(function(k){var c=COMPS[k];return '<div>'+symbolSvg(k)+'<span><b>'+c.name+'</b><br><span class="note">'+esc(c.desc)+'</span></span></div>'}).join('')+'</div>'}},
 {id:'calc',cat:'Tools',title:'Voltage drop calculator',sum:'Check a long cable run',body:function(){var v=(cur()&&cur().voltage)||230;
  return '<p class="lead">Long runs lose voltage. Enter the load and the cable and see whether the run stays inside the usual limit.</p>'
  +'<div class="calc"><label class="f">Current (A)<input type="number" id="c-i" value="16" min="0.5" max="125" step="0.5"></label><label class="f">One-way length (m)<input type="number" id="c-l" value="25" min="1" max="500" step="1"></label>'
  +'<label class="f">Copper cable<select id="c-a">'+SIZES.map(function(s){return '<option value="'+s+'"'+(s===2.5?' selected':'')+'>'+s+' mm²</option>'}).join('')+'</select></label>'
  +'<label class="f">Supply (V)<input type="number" id="c-v" value="'+v+'" min="12" max="480"></label>'
  +'<label class="f">Limit<select id="c-p"><option value="3">3% lighting</option><option value="5" selected>5% other uses</option></select></label></div><div id="c-out" class="calc"></div>'
  +'<p class="note">Uses copper at working temperature (0.0225 Ω·mm²/m) over the full out and back path. Results are an estimate. Confirm with the tables in your wiring rules.</p>'}}
];
function calcUpdate(){var o=$('c-out');if(!o)return;
  var I=+$('c-i').value,L=+$('c-l').value,A=+$('c-a').value,V=+$('c-v').value,lim=+$('c-p').value;
  if(!(I>0&&L>0&&V>0)){o.innerHTML='';return}
  var vd=2*0.0225*L*I/A,pct=vd/V*100,maxL=lim/100*V*A/(2*0.0225*I),amp=AMP[A];
  var ok=pct<=lim,capOk=I<=amp;
  o.innerHTML='<div class="res"><span class="note">Voltage drop</span><span class="big">'+vd.toFixed(2)+' V</span><span class="mono">'+pct.toFixed(1)+'% of '+V+' V</span><span class="badge '+(ok?'ok':'err')+'" style="justify-self:start">'+(ok?'Within '+lim+'%':'Over '+lim+'%')+'</span></div>'
   +'<div class="res"><span class="note">Longest run within limit</span><span class="big">'+Math.floor(maxL)+' m</span><span class="mono">at '+I+' A on '+A+' mm²</span></div>'
   +'<div class="res"><span class="note">Cable capacity</span><span class="big">about '+amp+' A</span><span class="badge '+(capOk?'ok':'err')+'" style="justify-self:start">'+(capOk?'Carries '+I+' A':'Too small for '+I+' A')+'</span></div>'}
function renderGuides(){
  var cats=['All','Basics','Circuits','Safety','Tools'],q=U.gq.toLowerCase();
  var list=GUIDES.filter(function(g){return (U.gcat==='All'||g.cat===U.gcat)&&(!q||(g.title+' '+g.sum).toLowerCase().indexOf(q)>=0)});
  var g=GUIDES.find(function(x){return x.id===U.gview})||GUIDES[0];
  var h='<div class="page-h"><h1>Wiring guides</h1><span class="note">Planning help. Not a substitute for your local wiring rules.</span></div><div class="guides"><div class="glist">'
   +'<input type="text" id="g-q" placeholder="Search guides" value="'+esc(U.gq)+'" aria-label="Search guides"><div class="chips">'+cats.map(function(c){return '<button class="chip" data-gcat="'+c+'" aria-pressed="'+(c===U.gcat)+'">'+c+'</button>'}).join('')+'</div>'
   +(list.length?list.map(function(x){return '<button class="gitem" data-g="'+x.id+'" aria-current="'+(x.id===g.id)+'"><b>'+x.title+'</b><small>'+x.sum+'</small></button>'}).join(''):'<div class="note">No guides match that search.</div>')
   +'</div><article class="doc"><h2>'+g.title+'</h2>'+g.body()+'</article></div>';
  var keep=document.activeElement&&document.activeElement.id==='g-q';
  $('guides').innerHTML=h;if(keep){var i=$('g-q');i.focus();i.setSelectionRange(i.value.length,i.value.length)}
  if(g.id==='calc')calcUpdate()}
function bindGuides(){var el=$('guides');
  el.addEventListener('click',function(e){var b;
    if((b=e.target.closest('[data-g]'))){U.gview=b.getAttribute('data-g');renderGuides()}
    else if((b=e.target.closest('[data-gcat]'))){U.gcat=b.getAttribute('data-gcat');renderGuides()}});
  el.addEventListener('input',function(e){var t=e.target;
    if(t.id==='g-q'){U.gq=t.value;renderGuides()}
    else if(t.id&&t.id.indexOf('c-')===0)calcUpdate()});
  el.addEventListener('change',function(e){var t=e.target;
    if(t.hasAttribute('data-chk')){U.checklist[t.getAttribute('data-chk')]=t.checked;t.closest('.chk').classList.toggle('done',t.checked)}
    else if(t.id&&t.id.indexOf('c-')===0)calcUpdate()})}

/* ---------- account (sign-in, profile) ---------- */
var A={mode:null,id:null,profile:null,tab:'signin',msg:'',msgErr:false,editing:false,noSave:false,fails:0,lock:0};
var LS_OUT='wirebench:signedout',LS_SESS='wirebench:session',LS_PROF='wirebench:profile:guest',LS_WS='wirebench:v1';
var REGIONS={uk:{name:'Philippines, Asia',v:230},na:{name:'US / America',v:120},other:{name:'Other',v:230}};
var ROLES=['Homeowner / DIY','Electrician','Electrical engineer','Student','Facilities / maintenance'];
function lget(k){try{return localStorage.getItem(k)}catch(e){return null}}
function lset(k,v){try{localStorage.setItem(k,v)}catch(e){}}
function ldel(k){try{localStorage.removeItem(k)}catch(e){}}
function pj(s){try{return s?JSON.parse(s):null}catch(e){return null}}
function initials(n){var p=String(n||'').trim().split(/\s+/);return ((p[0]||'?').charAt(0)+(p.length>1?p[p.length-1].charAt(0):'')).toUpperCase()}
function avatarMarkup(lg){var P=A.profile||{};return '<span class="av'+(lg?' lg':'')+'">'+esc(initials(P.name))+'</span>'}
function withTimeout(p,ms){return Promise.race([p,new Promise(function(r){setTimeout(function(){r(null)},ms)})])}

/* accounts live on this device. Passwords are kept only as salted PBKDF2 hashes. */
var LS_ACC='wirebench:accounts';
var ACC=(function(){var d=pj(lget(LS_ACC));return d&&Array.isArray(d.users)?d:{users:[]}})();
function saveAcc(){lset(LS_ACC,JSON.stringify(ACC))}
function wsKey(){return A.mode==='account'?'wirebench:ws:'+A.id:LS_WS}
function save(){if(A.noSave||!A.mode)return;lset(wsKey(),JSON.stringify({projects:S.projects,cur:S.cur}))}
function b64(buf){var t='';new Uint8Array(buf).forEach(function(b){t+=String.fromCharCode(b)});return btoa(t)}
function unb64(t){var b=atob(t),a=new Uint8Array(b.length);for(var i=0;i<b.length;i++)a[i]=b.charCodeAt(i);return a}
function derive(pw,salt){return crypto.subtle.importKey('raw',new TextEncoder().encode(pw),'PBKDF2',false,['deriveBits']).then(function(k){return crypto.subtle.deriveBits({name:'PBKDF2',salt:salt,iterations:150000,hash:'SHA-256'},k,256)}).then(b64)}
function strength(pw){var n=0;if(pw.length>=8)n++;if(pw.length>=12)n++;if(/[a-z]/.test(pw)&&/[A-Z]/.test(pw))n++;if(/\d/.test(pw)&&/[^A-Za-z0-9]/.test(pw))n++;return n}

function seed(){['lighting','sockets','heater'].reverse().forEach(function(k){newProject(k)});
  var h=S.projects.find(function(p){return p.name==='Hallway lighting'});S.cur=(h||S.projects[0]).id}
function enter(mode){
  A.mode=mode;A.noSave=false;S.projects=[];S.cur=null;
  var d=pj(lget(wsKey()));if(d&&Array.isArray(d.projects)){S.projects=d.projects;S.cur=d.cur}
  if(!S.projects.length){seed();A.mode=mode;save()}
  if(!S.projects.some(function(p){return p.id===S.cur}))S.cur=S.projects[0].id;
  U.undo=[];U.redo=[];U.sel=null;U.wiring=null;A.editing=false;A.msg='';
  $('gate').hidden=true;$('site').hidden=true;$('app').hidden=false;renderMe();
  var v=location.hash.slice(1);show(v||'dashboard')}
function signOut(){
  save();ldel(LS_SESS);
  A.mode=null;A.profile=null;A.id=null;S.projects=[];S.cur=null;A.tab='signin';A.msg='';A.msgErr=false;
  $('app').hidden=true;$('gate').hidden=true;$('site').hidden=false;renderGate();window.scrollTo(0,0);toast('You have signed out of Wirebench.')}
function renderMe(){var P=A.profile||{};
  $('me').innerHTML=avatarMarkup(false)+'<div class="me-t"><b>'+esc(P.name||'Guest')+'</b><small>'+esc(P.role||'')+(A.mode==='guest'?' · this device':'')+'</small></div><button class="btn ghost sm" data-me="out">Sign out</button>'}

/* profile form shared by sign-up and the dashboard editor */
function profileFields(v,pre){
  return '<label class="f">Full name<input type="text" id="'+pre+'name" maxlength="60" value="'+esc(v.name)+'" autocomplete="name"></label>'
   +'<div class="row2"><label class="f">Role<select id="'+pre+'role">'+ROLES.map(function(r){return '<option'+(r===v.role?' selected':'')+'>'+r+'</option>'}).join('')+'</select></label>'
   +'<label class="f">Region<select id="'+pre+'region">'+Object.keys(REGIONS).map(function(k){return '<option value="'+k+'"'+(k===v.region?' selected':'')+'>'+REGIONS[k].name+' · '+REGIONS[k].v+' V</option>'}).join('')+'</select></label></div>'
   +'<label class="f">Company or organisation (optional)<input type="text" id="'+pre+'co" maxlength="60" value="'+esc(v.company)+'" autocomplete="organization"></label>'}
function readProfile(pre){var r=$(pre+'region').value;return {name:$(pre+'name').value.trim().slice(0,60),role:$(pre+'role').value,company:$(pre+'co').value.trim().slice(0,60),region:r,voltage:(REGIONS[r]||REGIONS.uk).v}}

/* gate */
function pwField(id,label,ac,toggle){return '<label class="f">'+label+'<span class="pwrow"><input type="password" data-pw id="'+id+'" autocomplete="'+ac+'" maxlength="128">'+(toggle?'<button type="button" class="btn sm" data-gate="toggle" aria-label="Show or hide passwords">Show</button>':'')+'</span></label>'}
function signinHTML(){
  return '<h2>Welcome back</h2><p>Sign in to open your saved projects and dashboard.</p>'
   +'<form id="login-form" class="stack" novalidate><label class="f">Email or username<input type="text" id="l-id" autocomplete="username" autocapitalize="none" spellcheck="false" maxlength="120"></label>'
   +pwField('l-pw','Password','current-password',true)
   +'<div class="form-err" id="gate-err" role="alert"></div><button class="btn primary big" type="submit" id="l-go">Sign in</button></form>'
   +'<div class="or">or</div><button class="btn big" data-gate="guest">Continue as guest on this device</button>'
   +'<p class="note">Accounts are stored on this device only. There is no server, so a forgotten password cannot be reset and the account does not follow you to another browser. Do not reuse a password from another site.</p>'
   +'<p class="note">New here? <button class="link" data-gtab="register">Create an account</button></p>'}
function registerHTML(){
  var v={name:'',role:ROLES[0],company:'',region:'uk'};
  return '<h2>Create your account</h2><p>Choose a username and password, then set up your profile.</p>'
   +'<form id="reg-form" class="stack" novalidate>'+profileFields(v,'r-')
   +'<div class="row2"><label class="f">Username<input type="text" id="r-user" autocomplete="username" autocapitalize="none" spellcheck="false" maxlength="24"></label><label class="f">Email<input type="email" id="r-email" autocomplete="email" maxlength="120"></label></div>'
   +pwField('r-pw','Password','new-password',true)
   +'<div class="meter" aria-hidden="true"><i id="pw-meter"></i></div><span class="note" id="pw-note">Use at least 8 characters.</span>'
   +pwField('r-pw2','Confirm password','new-password',false)
   +'<label style="display:flex;gap:9px;align-items:flex-start;font-size:13px"><input type="checkbox" id="r-terms" style="margin-top:3px;accent-color:var(--accent)"><span>I understand Wirebench checks are a planning aid and do not replace a qualified electrician or local wiring rules.</span></label>'
   +'<div class="form-err" id="gate-err" role="alert"></div><button class="btn primary big" type="submit" id="r-go">Create account</button></form>'
   +'<p class="note">Stored on this device only. Do not reuse a password from another site.</p>'
   +'<p class="note">Already registered? <button class="link" data-gtab="signin">Sign in</button></p>'}
function renderGate(){
  var g=$('gate'),form=A.tab==='register'?registerHTML():signinHTML();
  g.innerHTML='<div class="gate-l"><div class="brand"><svg viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 15h6l3-9 5 17 3-8h7"/></svg>Wirebench</div>'
   +'<h1>Plan electrical work with fewer surprises</h1><div class="gate-pic">'+thumbSvg(TEMPLATES.lighting.build())+'</div>'
   +'<ul><li>Draw circuits from standard parts: supply, protection, switches and loads.</li><li>Automatic checks catch missing earths, undersized cable and unprotected loads.</li><li>Your projects and dashboard, saved in this browser.</li></ul></div>'
   +'<div class="gate-r"><div class="gate-card"><div class="seg" role="group" aria-label="Account"><button data-gtab="signin" aria-pressed="'+(A.tab==='signin')+'">Sign in</button><button data-gtab="register" aria-pressed="'+(A.tab==='register')+'">Create account</button></div>'
   +(A.msg?'<div class="msg'+(A.msgErr?' err':'')+'" role="status">'+esc(A.msg)+'</div>':'')+form+'<p class="note"><button class="link" data-gate="back">Back to website</button></p></div></div>'}
function gateErr(m){var e=$('gate-err');if(e)e.textContent=m||''}
function signInGuest(){
  var gp=pj(lget(LS_PROF));
  if(!gp){gp={name:'Guest',role:ROLES[0],company:'',region:'uk',voltage:230,created:Date.now()};lset(LS_PROF,JSON.stringify(gp))}
  A.profile=gp;A.id=null;lset(LS_SESS,'guest');enter('guest')}
function login(){
  var idf=$('l-id').value.trim().toLowerCase(),pw=$('l-pw').value,btn=$('l-go');
  if(!idf||!pw){gateErr('Enter your email or username and your password.');return}
  if(!(window.crypto&&crypto.subtle)){gateErr('This browser cannot verify passwords securely. Continue as guest instead.');return}
  if(Date.now()<A.lock){gateErr('Too many attempts. Try again in '+Math.ceil((A.lock-Date.now())/1000)+' seconds.');return}
  var u=ACC.users.find(function(x){return x.email===idf||x.username===idf});btn.disabled=true;
  derive(pw,u?unb64(u.salt):crypto.getRandomValues(new Uint8Array(16))).then(function(h){
    if(u&&h===u.hash){A.fails=0;u.prev=u.last||null;u.last=Date.now();saveAcc();A.id=u.id;A.profile=u;lset(LS_SESS,'u:'+u.id);enter('account')}
    else{btn.disabled=false;A.fails++;if(A.fails>=5){A.lock=Date.now()+30000;A.fails=0;gateErr('Too many attempts. Try again in 30 seconds.')}else gateErr('The email, username or password is incorrect.')}})
   .catch(function(){btn.disabled=false;gateErr('Could not sign in. Try again.')})}
function register(){
  var v=readProfile('r-'),un=$('r-user').value.trim().toLowerCase(),em=$('r-email').value.trim().toLowerCase(),pw=$('r-pw').value,btn=$('r-go');
  if(!(window.crypto&&crypto.subtle)){gateErr('This browser cannot create secure accounts. Continue as guest instead.');return}
  if(v.name.length<2){gateErr('Enter your full name.');return}
  if(!/^[a-z0-9_.-]{3,24}$/.test(un)){gateErr('Username must be 3 to 24 characters: letters, numbers, dot, dash or underscore.');return}
  if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)){gateErr('Enter a valid email address.');return}
  if(pw.length<8){gateErr('Password must be at least 8 characters.');return}
  if(pw!==$('r-pw2').value){gateErr('The two passwords do not match.');return}
  if(!$('r-terms').checked){gateErr('Please accept the planning-aid note to continue.');return}
  if(ACC.users.some(function(x){return x.username===un})){gateErr('That username is taken.');return}
  if(ACC.users.some(function(x){return x.email===em})){gateErr('An account with that email already exists. Sign in instead.');return}
  btn.disabled=true;var salt=crypto.getRandomValues(new Uint8Array(16));
  derive(pw,salt).then(function(h){
    var u=Object.assign({id:uid()+uid(),username:un,email:em,salt:b64(salt),hash:h,created:Date.now(),last:Date.now(),prev:null},v);
    ACC.users.push(u);saveAcc();A.id=u.id;A.profile=u;lset(LS_SESS,'u:'+u.id);enter('account');toast('Welcome, '+v.name.split(' ')[0])})
   .catch(function(){btn.disabled=false;gateErr('Could not create the account. Try again.')})}
function openGate(tab){if(tab){A.tab=tab;A.msg='';A.msgErr=false}$('site').hidden=true;$('gate').hidden=false;renderGate();window.scrollTo(0,0)}
function closeGate(){$('gate').hidden=true;$('site').hidden=false;window.scrollTo(0,0)}
function bindSite(){
  $('hero-pic').innerHTML=thumbSvg(TEMPLATES.sockets.build());
  $('site').addEventListener('click',function(e){var b=e.target.closest('[data-site],[data-scroll]');if(!b)return;
    if(b.hasAttribute('data-scroll')){var t=$('s-'+b.getAttribute('data-scroll'));if(t)t.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});return}
    var a=b.getAttribute('data-site');
    if(a==='guest')signInGuest();
    else openGate(a)})}
function bindGate(){var g=$('gate');
  g.addEventListener('click',function(e){var b;
    if((b=e.target.closest('[data-gtab]'))){A.tab=b.getAttribute('data-gtab');A.msg='';renderGate()}
    else if((b=e.target.closest('[data-gate]'))){var gt=b.getAttribute('data-gate');if(gt==='toggle'){var els=g.querySelectorAll('[data-pw]'),sh=els[0].type==='password';Array.prototype.forEach.call(els,function(i){i.type=sh?'text':'password'});b.textContent=sh?'Hide':'Show'}else if(gt==='back')closeGate();else signInGuest()}});
  g.addEventListener('submit',function(e){e.preventDefault();if(e.target.id==='reg-form')register();else if(e.target.id==='login-form')login()});
  g.addEventListener('input',function(e){if(e.target.id==='r-pw'){var n=strength(e.target.value),m=$('pw-meter');m.style.width=(n*25)+'%';m.style.background=n<2?'var(--err)':n<3?'var(--warn)':'var(--ok)';$('pw-note').textContent=e.target.value?['Too weak','Weak','Fair','Good','Strong'][n]:'Use at least 8 characters.'}});
  $('me').addEventListener('click',function(e){if(e.target.closest('[data-me="out"]'))signOut()})}

/* ---------- dashboard ---------- */
function greet(){var h=new Date().getHours();return h<12?'Good morning':h<18?'Good afternoon':'Good evening'}
function openProject(id,ref){S.cur=id;U.sel=ref||null;U.wiring=null;U.undo=[];U.redo=[];save();go('designer')}
function renderDashboard(){
  var P=A.profile||{name:'there',role:'',company:'',region:'uk',voltage:230};
  var rows=S.projects.map(function(p){return {p:p,a:analyze(p)}}),parts=0,errs=0,warns=0,sum=0;
  rows.forEach(function(r){parts+=r.p.items.length;errs+=r.a.errors;warns+=r.a.warns;sum+=r.a.score});
  var avg=rows.length?Math.round(sum/rows.length):null;
  var recent=rows.slice().sort(function(a,b){return b.p.updated-a.p.updated}).slice(0,6);
  U.attn=[];rows.forEach(function(r){r.a.issues.forEach(function(i){if(i.sev!=='info')U.attn.push({pid:r.p.id,pname:r.p.name,i:i})})});
  U.attn.sort(function(a,b){return (b.i.sev==='error'?1:0)-(a.i.sev==='error'?1:0)});U.attn=U.attn.slice(0,6);
  var first=(P.name||'there').split(' ')[0],sub=[P.role,P.company,(REGIONS[P.region]||REGIONS.uk).name].filter(Boolean).join(' · ');
  var h='<div class="page-h"><div><h1>'+greet()+', '+esc(first)+'</h1><div class="note">'+esc(sub)+'</div></div><span class="sp"></span><button class="btn" data-da="open-last">Resume last project</button><button class="btn primary" data-tpl="blank">New project</button></div>';
  h+='<div class="kpis">'
   +'<div class="kpi"><div class="l">Projects</div><div class="n">'+rows.length+'</div><div class="s">saved '+(A.mode==='account'?'in your account':'as a guest')+'</div></div>'
   +'<div class="kpi"><div class="l">Components placed</div><div class="n">'+parts+'</div><div class="s">across all projects</div></div>'
   +'<div class="kpi"><div class="l">Open issues</div><div class="n '+(errs?'err':warns?'warn':'')+'">'+(errs+warns)+'</div><div class="s">'+errs+' errors, '+warns+' warnings</div></div>'
   +'<div class="kpi"><div class="l">Average design score</div><div class="n">'+(avg===null?'–':avg)+'</div><div class="s">out of 100</div></div></div>';
  h+='<div class="dash"><div class="dash-main">';
  h+='<div class="panel"><div class="panel-h"><h2>Recent projects</h2><button class="btn sm" data-go="projects">View all</button></div><div class="scroll-x"><table class="tbl"><thead><tr><th>Project</th><th class="num">Parts</th><th class="num">Wires</th><th>Status</th><th>Updated</th><th></th></tr></thead><tbody>'
   +recent.map(function(r){var a=r.a,cls=a.errors?'err':a.warns?'warn':'ok',txt=a.errors?a.errors+' error'+(a.errors>1?'s':''):a.warns?a.warns+' warning'+(a.warns>1?'s':''):'Clear';
     return '<tr><td class="pn">'+esc(r.p.name)+'</td><td class="num">'+r.p.items.length+'</td><td class="num">'+r.p.wires.length+'</td><td><span class="badge '+cls+'">'+txt+'</span></td><td class="note">'+ago(r.p.updated)+'</td><td style="text-align:right"><button class="btn sm primary" data-open="'+r.p.id+'">Open</button></td></tr>'}).join('')
   +'</tbody></table></div></div>';
  h+='<div class="panel"><div class="panel-h"><h2>Needs attention</h2></div>'
   +(U.attn.length?U.attn.map(function(x,n){return '<div class="attn"><span class="sev '+x.i.sev+'"></span><div class="t">'+esc(x.i.msg)+'<small>'+esc(x.pname)+'</small></div><button class="btn sm" data-attn="'+n+'">Fix</button></div>'}).join(''):'<div class="note">No errors or warnings in any project.</div>')+'</div>';
  h+='<div class="panel"><div class="panel-h"><h2>Design score by project</h2></div><div class="bars">'
   +rows.slice(0,8).map(function(r){var c=r.a.score>=90?'ok':r.a.score>=60?'warn':'err';return '<div class="bar-row"><span title="'+esc(r.p.name)+'">'+esc(r.p.name)+'</span><div class="bar-track"><div class="bar-fill '+c+'" style="width:'+r.a.score+'%"></div></div><b>'+r.a.score+'</b></div>'}).join('')
   +'</div><div class="note" style="margin-top:10px">Each error removes 25 points and each warning 8. A score of 100 means no checks failed.</div></div>';
  h+='</div><div class="dash-side">';
  h+='<div class="panel"><div class="panel-h"><h2>Your profile</h2>'+(A.editing?'':'<button class="btn sm" data-da="edit">Edit</button>')+'</div>';
  if(A.editing)h+='<form id="d-form" class="stack">'+profileFields(P,'d-')+'<div class="row2"><button class="btn primary" type="submit">Save</button><button class="btn" type="button" data-da="cancel">Cancel</button></div></form>';
  else h+='<div class="prof">'+avatarMarkup(true)+'<div><b>'+esc(P.name)+'</b><span class="note">'+esc(P.role||'')+'</span></div></div><dl class="kv"><dt>Company</dt><dd>'+esc(P.company||'Not set')+'</dd><dt>Region</dt><dd>'+esc((REGIONS[P.region]||REGIONS.uk).name)+'</dd><dt>Default voltage</dt><dd class="mono">'+(P.voltage||230)+' V</dd><dt>Stored in</dt><dd>'+(A.mode==='account'?'Your account, this browser':'This browser (guest)')+'</dd></dl>';
  h+='</div>';
  h+='<div class="panel"><div class="panel-h"><h2>Start from a template</h2></div><div class="quick">'+['lighting','sockets','heater'].map(function(k){return '<button data-tpl="'+k+'"><b>'+TEMPLATES[k].name+'</b><span>'+TEMPLATES[k].desc+'</span></button>'}).join('')+'</div></div>';
  h+='<div class="panel"><div class="panel-h"><h2>Before you start work</h2></div><p class="note" style="margin:0 0 8px">Isolate, lock off, then prove the circuit dead with a tester you have proved on a known source.</p><button class="btn sm" data-guide="safe-work">Open the safety checklist</button></div>';
  h+='</div></div>';
  $('dash').innerHTML=h}
async function saveProfile(){
  var v=readProfile('d-');if(!v.name){toast('Enter your name.');return}v.created=(A.profile&&A.profile.created)||Date.now();
  if(A.mode==='account'){var au=ACC.users.find(function(x){return x.id===A.id});if(au){Object.assign(au,v);saveAcc();v=au}}else lset(LS_PROF,JSON.stringify(v));
  A.profile=v;A.editing=false;renderMe();renderDashboard();toast('Profile saved')}
function bindDash(){var el=$('dash');
  el.addEventListener('click',function(e){var t=e.target,g;
    if((g=t.closest('[data-open]'))){openProject(g.getAttribute('data-open'));return}
    if((g=t.closest('[data-attn]'))){var a=U.attn[+g.getAttribute('data-attn')];if(a)openProject(a.pid,a.i.ref?(a.i.ref.item?{type:'item',id:a.i.ref.item}:{type:'wire',id:a.i.ref.wire}):null);return}
    if((g=t.closest('[data-tpl]'))){var p=newProject(g.getAttribute('data-tpl'));openProject(p.id);toast('Created '+p.name);return}
    if((g=t.closest('[data-guide]'))){U.gview=g.getAttribute('data-guide');go('guides');return}
    if((g=t.closest('[data-go]'))){go(g.getAttribute('data-go'));return}
    if((g=t.closest('[data-da]'))){var d=g.getAttribute('data-da');
      if(d==='edit'){A.editing=true;renderDashboard()}else if(d==='cancel'){A.editing=false;renderDashboard()}
      else if(d==='open-last'){openProject(S.cur)}}});
  el.addEventListener('submit',function(e){e.preventDefault();if(e.target.id==='d-form')saveProfile()})}

/* ---------- routing ---------- */
var VIEWS=['dashboard','designer','projects','guides'];
function go(v){if(location.hash!=='#'+v)location.hash=v;else show(v)}
function show(v){if(VIEWS.indexOf(v)<0)v='dashboard';if(!A.mode)return;U.view=v;
  VIEWS.forEach(function(n){$('v-'+n).classList.toggle('on',n===v)});
  Array.prototype.forEach.call(document.querySelectorAll('.nav-item'),function(b){if(b.getAttribute('data-view')===v)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current')});
  if(v==='designer'){refreshToolbar();refreshCanvas();refreshProps();refreshChecks()}
  else if(v==='dashboard')renderDashboard();else if(v==='projects')renderProjects();else renderGuides()}

/* ---------- keyboard ---------- */
document.addEventListener('keydown',function(e){
  var tg=e.target.tagName;if(tg==='INPUT'||tg==='SELECT'||tg==='TEXTAREA')return;
  if(U.view!=='designer'||!A.mode)return;
  if(e.key==='Escape'){if(U.wiring){U.wiring=null;refreshCanvas()}else if(U.sel){U.sel=null;refreshCanvas();refreshProps();refreshToolbar()}}
  else if(e.key==='Delete'||e.key==='Backspace'){if(U.sel){e.preventDefault();delSel()}}
  else if((e.key==='r'||e.key==='R')&&!e.ctrlKey&&!e.metaKey){rotSel()}
  else if((e.ctrlKey||e.metaKey)&&(e.key==='z'||e.key==='Z')){e.preventDefault();if(e.shiftKey)redo();else undo()}
  else if((e.ctrlKey||e.metaKey)&&(e.key==='y'||e.key==='Y')){e.preventDefault();redo()}});

/* ---------- boot ---------- */
function boot(){
  var ss=lget(LS_SESS);
  if(ss==='guest')return signInGuest();
  if(ss&&ss.indexOf('u:')===0){var u=ACC.users.find(function(x){return x.id===ss.slice(2)});if(u){A.id=u.id;A.profile=u;return enter('account')}}
  renderGate();$('site').hidden=false}
(function init(){
  if(window.innerWidth<700)U.zoom=.5;
  buildPalette();buildToolbar();bindCanvas();bindInspector();bindChecks();bindProjects();bindGuides();bindDash();bindGate();bindSite();
  Array.prototype.forEach.call(document.querySelectorAll('.nav-item'),function(b){b.addEventListener('click',function(){go(b.getAttribute('data-view'))})});
  window.addEventListener('hashchange',function(){show(location.hash.slice(1))});
  boot();
})();
})();