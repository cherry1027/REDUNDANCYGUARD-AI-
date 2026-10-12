import { useMemo, useState } from 'react'
import {
  Activity, AlertTriangle, BarChart3, Binary, CheckCircle2, ChevronRight, CircleGauge,
  Cpu, Download, FlaskConical, Gauge, GitBranch, Network, Play, RotateCcw, Router,
  ShieldCheck, Siren, SlidersHorizontal, Timer, Waves, Zap
} from 'lucide-react'
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, LineChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis
} from 'recharts'

type Mode = 'RNRP' | 'PRP'
type Fault = 'baseline' | 'bandwidth' | 'cpu' | 'loss' | 'latency'
type Metric = { headroom:number; latency:number; jitter:number; loss:number; cpu:number; errors:number }

const clamp=(n:number,min=0,max=100)=>Math.min(max,Math.max(min,n))
const faults: Record<Fault,{label:string;desc:string;color:string}> = {
  baseline:{label:'Nominal baseline',desc:'Healthy deterministic plant traffic',color:'#34d399'},
  bandwidth:{label:'Bandwidth degradation',desc:'Standby path capacity reduced by 46%',color:'#f59e0b'},
  cpu:{label:'CPU overload',desc:'Routing workload raised to saturation',color:'#fb7185'},
  loss:{label:'Packet loss burst',desc:'Synthetic 2.8% loss on backup path',color:'#f97316'},
  latency:{label:'Unstable latency',desc:'Oscillating queue delay and jitter',color:'#c084fc'}
}

function metricFor(fault:Fault, t=31):Metric {
  const wave=Math.sin(t*.58), drift=Math.cos(t*.21)
  const m:Metric={headroom:37+wave*2,latency:12+drift*1.4,jitter:2.2+wave*.4,loss:.06+Math.abs(drift)*.03,cpu:42+wave*4,errors:2+Math.round(Math.abs(wave)*2)}
  if(fault==='bandwidth'){m.headroom=8+wave*2;m.latency+=15;m.jitter+=4.5;m.loss+=.35}
  if(fault==='cpu'){m.cpu=91+wave*4;m.latency+=20;m.jitter+=7;m.errors+=9}
  if(fault==='loss'){m.loss=2.65+Math.abs(wave)*.45;m.jitter+=3.4;m.errors+=18}
  if(fault==='latency'){m.latency=48+wave*21;m.jitter=16+Math.abs(drift)*10;m.loss+=.18}
  return m
}

function componentScores(m:Metric){
  return {
    headroom:clamp(m.headroom/35*100), latency:clamp(100-(m.latency-8)*1.6),
    jitter:clamp(100-(m.jitter-1)*6.5), loss:clamp(100-m.loss*26),
    cpu:clamp(100-(m.cpu-35)*1.5), errors:clamp(100-m.errors*2.7)
  }
}

function weightedScore(m:Metric, mode:Mode){
  const s=componentScores(m)
  const base=s.headroom*.30+s.latency*.18+s.jitter*.12+s.loss*.18+s.cpu*.14+s.errors*.08
  return Math.round(clamp(mode==='PRP' ? base*.92+8 : base))
}

function statusFor(score:number){ return score>=85?'Ready':score>=70?'Watch':score>=50?'Degraded':'Critical' }
function colorFor(score:number){ return score>=85?'#34d399':score>=70?'#22d3ee':score>=50?'#f59e0b':'#fb7185' }

const tooltipStyle={background:'#081525',border:'1px solid #1d3a4f',borderRadius:10,fontSize:12,color:'#dce9f5'}

function Ring({score,size=92}:{score:number;size?:number}){
  const r=36,c=2*Math.PI*r, dash=c*score/100
  return <div className="relative grid place-items-center" style={{width:size,height:size}}>
    <svg viewBox="0 0 88 88" className="absolute inset-0 -rotate-90"><circle cx="44" cy="44" r={r} fill="none" stroke="#152b3b" strokeWidth="7"/><circle cx="44" cy="44" r={r} fill="none" stroke={colorFor(score)} strokeWidth="7" strokeLinecap="round" strokeDasharray={`${dash} ${c-dash}`} /></svg>
    <div className="text-center"><div className="text-2xl font-semibold text-white">{score}</div><div className="text-[9px] uppercase tracking-widest text-slate-500">score</div></div>
  </div>
}

