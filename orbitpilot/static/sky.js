(() => {
  const rad = Math.PI / 180;
  const deg = 180 / Math.PI;
  const wrap = (value, period) => ((value % period) + period) % period;

  const namedStars = [
    ['Polaris',2.5303,89.2641,1.98],['Dubhe',11.0621,61.7508,1.79],['Merak',11.0307,56.3824,2.37],
    ['Phecda',11.8972,53.6948,2.44],['Megrez',12.2570,57.0326,3.31],['Alioth',12.9005,55.9598,1.77],
    ['Mizar',13.3987,54.9254,2.23],['Alkaid',13.7923,49.3133,1.86],['Schedar',0.6751,56.5373,2.24],
    ['Caph',0.1529,59.1502,2.27],['Gamma Cas',0.9451,60.7167,2.47],['Ruchbah',1.4303,60.2353,2.68],
    ['Segin',1.9066,63.6701,3.37],['Mirach',1.1622,35.6206,2.05],['Almach',2.0650,42.3297,2.10],
    ['Hamal',2.1195,23.4624,2.00],['Alpheratz',0.1398,29.0904,2.06],['Capella',5.2782,45.9980,0.08],
    ['Aldebaran',4.5987,16.5093,0.85],['Rigel',5.2423,-8.2016,0.13],['Betelgeuse',5.9195,7.4071,0.42],
    ['Bellatrix',5.4189,6.3497,1.64],['Mintaka',5.5334,-0.2991,2.23],['Alnilam',5.6036,-1.2019,1.69],
    ['Alnitak',5.6793,-1.9426,1.77],['Saiph',5.7959,-9.6696,2.06],['Procyon',7.6550,5.2250,0.34],
    ['Sirius',6.7525,-16.7161,-1.46],['Pollux',7.7553,28.0262,1.14],['Castor',7.5767,31.8883,1.58],
    ['Regulus',10.1395,11.9672,1.35],['Spica',13.4199,-11.1614,0.97],['Arcturus',14.2610,19.1824,-0.05],
    ['Antares',16.4901,-26.4320,1.06],['Vega',18.6156,38.7837,0.03],['Deneb',20.6905,45.2803,1.25],
    ['Altair',19.8464,8.8683,0.77],['Fomalhaut',22.9608,-29.6222,1.16],['Markab',23.0793,15.2053,2.49],
    ['Algenib',0.2206,15.1836,2.83],['Menkalinan',6.3827,44.9474,1.90],['Elnath',5.4382,28.6075,1.65],
    ['Alcyone',3.7914,24.1051,2.87],['Mirfak',3.4054,49.8612,1.79],['Algol',3.1361,40.9556,2.12],
    ['Denebola',11.8177,14.5721,2.14],['Alphecca',15.5781,26.7147,2.23],['Rasalhague',17.5822,12.5600,2.08],
    ['Shaula',17.5601,-37.1038,1.63],['Nunki',18.9211,-26.2967,2.05],['Peacock',20.4275,-56.7351,1.94],
    ['Canopus',6.3992,-52.6957,-0.74],['Achernar',1.6286,-57.2368,0.46],['Alphard',9.4598,-8.6586,1.98],
    ['Mimosa',12.7954,-59.6888,1.25],['Gacrux',12.5194,-57.1132,1.63]
  ].map(([name, ra, dec, mag]) => ({name, ra, dec, mag, type:'Star', code:name}));
  let stars = namedStars;
  const catalog = {state:'loading', count:0, error:null};

  function loadCatalog(data) {
    if(!Array.isArray(data.stars))throw new Error('The offline star catalog has an invalid format.');
    const catalogStars=[];
    for(let index=0;index<data.stars.length;index++){
      const [ra,dec,mag,hip,properName]=data.stars[index];
      if(!Number.isFinite(ra)||!Number.isFinite(dec)||!Number.isFinite(mag))continue;
      const namedDuplicate=namedStars.some(star=>{
        const raDelta=((ra-star.ra+12)%24+24)%24-12;
        return Math.hypot(raDelta*15*Math.cos(dec*rad),dec-star.dec)<.04;
      });
      if(namedDuplicate)continue;
      const code=Number.isFinite(hip)&&hip>0?`HIP ${hip}`:`HYG ${index+1}`;
      catalogStars.push({name:properName||code,ra,dec,mag,type:'Star',code,catalogId:hip||null});
    }
    stars=[...namedStars,...catalogStars];
    catalog.state='ready';
    catalog.count=data.stars.length;
    catalog.error=null;
  }

  const constellationLines = [
    ['Polaris','Dubhe'],['Dubhe','Merak'],['Merak','Phecda'],['Phecda','Megrez'],['Megrez','Dubhe'],
    ['Megrez','Alioth'],['Alioth','Mizar'],['Mizar','Alkaid'],
    ['Caph','Schedar'],['Schedar','Gamma Cas'],['Gamma Cas','Ruchbah'],['Ruchbah','Segin'],
    ['Alpheratz','Mirach'],['Mirach','Almach'],['Capella','Menkalinan'],['Menkalinan','Elnath'],
    ['Aldebaran','Elnath'],['Mirfak','Algol'],['Algol','Almach'],
    ['Betelgeuse','Bellatrix'],['Bellatrix','Mintaka'],['Mintaka','Alnilam'],['Alnilam','Alnitak'],
    ['Betelgeuse','Alnitak'],['Alnitak','Saiph'],['Saiph','Rigel'],['Rigel','Mintaka'],
    ['Castor','Pollux'],['Regulus','Denebola'],['Arcturus','Spica'],['Vega','Deneb'],
    ['Altair','Vega'],['Altair','Deneb'],['Spica','Arcturus'],['Antares','Shaula'],['Shaula','Nunki']
  ];

  function precess(raHours, decDegrees, centuries) {
    const ra = raHours * 15 * rad, dec = decDegrees * rad;
    const t = centuries;
    const zeta = (2306.2181*t + 0.30188*t*t + 0.017998*t*t*t) / 3600 * rad;
    const z = (2306.2181*t + 1.09468*t*t + 0.018203*t*t*t) / 3600 * rad;
    const theta = (2004.3109*t - 0.42665*t*t - 0.041833*t*t*t) / 3600 * rad;
    const a = Math.cos(dec) * Math.sin(ra + zeta);
    const b = Math.cos(theta) * Math.cos(dec) * Math.cos(ra + zeta) - Math.sin(theta) * Math.sin(dec);
    const c = Math.sin(theta) * Math.cos(dec) * Math.cos(ra + zeta) + Math.cos(theta) * Math.sin(dec);
    return {ra:wrap((Math.atan2(a,b)+z)*deg,360), dec:Math.asin(Math.max(-1,Math.min(1,c)))*deg};
  }

  function horizontal(raDegrees, decDegrees, latitude, longitude, jd) {
    const t = (jd - 2451545) / 36525;
    const sidereal = wrap(280.46061837 + 360.98564736629*(jd-2451545) + 0.000387933*t*t - t*t*t/38710000 + longitude, 360);
    const hourAngle = wrap(sidereal - raDegrees + 180, 360) - 180;
    const ha = hourAngle*rad, dec = decDegrees*rad, lat=latitude*rad;
    const sinAlt=Math.sin(dec)*Math.sin(lat)+Math.cos(dec)*Math.cos(lat)*Math.cos(ha);
    const alt=Math.asin(Math.max(-1,Math.min(1,sinAlt)));
    const az=Math.atan2(-Math.sin(ha)*Math.cos(dec),Math.sin(dec)*Math.cos(lat)-Math.cos(dec)*Math.sin(lat)*Math.cos(ha));
    return {alt:alt*deg,az:wrap(az*deg,360)};
  }

  function orbit(elements, d) {
    const [n0, nd, i0, id, w0, wd, a0, ad, e0, ed, m0, md] = elements;
    const n=(n0+nd*d)*rad, inclination=(i0+id*d)*rad, peri=(w0+wd*d)*rad;
    const a=a0+ad*d, e=e0+ed*d, mean=wrap(m0+md*d,360)*rad;
    let eccentric=mean;
    for(let i=0;i<8;i++) eccentric -= (eccentric-e*Math.sin(eccentric)-mean)/(1-e*Math.cos(eccentric));
    const xv=a*(Math.cos(eccentric)-e), yv=a*Math.sqrt(1-e*e)*Math.sin(eccentric);
    const v=Math.atan2(yv,xv), r=Math.hypot(xv,yv), u=v+peri;
    return {x:r*(Math.cos(n)*Math.cos(u)-Math.sin(n)*Math.sin(u)*Math.cos(inclination)),
      y:r*(Math.sin(n)*Math.cos(u)+Math.cos(n)*Math.sin(u)*Math.cos(inclination)),
      z:r*Math.sin(u)*Math.sin(inclination)};
  }

  const orbitalElements = {
    Mercury:[48.3313,3.24587e-5,7.0047,5e-8,29.1241,1.01444e-5,.387098,0,.205635,5.59e-10,168.6562,4.0923344368],
    Venus:[76.6799,2.4659e-5,3.3946,2.75e-8,54.8910,1.38374e-5,.723330,0,.006773,-1.302e-9,48.0052,1.6021302244],
    Mars:[49.5574,2.11081e-5,1.8497,-1.78e-8,286.5016,2.92961e-5,1.523688,0,.093405,2.516e-9,18.6021,.5240207766],
    Jupiter:[100.4542,2.76854e-5,1.3030,-1.557e-7,273.8777,1.64505e-5,5.20256,0,.048498,4.469e-9,19.8950,.0830853001],
    Saturn:[113.6634,2.3898e-5,2.4886,-1.081e-7,339.3939,2.97661e-5,9.55475,0,.055546,-9.499e-9,316.9670,.0334442282]
  };

  function eclipticToEquatorial(x,y,z,jd) {
    const t=(jd-2451545)/36525;
    const obliquity=(23.439291-0.0130042*t)*rad;
    const ye=y*Math.cos(obliquity)-z*Math.sin(obliquity);
    const ze=y*Math.sin(obliquity)+z*Math.cos(obliquity);
    return {ra:wrap(Math.atan2(ye,x)*deg,360),dec:Math.atan2(ze,Math.hypot(x,ye))*deg};
  }

  function celestialObjects(jd) {
    const d=jd-2451543.5;
    const earth=orbit([0,0,0,0,282.9404,4.70935e-5,1,0,.016709,-1.151e-9,356.047,.9856002585],d);
    const result=[];
    for(const [name,elements] of Object.entries(orbitalElements)){
      const p=orbit(elements,d), eq=eclipticToEquatorial(p.x-earth.x,p.y-earth.y,p.z-earth.z,jd);
      result.push({name,code:name,type:'Planet',ra:eq.ra,dec:eq.dec,mag:2.5});
    }
    const sunEq=eclipticToEquatorial(-earth.x,-earth.y,-earth.z,jd);
    result.push({name:'Sun',code:'Sun',type:'Sun',ra:sunEq.ra,dec:sunEq.dec,mag:-26});

    const moon=orbit([125.1228,-.0529538083,5.1454,0,318.0634,.1643573223,60.2666,0,.0549,0,115.3654,13.0649929509],d);
    const moonEq=eclipticToEquatorial(moon.x,moon.y,moon.z,jd);
    result.push({name:'Moon',code:'Moon',type:'Moon',ra:moonEq.ra,dec:moonEq.dec,mag:-12});
    return result;
  }

  function formatRa(degrees) {
    const h=wrap(degrees/15,24), hours=Math.floor(h), minutes=Math.floor((h-hours)*60), seconds=Math.round((((h-hours)*60)-minutes)*60);
    return `${String(hours).padStart(2,'0')}h ${String(minutes).padStart(2,'0')}m ${String(seconds).padStart(2,'0')}s`;
  }

  function polarGuide(latitude, longitude, date) {
    const jd=date.getTime()/86400000+2440587.5;
    const centuries=(jd-2451545)/36525;
    const north=latitude>0;
    const polarisEq=precess(2.5303,89.2641,centuries);
    const polaris=horizontal(polarisEq.ra,polarisEq.dec,latitude,longitude,jd);
    return {
      hemisphere:north?'north':latitude<0?'south':'equator',
      direction:north?'True north':latitude<0?'True south':'North or south (at the horizon)',
      altitude:Math.abs(latitude),
      polaris:north?polaris:null
    };
  }

  function render(canvas, targets, latitude, longitude, date, onSelect) {
    const rect=canvas.getBoundingClientRect();
    if(!rect.width||!rect.height)return;
    const dpr=window.devicePixelRatio||1;
    canvas.width=Math.round(rect.width*dpr);canvas.height=Math.round(rect.height*dpr);
    const ctx=canvas.getContext('2d');ctx.setTransform(dpr,0,0,dpr,0,0);
    const w=rect.width,h=rect.height,cx=w/2,cy=h/2+8,r=Math.min(w*.45,(h-40)*.45);
    const jd=date.getTime()/86400000+2440587.5, centuries=(jd-2451545)/36525;
    const bg=ctx.createRadialGradient(cx,cy,0,cx,cy,r);
    bg.addColorStop(0,'#102640');bg.addColorStop(.72,'#091625');bg.addColorStop(1,'#050a12');
    ctx.clearRect(0,0,w,h);ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
    ctx.save();ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.clip();
    const horizonPoint=(az,alt)=>{const a=alt*rad,azr=az*rad;const rho=r*Math.tan((Math.PI/2-a)/2);return{x:cx+rho*Math.sin(azr),y:cy-rho*Math.cos(azr)}};
    ctx.strokeStyle='#39546b';ctx.lineWidth=1;
    for(const altitude of [0,30,60]){
      const rr=r*Math.tan((90-altitude)*rad/2);
      ctx.beginPath();ctx.arc(cx,cy,rr,0,Math.PI*2);ctx.stroke();
      ctx.fillStyle='#6e8aa3';ctx.font='9px monospace';ctx.fillText(`${altitude}°`,cx+5,cy-rr+12);
    }
    for(let az=0;az<360;az+=30){
      const p=horizonPoint(az,0);ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(p.x,p.y);ctx.strokeStyle='#243a51';ctx.stroke();
    }
    ctx.strokeStyle='#6e8aa3';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.stroke();
    ctx.restore();

    const directions=[[0,'N'],[90,'E'],[180,'S'],[270,'W']];
    ctx.fillStyle='#a8bfd4';ctx.font='600 11px monospace';
    for(const [az,label] of directions){const p=horizonPoint(az,0);ctx.fillText(label,p.x-4,p.y+(az===0?15:az===180?-5:4))}

    const objects=[];
    const starPoints=new Map();
    for(const star of stars){
      const eq=precess(star.ra,star.dec,centuries), hor=horizontal(eq.ra,eq.dec,latitude,longitude,jd);
      if(hor.alt<=0)continue;
      const p=horizonPoint(hor.az,hor.alt), radius=Math.max(.8,2.6-(star.mag+1.5)*.38);
      starPoints.set(star.name,p);
      objects.push({...star,ra:eq.ra,dec:eq.dec,...hor,...p,radius});
    }
    ctx.strokeStyle='#617e9a66';ctx.lineWidth=1;
    for(const [a,b] of constellationLines){const p=starPoints.get(a),q=starPoints.get(b);if(p&&q){ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.stroke()}}
    for(const star of objects){
      ctx.beginPath();ctx.arc(star.x,star.y,star.radius,0,Math.PI*2);
      ctx.fillStyle=star.mag<1?'#e7f6ff':'#a9c8e8';ctx.shadowColor='#9edaff';ctx.shadowBlur=star.mag<1?8:0;ctx.fill();ctx.shadowBlur=0;
      if(star.mag<1.6&&(star.catalogId||star.code===star.name)){ctx.fillStyle='#b7cce1';ctx.font='9px monospace';ctx.fillText(star.name,star.x+5,star.y-4)}
    }

    for(const target of targets){
      const eq=precess(target.raH,target.decD,centuries),hor=horizontal(eq.ra,eq.dec,latitude,longitude,jd);
      if(hor.alt<=0)continue;
      const p=horizonPoint(hor.az,hor.alt),obj={name:target.name,code:target.id,type:'Deep-sky',ra:eq.ra,dec:eq.dec,...hor,...p,radius:5,target};
      objects.push(obj);ctx.beginPath();ctx.arc(obj.x,obj.y,5,0,Math.PI*2);ctx.fillStyle='#b8a5ff';ctx.shadowColor='#b8a5ff';ctx.shadowBlur=9;ctx.fill();ctx.shadowBlur=0;
      ctx.strokeStyle='#d5ccff';ctx.stroke();ctx.fillStyle='#e2dcff';ctx.font='9px monospace';ctx.fillText(target.id,obj.x+7,obj.y-6);
    }

    for(const body of celestialObjects(jd)){
      const hor=horizontal(body.ra,body.dec,latitude,longitude,jd);
      if(hor.alt<=0)continue;
      const p=horizonPoint(hor.az,hor.alt),radius=body.type==='Sun'?7:body.type==='Moon'?6:4.5;
      const obj={...body,...hor,...p,radius};
      objects.push(obj);ctx.beginPath();ctx.arc(obj.x,obj.y,radius,0,Math.PI*2);
      ctx.fillStyle=body.type==='Sun'?'#ffd477':body.type==='Moon'?'#eaf3ff':'#69dfd5';ctx.shadowColor=ctx.fillStyle;ctx.shadowBlur=12;ctx.fill();ctx.shadowBlur=0;
      ctx.fillStyle='#e4f4ff';ctx.font='10px monospace';ctx.fillText(body.name,obj.x+8,obj.y+3);
    }
    canvas.onclick=(event)=>{
      const box=canvas.getBoundingClientRect(),x=event.clientX-box.left,y=event.clientY-box.top;
      let nearest=null,distance=18;
      for(const object of objects){const d=Math.hypot(object.x-x,object.y-y);if(d<distance){nearest=object;distance=d}}
      if(nearest)onSelect({...nearest,raH:nearest.ra/15,decD:nearest.dec,visible:true});
    };
    return {jd,objects};
  }

  window.OrbitSky={render,formatRa,polarGuide,catalogStatus:()=>({...catalog})};
  fetch('/static/star-catalog.json')
    .then(response=>{if(!response.ok)throw new Error(`Catalog request failed (${response.status}).`);return response.json()})
    .then(data=>{loadCatalog(data);window.dispatchEvent(new CustomEvent('orbit-sky-catalog-ready',{detail:{...catalog}}))})
    .catch(error=>{catalog.state='error';catalog.error=error.message;window.dispatchEvent(new CustomEvent('orbit-sky-catalog-ready',{detail:{...catalog}}))});
})();
