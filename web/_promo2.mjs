import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
const SP=process.env.SP
const icon='data:image/png;base64,'+readFileSync(SP+'/icon.b64','utf8').trim()
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'})

const shots=[
 ['','포켓몬 챔피언스,','이기는 배틀의 <b>모든 도구</b>'],
 ['dex','포챔스 전용 포켓몬을','<b>한글 도감</b>으로 빠르게'],
 ['dex/charizardmegax','샘플·종족값·상성을','<b>한 화면</b>에서 확인'],
 ['dex/garchomp','전용 메가부터 일반까지','포챔스 포켓몬 <b>빠짐없이</b>'],
 ['stats','실시간 <b>사용률·티어</b>로','지금 메타를 한눈에'],
 ['dex/types','<b>타입 상성표</b>로','약점·강점 즉시 파악'],
 ['calculator','<b>SP·메가·날씨</b>까지','정밀 데미지 계산'],
]
const cap=await b.newPage({viewport:{width:430,height:940},deviceScaleFactor:2})
await cap.goto('http://localhost:4870/',{waitUntil:'domcontentloaded'})
await cap.evaluate(()=>localStorage.setItem('champsnote-auth',JSON.stringify({state:{user:{id:'u1',username:'ctkross',displayName:'CTkross',email:null,provider:'email',avatarUrl:null,createdAt:1700000000000,onboarded:true}},version:0})))

async function render(html,file){
 const p=await b.newPage({viewport:{width:1080,height:1920},deviceScaleFactor:2})
 await p.setContent(html,{waitUntil:'networkidle'});await p.waitForTimeout(500)
 await p.screenshot({path:`${SP}/${file}`,clip:{x:0,y:0,width:1080,height:1920}});await p.close()
 console.log('rendered',file)
}
let i=0
for(const [route,l1,l2] of shots){
 i++
 await cap.goto('http://localhost:4870/'+route,{waitUntil:'networkidle'});await cap.waitForTimeout(1100)
 const img='data:image/png;base64,'+(await cap.screenshot({type:'png'})).toString('base64')
 const html=`<!doctype html><html><head><meta charset="utf-8"><style>
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@700;800;900&display=swap');
  *{margin:0;box-sizing:border-box}body{width:1080px;height:1920px;font-family:'Noto Sans KR',sans-serif}
  .s{position:relative;width:1080px;height:1920px;background:#08090c;overflow:hidden;
    background-image:radial-gradient(60% 40% at 50% -6%,rgba(208,242,36,.22),transparent 60%),radial-gradient(55% 45% at 50% 108%,rgba(56,132,255,.16),transparent 60%)}
  b{color:#d0f224}
  </style></head><body><div class="s">
   <!-- faint logo watermark behind -->
   <img src="${icon}" style="position:absolute;left:50%;top:1030px;transform:translate(-50%,-50%);width:900px;opacity:.05;filter:grayscale(0)"/>
   <!-- glow ring behind phone -->
   <div style="position:absolute;left:50%;top:1070px;transform:translate(-50%,-50%);width:760px;height:760px;border-radius:50%;background:radial-gradient(circle,rgba(208,242,36,.20),rgba(208,242,36,.05) 45%,transparent 68%)"></div>
   <div style="position:absolute;top:120px;left:0;right:0;text-align:center;padding:0 70px">
     <img src="${icon}" width="70" style="border-radius:18px;margin-bottom:26px"/>
     <div style="font-size:62px;font-weight:900;line-height:1.24;letter-spacing:-2px;color:#fff">${l1}<br/>${l2}</div>
   </div>
   <div style="position:absolute;left:50%;top:560px;transform:translateX(-50%);width:660px;border-radius:52px;overflow:hidden;border:12px solid #14151a;box-shadow:0 50px 110px -24px rgba(0,0,0,.7),0 0 0 1px rgba(255,255,255,.06);background:#0b0c10">
     <img src="${img}" width="636" style="display:block;width:636px"/>
   </div>
  </div></body></html>`
 await render(html,`promo-${String(i).padStart(2,'0')}.png`)
}
await b.close()