function MetricCard({icon:Icon,label,value,unit,healthy}:any){
  return <div className="rounded-xl border border-slate-800 bg-[#091525]/80 p-3">
    <div className="flex items-center justify-between text-[10px] uppercase tracking-[.14em] text-slate-500"><span>{label}</span><Icon size={14} className={healthy?'text-emerald-400':'text-amber-400'}/></div>
    <div className="mt-2 flex items-end gap-1"><span className="text-xl font-medium text-slate-100">{typeof value==='number' ? (value<10?value.toFixed(2):value.toFixed(0)):value}</span><span className="mb-0.5 text-[10px] text-slate-500">{unit}</span></div>
  </div>
}

function Topology({mode,score,failed}:{mode:Mode;score:number;failed:boolean}){
  const active=failed?'#fb7185':'#22d3ee', backup=colorFor(score)
  return <div className="relative h-[310px] overflow-hidden rounded-xl border border-cyan-950/70 bg-[#07111f] grid-bg scanline">
    <div className="absolute left-4 top-4 flex gap-2 text-[10px] uppercase tracking-widest text-slate-500"><span className="rounded-full bg-cyan-400/10 px-2 py-1 text-cyan-300">Live topology</span><span className="px-2 py-1">{mode==='RNRP'?'Active / standby':'Parallel duplicate paths'}</span></div>
    <svg className="absolute inset-0 h-full w-full" viewBox="0 0 760 310" preserveAspectRatio="none">
      <path d="M105 155 C180 155 198 92 275 92 S 392 92 452 92" fill="none" stroke={active} strokeWidth="3" className="topo-line" opacity={failed?.25:1}/>
      <path d="M105 155 C180 155 198 222 275 222 S 392 222 452 222" fill="none" stroke={backup} strokeWidth={mode==='PRP'||failed?3:2} className="topo-line reverse" opacity={mode==='PRP'||failed?1:.35}/>
      <path d="M545 92 C620 92 630 155 690 155" fill="none" stroke={active} strokeWidth="3" className="topo-line" opacity={failed?.25:1}/>
      <path d="M545 222 C620 222 630 155 690 155" fill="none" stroke={backup} strokeWidth={mode==='PRP'||failed?3:2} className="topo-line reverse" opacity={mode==='PRP'||failed?1:.35}/>
    </svg>
    <Node x="7%" y="50%" icon={Cpu} title="AC 800M" meta="Controller" color="#60a5fa"/>
    <Node x="35%" y="29%" icon={Network} title="SW-01" meta="Primary fabric" color={active}/>
    <Node x="35%" y="71%" icon={Network} title="SW-02" meta="Redundant fabric" color={backup}/>
    <Node x="65%" y="29%" icon={Router} title="RTR-A" meta={failed?'FAILURE INJECTED':'Primary · active'} color={active}/>
    <Node x="65%" y="71%" icon={Router} title="RTR-B" meta={`${statusFor(score)} · ${score}/100`} color={backup} pulse/>
    <Node x="91%" y="50%" icon={Binary} title="800xA" meta="Control network" color="#a78bfa"/>
    <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between rounded-lg border border-slate-800 bg-[#07111f]/90 px-3 py-2 text-[10px] text-slate-500">
      <span><b className="text-cyan-300">Solid animation</b> = carrying production payload</span><span>Simulation · 1 Gbps links · 620 Mbps required</span>
    </div>
  </div>
}

function Node({x,y,icon:Icon,title,meta,color,pulse=false}:any){
  return <div className="absolute -translate-x-1/2 -translate-y-1/2 text-center" style={{left:x,top:y}}>
    <div className="relative mx-auto grid h-12 w-12 place-items-center rounded-xl border bg-[#0b1d30] shadow-xl" style={{borderColor:`${color}99`,boxShadow:`0 0 24px ${color}22`}}>{pulse&&<div className="pulse-ring absolute inset-0 rounded-xl border" style={{borderColor:color}}/>}<Icon size={21} style={{color}}/></div>
    <div className="mt-2 text-xs font-semibold text-slate-200">{title}</div><div className="mt-0.5 whitespace-nowrap text-[9px] text-slate-500">{meta}</div>
  </div>
}

function MonitorPage(){
  const [mode,setMode]=useState<Mode>('RNRP'),[fault,setFault]=useState<Fault>('baseline'),[failed,setFailed]=useState(false)
  const metric=useMemo(()=>metricFor(fault),[fault]); const score=weightedScore(metric,mode)
  const primaryScore=failed?18:94; const required=620; const capacity=Math.round(1000*(metric.headroom/100+required/1000)); const supported=Math.min(capacity,1000)
  const failoverPass=supported>=required && score>=55
  const trend=useMemo(()=>Array.from({length:32},(_,i)=>{const m=metricFor(fault,i);return {t:`${i-31}m`,readiness:weightedScore(m,mode),latency:+m.latency.toFixed(1),loss:+m.loss.toFixed(2)}}),[fault,mode])
  const comps=componentScores(metric)
  const factors=[['Capacity headroom',Math.round(comps.headroom)],['Latency stability',Math.round(comps.latency)],['Packet integrity',Math.round(comps.loss)],['Router compute',Math.round(comps.cpu)]]
  return <div className="space-y-4">
    <section className="flex flex-wrap items-end justify-between gap-4"><div><div className="mb-2 flex items-center gap-2 text-[10px] uppercase tracking-[.2em] text-cyan-400"><Activity size={13}/> Live deterministic simulation</div><h1 className="text-2xl font-semibold text-white md:text-3xl">Industrial Network Monitor</h1><p className="mt-1 text-sm text-slate-500">Router redundancy readiness for a synthetic System 800xA-style topology.</p></div>
      <div className="flex rounded-xl border border-slate-800 bg-[#081422] p-1">{(['RNRP','PRP'] as Mode[]).map(m=><button key={m} onClick={()=>{setMode(m);setFailed(false)}} className={`rounded-lg px-5 py-2 text-xs font-semibold transition ${mode===m?'bg-cyan-400 text-[#041019]':'text-slate-500 hover:text-white'}`}>{m}</button>)}</div>
    </section>
    <div className="grid gap-4 xl:grid-cols-[1.55fr_.8fr]">
      <div className="panel rounded-2xl p-4"><Topology mode={mode} score={score} failed={failed}/></div>
      <div className="panel rounded-2xl p-4">
        <div className="flex items-start justify-between"><div><div className="text-[10px] uppercase tracking-[.18em] text-slate-500">Redundant router readiness</div><div className="mt-1 text-sm font-medium" style={{color:colorFor(score)}}>{statusFor(score)}</div></div><Ring score={score}/></div>
        <div className="mt-3 space-y-3">{factors.map(([name,v])=><div key={name as string}><div className="mb-1 flex justify-between text-[11px]"><span className="text-slate-400">{name}</span><span className="font-mono text-slate-300">{v}%</span></div><div className="h-1.5 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full transition-all" style={{width:`${v}%`,background:colorFor(v as number)}}/></div></div>)}</div>
        <div className={`mt-5 rounded-xl border p-3 ${score<70?'border-amber-500/30 bg-amber-500/5':'border-emerald-500/20 bg-emerald-500/5'}`}><div className="flex gap-2"><AlertTriangle size={16} className={score<70?'text-amber-400':'text-emerald-400'}/><div><div className="text-xs font-semibold text-slate-200">{score<70?'Readiness intervention required':'Redundant path available'}</div><p className="mt-1 text-[10px] leading-4 text-slate-500">{score<70?`${faults[fault].label} is reducing ${mode} failover confidence.`:`All weighted factors remain inside the synthetic readiness envelope.`}</p></div></div></div>
      </div>
    </div>
    <div className="grid gap-4 xl:grid-cols-[1.2fr_.8fr]">
      <div className="panel rounded-2xl p-4"><div className="mb-3 flex items-center justify-between"><div><h2 className="text-sm font-semibold text-white">Telemetry & readiness trend</h2><p className="text-[10px] text-slate-500">32-minute deterministic trace · sampled every minute</p></div><span className="text-[10px] text-slate-500">Score threshold <b className="text-cyan-300">70</b></span></div>
        <div className="grid grid-cols-3 gap-2 md:grid-cols-6"><MetricCard icon={Gauge} label="Headroom" value={metric.headroom} unit="%" healthy={metric.headroom>20}/><MetricCard icon={Timer} label="Latency" value={metric.latency} unit="ms" healthy={metric.latency<35}/><MetricCard icon={Waves} label="Jitter" value={metric.jitter} unit="ms" healthy={metric.jitter<8}/><MetricCard icon={Activity} label="Loss" value={metric.loss} unit="%" healthy={metric.loss<1}/><MetricCard icon={Cpu} label="CPU" value={metric.cpu} unit="%" healthy={metric.cpu<80}/><MetricCard icon={Siren} label="IF errors" value={metric.errors} unit="/min" healthy={metric.errors<8}/></div>
        <div className="mt-4 h-52"><ResponsiveContainer><AreaChart data={trend}><defs><linearGradient id="score" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#22d3ee" stopOpacity=".3"/><stop offset="1" stopColor="#22d3ee" stopOpacity="0"/></linearGradient></defs><CartesianGrid stroke="#14283a" vertical={false}/><XAxis dataKey="t" tick={{fill:'#52677a',fontSize:9}} axisLine={false} tickLine={false} interval={5}/><YAxis domain={[0,100]} tick={{fill:'#52677a',fontSize:9}} axisLine={false} tickLine={false}/><Tooltip contentStyle={tooltipStyle}/><Area type="monotone" dataKey="readiness" stroke="#22d3ee" fill="url(#score)" strokeWidth={2}/><Line type="monotone" dataKey="latency" stroke="#a78bfa" dot={false} strokeWidth={1.4}/></AreaChart></ResponsiveContainer></div>
      </div>
      <div className="space-y-4"><div className="panel rounded-2xl p-4"><div className="flex items-center gap-2"><Zap size={15} className="text-amber-400"/><h2 className="text-sm font-semibold text-white">Fault injection</h2></div><div className="mt-3 grid grid-cols-2 gap-2">{(Object.keys(faults) as Fault[]).map(f=><button key={f} onClick={()=>{setFault(f);setFailed(false)}} className={`rounded-xl border p-3 text-left transition ${fault===f?'border-cyan-400/60 bg-cyan-400/10':'border-slate-800 bg-[#081422] hover:border-slate-700'}`}><div className="text-[11px] font-medium text-slate-200">{faults[f].label}</div><div className="mt-1 text-[9px] leading-3 text-slate-500">{faults[f].desc}</div></button>)}</div></div>
        <div className="panel rounded-2xl p-4"><div className="flex items-center justify-between"><div><h2 className="text-sm font-semibold text-white">Failover simulation</h2><p className="mt-1 text-[10px] text-slate-500">Required payload: {required} Mbps</p></div><button onClick={()=>setFailed(!failed)} className="flex items-center gap-2 rounded-lg bg-rose-500 px-3 py-2 text-[10px] font-semibold text-white"><Play size={12}/>{failed?'Reset primary':'Fail primary'}</button></div>{failed&&<div className={`mt-3 rounded-xl border p-3 ${failoverPass?'border-emerald-500/30 bg-emerald-500/5':'border-rose-500/30 bg-rose-500/5'}`}><div className="flex items-center gap-2 text-xs font-semibold">{failoverPass?<CheckCircle2 className="text-emerald-400" size={16}/>:<AlertTriangle className="text-rose-400" size={16}/>}<span>{failoverPass?'Failover supported':'Capacity shortfall predicted'}</span></div><div className="mt-2 flex justify-between text-[10px] text-slate-500"><span>Usable standby capacity</span><b className="text-slate-200">{supported} Mbps</b></div></div>}</div>
      </div>
    </div>
    <div className="rounded-xl border border-slate-800 bg-[#07111f] px-4 py-3 text-[10px] leading-4 text-slate-500"><b className="text-slate-300">Model assumption:</b> {mode==='RNRP'?'RNRP carries production traffic on one active path while the standby exchanges only supervision traffic until failover.':'PRP duplicates each production frame across both LANs; the receiver accepts the first arrival, so both paths carry the full required payload.'} Readiness = 30% headroom + 18% latency + 12% jitter + 18% packet integrity + 14% CPU + 8% interface health.</div>
  </div>
}

type LabScenario='Gradual congestion'|'Intermittent loss'|'CPU saturation'|'Latency oscillation'
const scenarioColor:Record<LabScenario,string>={'Gradual congestion':'#22d3ee','Intermittent loss':'#f59e0b','CPU saturation':'#fb7185','Latency oscillation':'#a78bfa'}

function severityAt(name:LabScenario,t:number){
  if(t<38) return .06+Math.max(0,Math.sin(t*.23))*.04
  const x=(t-38)/142
  if(name==='Gradual congestion') return clamp(.12+x*.95,0,1)
  if(name==='Intermittent loss') return clamp(.15+(Math.sin(t*.31)>.35?.75:.08),0,1)
  if(name==='CPU saturation') return t<76?.18:clamp(.82+Math.sin(t*.12)*.1,0,1)
  return clamp(.35+Math.abs(Math.sin(t*.14))*.62,0,1)
}

function evaluate(name:LabScenario,interval:number,size:number,method:'Weighted'|'Threshold'){
  const samples=[] as any[]; let tp=0,fp=0,fn=0,first:number|undefined
  for(let t=0;t<=180;t+=interval){const truth=severityAt(name,t); const noise=Math.sin(t*.73+size*.01)*(.11*clamp(96/size,.2,1)); const observed=clamp(truth+noise,0,1); const readiness=Math.round(100-observed*78); const alert=method==='Weighted'?readiness<70:(observed>.48); const active=truth>.42; if(alert&&active){tp++;if(first===undefined)first=t}else if(alert&&!active)fp++;else if(!alert&&active)fn++; samples.push({t,truth:Math.round((1-truth)*100),readiness,alert})}
  const start=Array.from({length:181},(_,t)=>t).find(t=>severityAt(name,t)>.42)??38
  const delay=first===undefined?180-start:Math.max(0,first-start); const overhead=((size+42)*8*2/interval)/1000
  return {samples,tp,fp,fn,delay,overhead,response:+(delay+interval*.35).toFixed(1),accuracy:Math.round(tp/Math.max(1,tp+fn)*100)}
}

function LabPage(){
  const [scenario,setScenario]=useState<LabScenario>('Gradual congestion'),[interval,setInterval]=useState(5),[size,setSize]=useState(128),[method,setMethod]=useState<'Weighted'|'Threshold'>('Weighted'),[mode,setMode]=useState<Mode>('RNRP')
  const weighted=useMemo(()=>evaluate(scenario,interval,size,'Weighted'),[scenario,interval,size]); const threshold=useMemo(()=>evaluate(scenario,interval,size,'Threshold'),[scenario,interval,size]); const active=method==='Weighted'?weighted:threshold
  const comparison=(Object.keys(scenarioColor) as LabScenario[]).map(s=>{const a=evaluate(s,interval,size,method);return {name:s.replace('Gradual ','Grad. ').replace('Intermittent ','Interm. ').replace('saturation','sat.'),delay:a.delay,accuracy:a.accuracy,overhead:+a.overhead.toFixed(2)}})
  const exportReport=()=>{const text=`# RedundancyGuard AI — Synthetic Evaluation Report\n\nGenerated: ${new Date().toISOString()}\n\n## Assumptions\n- Redundancy model: ${mode}\n- Scenario: ${scenario}\n- Probe interval: ${interval} seconds\n- Probe payload: ${size} bytes (+42 B frame/protocol overhead)\n- Scoring: ${method}\n- Ground truth active when deterministic severity > 0.42\n\n## Calculated results\n- Monitoring overhead: ${active.overhead.toFixed(3)} kbps${mode==='PRP'?' per LAN':''}\n- Detection delay: ${active.delay} seconds\n- Detection sensitivity: ${active.accuracy}%\n- False-positive samples: ${active.fp}\n- False-negative samples: ${active.fn}\n- Alert response time: ${active.response} seconds\n\n## Formula\nProbe overhead = (payload + 42 bytes) × 8 × request/reply ÷ interval. Weighted readiness = 100 − observed severity × 78; alert below 70. Threshold alert when observed severity > 0.48.\n`;
    const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type:'text/markdown'}));a.download='redundancyguard-evaluation.md';a.click();URL.revokeObjectURL(a.href)}
  return <div className="space-y-4"><section className="flex flex-wrap items-end justify-between gap-4"><div><div className="mb-2 flex items-center gap-2 text-[10px] uppercase tracking-[.2em] text-violet-400"><FlaskConical size={13}/> Synthetic experiment bench</div><h1 className="text-2xl font-semibold text-white md:text-3xl">Fault Injection & Readiness Evaluation</h1><p className="mt-1 text-sm text-slate-500">Tune monitoring cost, evaluate detection quality, and export reproducible results.</p></div><button onClick={exportReport} className="flex items-center gap-2 rounded-xl bg-cyan-400 px-4 py-2.5 text-xs font-semibold text-[#041019]"><Download size={14}/>Export research report</button></section>
    <div className="grid gap-4 xl:grid-cols-[.72fr_1.4fr]">
      <div className="panel rounded-2xl p-4"><div className="flex items-center gap-2"><SlidersHorizontal size={15} className="text-cyan-400"/><h2 className="text-sm font-semibold text-white">Experiment controls</h2></div>
        <label className="mt-5 block text-[10px] uppercase tracking-widest text-slate-500">Fault profile</label><select value={scenario} onChange={e=>setScenario(e.target.value as LabScenario)} className="mt-2 w-full rounded-xl border border-slate-800 bg-[#07111f] px-3 py-3 text-xs text-slate-200 outline-none">{Object.keys(scenarioColor).map(s=><option key={s}>{s}</option>)}</select>
        <div className="mt-5"><div className="flex justify-between text-xs"><span className="text-slate-400">Probe interval</span><b className="text-cyan-300">{interval}s</b></div><input className="mt-3 w-full" type="range" min="1" max="20" step="1" value={interval} onChange={e=>setInterval(+e.target.value)}/><div className="mt-1 flex justify-between text-[9px] text-slate-600"><span>High sensitivity</span><span>Low overhead</span></div></div>
        <div className="mt-5"><div className="flex justify-between text-xs"><span className="text-slate-400">Probe traffic size</span><b className="text-cyan-300">{size} B</b></div><input className="mt-3 w-full" type="range" min="64" max="512" step="32" value={size} onChange={e=>setSize(+e.target.value)}/></div>
        <div className="mt-5 grid grid-cols-2 gap-2">{(['RNRP','PRP'] as Mode[]).map(m=><button key={m} onClick={()=>setMode(m)} className={`rounded-lg border py-2 text-[10px] font-semibold ${mode===m?'border-cyan-400 bg-cyan-400/10 text-cyan-300':'border-slate-800 text-slate-500'}`}>{m}</button>)}</div>
        <label className="mt-5 block text-[10px] uppercase tracking-widest text-slate-500">Decision model</label><div className="mt-2 grid grid-cols-2 gap-2">{(['Weighted','Threshold'] as const).map(m=><button key={m} onClick={()=>setMethod(m)} className={`rounded-lg border py-2 text-[10px] font-semibold ${method===m?'border-violet-400 bg-violet-400/10 text-violet-300':'border-slate-800 text-slate-500'}`}>{m}</button>)}</div>
        <div className="mt-5 rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4"><div className="text-[10px] uppercase tracking-widest text-cyan-400">Calculated monitor load</div><div className="mt-2 text-3xl font-semibold text-white">{(active.overhead*(mode==='PRP'?2:1)).toFixed(2)}<span className="ml-1 text-xs font-normal text-slate-500">kbps</span></div><p className="mt-2 text-[10px] leading-4 text-slate-500">Includes {size} B payload + 42 B protocol/frame allowance, request and reply{mode==='PRP'?', across two parallel LANs':''}.</p></div>
      </div>
      <div className="space-y-4"><div className="grid grid-cols-2 gap-3 md:grid-cols-5"><Kpi icon={Timer} label="Detection delay" value={`${active.delay}s`} good={active.delay<=interval*2}/><Kpi icon={ShieldCheck} label="Sensitivity" value={`${active.accuracy}%`} good={active.accuracy>=85}/><Kpi icon={AlertTriangle} label="False positive" value={String(active.fp)} good={active.fp===0}/><Kpi icon={Siren} label="False negative" value={String(active.fn)} good={active.fn<=1}/><Kpi icon={Zap} label="Response time" value={`${active.response}s`} good={active.response<20}/></div>
        <div className="panel rounded-2xl p-4"><div className="flex items-start justify-between"><div><h2 className="text-sm font-semibold text-white">Readiness vs. synthetic ground truth</h2><p className="mt-1 text-[10px] text-slate-500">Ground truth is the known scenario severity; samples occur only at the selected probe interval.</p></div><span className="rounded-full px-2 py-1 text-[9px]" style={{background:`${scenarioColor[scenario]}18`,color:scenarioColor[scenario]}}>{scenario}</span></div><div className="mt-3 h-64"><ResponsiveContainer><LineChart data={active.samples}><CartesianGrid stroke="#14283a" vertical={false}/><XAxis dataKey="t" tick={{fill:'#52677a',fontSize:9}} axisLine={false} tickLine={false} unit="s"/><YAxis domain={[0,100]} tick={{fill:'#52677a',fontSize:9}} axisLine={false} tickLine={false}/><Tooltip contentStyle={tooltipStyle}/><Line dataKey="truth" name="Ground-truth health" stroke="#64748b" strokeDasharray="5 5" dot={false}/><Line dataKey="readiness" name="Measured readiness" stroke={scenarioColor[scenario]} strokeWidth={2.2} dot={false}/></LineChart></ResponsiveContainer></div></div>
        <div className="grid gap-4 md:grid-cols-[1.2fr_.8fr]"><div className="panel rounded-2xl p-4"><h2 className="text-sm font-semibold text-white">Scenario comparison</h2><div className="mt-3 h-44"><ResponsiveContainer><BarChart data={comparison}><CartesianGrid stroke="#14283a" vertical={false}/><XAxis dataKey="name" tick={{fill:'#52677a',fontSize:8}} axisLine={false} tickLine={false}/><YAxis tick={{fill:'#52677a',fontSize:9}} axisLine={false} tickLine={false}/><Tooltip contentStyle={tooltipStyle}/><Bar dataKey="accuracy" radius={[4,4,0,0]}>{comparison.map((_,i)=><Cell key={i} fill={Object.values(scenarioColor)[i]}/>)}</Bar></BarChart></ResponsiveContainer></div></div>
          <div className="panel rounded-2xl p-4"><h2 className="text-sm font-semibold text-white">Scoring comparison</h2><div className="mt-4 space-y-4"><ScoreCompare name="Weighted" result={weighted} active={method==='Weighted'}/><ScoreCompare name="Threshold" result={threshold} active={method==='Threshold'}/></div></div></div>
      </div>
    </div>
    <div className="grid gap-3 md:grid-cols-3"><Info icon={CircleGauge} title="Detection accuracy" text="Shorter intervals create more observations during brief faults, reducing missed ground-truth windows but increasing traffic."/><Info icon={Activity} title="Network overhead" text="Overhead is calculated from payload, a 42-byte allowance, request/reply direction, interval, and PRP path duplication."/><Info icon={GitBranch} title="Early warning" text="Weighted scoring combines weak signals before any single metric crosses a hard threshold, often alerting earlier on gradual faults."/></div>
    <div className="rounded-xl border border-slate-800 bg-[#07111f] px-4 py-3 text-[10px] leading-4 text-slate-500"><b className="text-slate-300">Evaluation assumptions:</b> 180-second deterministic run; fault begins after second 38; ground truth is active above severity 0.42. Weighted alerts when readiness &lt; 70. Threshold alerts when observed severity &gt; 0.48. Probe-size-dependent sinusoidal measurement error is deterministic—no random or external data is used.</div>
  </div>
}

