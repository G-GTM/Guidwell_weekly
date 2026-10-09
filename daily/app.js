var LOGO='<svg class="logo" viewBox="0 0 260 64" width="208" height="51" role="img" aria-label="guidewell"><rect x="0" y="4" width="56" height="56" rx="12" fill="#FFFFFF"/><g fill="none" stroke="#334FB5" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="38" cy="20" r="4"/><path d="M38 26v14M38 40l-5 10M38 40l5 10M38 30l7-9"/><circle cx="19" cy="28" r="3.5"/><path d="M19 33v11M19 44l-4 8M19 44l4 8M19 36l8-4"/></g><text x="68" y="34" fill="#FFFFFF" font-family="Poppins,Arial,sans-serif" font-weight="600" font-size="30">guidewell</text><text x="69" y="54" fill="#FFFFFF" font-family="Poppins,Arial,sans-serif" font-weight="300" font-size="11" letter-spacing="3.2">Your Goal. We Guide</text></svg>';
var TEAMS={BD:'Business Development',Robert:'Robert'};
function esc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function md(t){
  var lines=esc(t).split('\n'),out='',list=false;
  lines.forEach(function(l){
    var b=l.replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>');
    if(/^\s*[-*] /.test(l)){if(!list){out+='<ul>';list=true}out+='<li>'+b.replace(/^\s*[-*] /,'')+'</li>'}
    else{if(list){out+='</ul>';list=false}if(l.trim())out+='<p>'+b+'</p>'}
  });
  if(list)out+='</ul>';
  return out;
}
function load(cb){
  fetch('data.json?'+Date.now()).then(function(r){return r.json()}).then(function(d){
    d.leads=(d.leads||[]).map(function(x){
      try{x.obj=JSON.parse(x.lead);['jobTitle','headline'].forEach(function(k){if(x.obj[k+'Enc']!==undefined){try{x.obj[k]=decodeURIComponent(x.obj[k+'Enc'])}catch(e){x.obj[k]=x.obj[k+'Enc']}delete x.obj[k+'Enc']}})}catch(e){x.obj=null}
      x.replied=Number(x.fingerprint)>1;
      x.campaign=x.campaign||'(no campaign)';
      return x;
    });
    cb(d);
  }).catch(function(e){
    document.getElementById('app').innerHTML='<div class="wrap"><div class="panel"><p class="empty">Could not load the call data. '+esc(e)+'</p></div></div>';
  });
}
function header(d,eyebrow,title,sub,back){
  return '<header class="band">'+(back?'<a class="back" href="index.html">&larr; Dashboard</a>':'')+LOGO+'<div class="eyebrow">'+esc(eyebrow)+'</div><h1>'+esc(title)+'</h1><p>'+esc(sub)+'</p></header>';
}
function foot(d){return '<footer><p>guidewell. Your Goal. We Guide.</p><p>Data refreshed '+esc(d.generated||'')+' (SAST). Tick calls off in the sheet.</p></footer>'}
function count(a,f){return a.filter(f).length}
function renderIndex(d){
  var L=d.leads,bd=L.filter(function(x){return x.team==='BD'}),rb=L.filter(function(x){return x.team==='Robert'});
  var h=header(d,'Daily calling dashboard','Outstanding calls','Open leads that still need a call, as of '+(d.generated||''));
  h+='<div class="wrap"><div class="kpis">';
  [['Outstanding calls',L.length,'All teams'],['Business Development',bd.length,'Open calls'],['Robert',rb.length,'Open calls'],['Email leads',count(L,function(x){return x.channel==='Email'}),'From Smartlead'],['LinkedIn leads',count(L,function(x){return x.channel==='LinkedIn'}),'From HeyReach'],['Replied',count(L,function(x){return x.replied}),'Replied to outreach']].forEach(function(k){
    h+='<div class="kpi"><div class="l">'+k[0]+'</div><div class="v">'+k[1]+'</div><div class="s">'+k[2]+'</div></div>';
  });
  h+='</div><div class="teams">';
  [['BD',bd],['Robert',rb]].forEach(function(t){
    var e=count(t[1],function(x){return x.channel==='Email'}),l=count(t[1],function(x){return x.channel==='LinkedIn'}),r=count(t[1],function(x){return x.replied});
    h+='<div class="team"><div class="eyebrow" style="color:var(--sky)">Team</div><h2>'+TEAMS[t[0]]+'</h2><div class="big">'+t[1].length+'</div><div class="split">'+e+' email &middot; '+l+' LinkedIn &middot; '+r+' replied</div><a class="btn" href="team.html?team='+t[0]+'">Open call list &rarr;</a></div>';
  });
  h+='</div>';
  var map={};
  L.forEach(function(x){var k=x.channel+'|'+x.campaign;if(!map[k])map[k]={channel:x.channel,campaign:x.campaign,BD:0,Robert:0};map[k][x.team==='Robert'?'Robert':'BD']++});
  var rows=Object.keys(map).map(function(k){var m=map[k];m.total=m.BD+m.Robert;return m}).sort(function(a,b){return b.total-a.total});
  var max=rows.length?rows[0].total:1;
  h+='<section class="panel"><h2>Campaigns with the most outstanding calls</h2><div class="legend"><span><span class="dot" style="background:#5B9BD5"></span>Business Development</span><span><span class="dot" style="background:#334FB5"></span>Robert</span></div>';
  if(!rows.length)h+='<p class="empty">No outstanding calls.</p>';
  rows.forEach(function(m){
    h+='<div class="camp"><div class="top"><span>'+esc(m.campaign)+' <span class="tag">'+esc(m.channel)+'</span></span><span>'+m.total+' calls &middot; BD '+m.BD+' &middot; Robert '+m.Robert+'</span></div><div class="bar" style="width:'+Math.max(4,Math.round(m.total/max*100))+'%"><span style="width:'+(m.BD/m.total*100)+'%;background:#5B9BD5"></span><span style="width:'+(m.Robert/m.total*100)+'%;background:#334FB5"></span></div></div>';
  });
  h+='</section></div>'+foot(d);
  document.getElementById('app').innerHTML=h;
}
function flat(o,p,out,depth){
  if(o==null)return;
  if(Array.isArray(o)){o.forEach(function(v,i){flat(v,p+(p?' ':'')+(i+1),out,depth+1)});return}
  if(typeof o==='object'){Object.keys(o).forEach(function(k){flat(o[k],p?p+' / '+k:k,out,depth+1)});return}
  var s=String(o).trim();
  if(s==='')return;
  out.push([p,s]);
}
function renderTeam(d){
  var team=(new URLSearchParams(location.search).get('team')==='Robert')?'Robert':'BD';
  var all=d.leads.filter(function(x){return x.team===team});
  var camps=[];all.forEach(function(x){if(camps.indexOf(x.campaign)<0)camps.push(x.campaign)});
  var h=header(d,'Daily calling dashboard',TEAMS[team],all.length+' outstanding calls. Click a lead to open the call brief.',true);
  h+='<div class="wrap"><section class="panel"><div class="filters"><input id="q" placeholder="Search name, company or campaign"><select id="ch"><option value="">All channels</option><option>Email</option><option>LinkedIn</option></select><select id="cp"><option value="">All campaigns</option>'+camps.map(function(c){return '<option>'+esc(c)+'</option>'}).join('')+'</select><label><input type="checkbox" id="rp" style="flex:none;min-width:0"> Replied only</label></div><table><thead><tr><th>Name</th><th>Company</th><th>Channel</th><th>Campaign</th><th>Status</th></tr></thead><tbody id="rows"></tbody></table><p id="none" class="empty" style="display:none">No leads match.</p></section></div>'+foot(d)+'<div class="overlay" id="ov"><div class="drawer" id="dr"></div></div>';
  document.getElementById('app').innerHTML=h;
  function draw(){
    var q=document.getElementById('q').value.toLowerCase(),ch=document.getElementById('ch').value,cp=document.getElementById('cp').value,rp=document.getElementById('rp').checked;
    var list=all.filter(function(x){return (!ch||x.channel===ch)&&(!cp||x.campaign===cp)&&(!rp||x.replied)&&(!q||(x.name+' '+x.company+' '+x.campaign).toLowerCase().indexOf(q)>=0)});
    document.getElementById('rows').innerHTML=list.map(function(x){
      return '<tr class="row" data-k="'+esc(x.key)+'"><td>'+esc(x.name)+'</td><td>'+esc(x.company)+'</td><td><span class="tag">'+esc(x.channel)+'</span></td><td>'+esc(x.campaign)+'</td><td>'+(x.replied?'<span class="tag tag-good">Replied</span>':'<span class="tag tag-warn">No reply</span>')+'</td></tr>';
    }).join('');
    document.getElementById('none').style.display=list.length?'none':'block';
  }
  ['q','ch','cp','rp'].forEach(function(id){document.getElementById(id).addEventListener('input',draw)});
  draw();
  var ov=document.getElementById('ov'),dr=document.getElementById('dr');
  function close(){ov.classList.remove('open')}
  ov.addEventListener('click',function(e){if(e.target===ov)close()});
  document.addEventListener('keydown',function(e){if(e.key==='Escape')close()});
  document.getElementById('rows').addEventListener('click',function(e){
    var tr=e.target.closest('tr.row');if(!tr)return;
    var x=all.filter(function(y){return y.key===tr.getAttribute('data-k')})[0];if(!x)return;
    var rows=[];
    if(x.obj){flat(x.obj,'',rows,0)}else{rows.push(['Raw data',x.lead||''])}
    var kv=rows.map(function(r){
      var long=r[1].length>90||r[1].indexOf('\n')>=0;
      var v=/^https?:\/\//.test(r[1])?'<a href="'+esc(r[1])+'" target="_blank" rel="noopener">'+esc(r[1])+'</a>':(long?'<pre>'+esc(r[1])+'</pre>':esc(r[1]));
      return '<tr><td>'+esc(r[0])+'</td><td>'+v+'</td></tr>';
    }).join('');
    dr.innerHTML='<button class="close" id="cl">Close</button><div class="eyebrow" style="color:var(--sky)">'+esc(x.channel)+' &middot; '+esc(x.campaign)+'</div><h2>'+esc(x.name)+'</h2><div class="sub">'+esc(x.company)+' &middot; '+(x.replied?'Replied':'No reply yet')+'</div><h3>Call brief</h3><div class="brief">'+(x.brief?md(x.brief):'<p class="empty">No brief yet.</p>')+'</div><h3>Lead information</h3><table class="kv"><tbody>'+kv+'</tbody></table>';
    ov.classList.add('open');
    document.getElementById('cl').addEventListener('click',close);
  });
}