function Kpi({icon:Icon,label,value,good}:any){return <div className="panel rounded-xl p-3"><div className="flex items-center gap-1.5 text-[9px] uppercase tracking-wider text-slate-500"><Icon size={12}/>{label}</div><div className={`mt-2 text-xl font-semibold ${good?'text-emerald-400':'text-amber-400'}`}>{value}</div></div>}
function ScoreCompare({name,result,active}:{name:string;result:any;active:boolean}){return <div className={`rounded-xl border p-3 ${active?'border-cyan-400/40 bg-cyan-400/5':'border-slate-800'}`}><div className="flex justify-between text-[11px]"><span className="text-slate-300">{name}</span><span className="text-slate-500">{result.delay}s delay</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-800"><div className="h-full bg-cyan-400" style={{width:`${result.accuracy}%`}}/></div><div className="mt-1 text-right text-[9px] text-slate-600">{result.accuracy}% sensitivity</div></div>}
function Info({icon:Icon,title,text}:any){return <div className="panel rounded-xl p-4"><Icon size={17} className="text-cyan-400"/><div className="mt-2 text-xs font-semibold text-white">{title}</div><p className="mt-1 text-[10px] leading-4 text-slate-500">{text}</p></div>}

export default function App(){
  const [page,setPage]=useState<1|2>(1)
  return <div className="min-h-screen bg-[#050b15]">
    <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-[#06101d]/90 backdrop-blur-xl"><div className="mx-auto flex max-w-[1500px] items-center justify-between px-4 py-3 md:px-7"><button onClick={()=>setPage(1)} className="flex items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded-xl bg-cyan-400 text-[#041019]"><ShieldCheck size={20}/></div><div className="text-left"><div className="text-sm font-semibold tracking-tight text-white">RedundancyGuard <span className="text-cyan-400">AI</span></div><div className="text-[8px] uppercase tracking-[.25em] text-slate-600">Industrial resilience lab</div></div></button>
      <nav className="hidden items-center gap-1 rounded-xl border border-slate-800 bg-[#081422] p-1 md:flex"><button onClick={()=>setPage(1)} className={`rounded-lg px-4 py-2 text-[10px] font-medium ${page===1?'bg-slate-700/70 text-white':'text-slate-500'}`}>01 · Network monitor</button><button onClick={()=>setPage(2)} className={`rounded-lg px-4 py-2 text-[10px] font-medium ${page===2?'bg-slate-700/70 text-white':'text-slate-500'}`}>02 · Evaluation lab</button></nav>
      <div className="flex items-center gap-2 text-[9px] uppercase tracking-widest text-emerald-400"><span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400"/>Simulation online</div></div></header>
    <main className="mx-auto max-w-[1500px] px-4 py-6 md:px-7">{page===1?<MonitorPage/>:<LabPage/>}</main>
    <div className="fixed bottom-4 left-1/2 z-40 flex -translate-x-1/2 gap-1 rounded-xl border border-slate-700 bg-[#091525]/95 p-1 shadow-2xl backdrop-blur md:hidden"><button onClick={()=>setPage(1)} className={`rounded-lg px-4 py-2 text-[10px] ${page===1?'bg-cyan-400 text-black':'text-slate-400'}`}>Monitor</button><button onClick={()=>setPage(2)} className={`rounded-lg px-4 py-2 text-[10px] ${page===2?'bg-cyan-400 text-black':'text-slate-400'}`}>Lab</button></div>
    <footer className="mx-auto flex max-w-[1500px] justify-between px-7 pb-6 pt-2 text-[9px] uppercase tracking-widest text-slate-700"><span>Simulation only · no live network connection</span><span>RG-AI / {new Date().getFullYear()}</span></footer>
  </div>
}
