'use strict';
const icons = {
  arrow:'<path d="M4 12h15m-5-5 5 5-5 5"/>', back:'<path d="M20 12H5m5-5-5 5 5 5"/>',
  calendar:'<rect x="4" y="5" width="16" height="16" rx="2"/><path d="M8 3v4m8-4v4M4 11h16"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
  archive:'<rect x="3" y="4" width="18" height="4" rx="1.5"/><path d="M5 8v12h14V8M10 12h4"/>',
  grid:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  tag:'<path d="M3 3h8l10 10-8 8L3 11Z"/><circle cx="7.5" cy="7.5" r="1"/>',
  atom:'<ellipse cx="12" cy="12" rx="10" ry="4"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)"/>',
  terminal:'<rect x="3" y="4" width="18" height="16" rx="2"/><path d="m7 9 3 3-3 3m6 0h4"/>',
  list:'<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  moon:'<path d="M20.9 13a9 9 0 0 1-9.9-9.9A9 9 0 1 0 20.9 13Z"/>',
  sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/>',
  copy:'<rect x="8" y="8" width="12" height="13" rx="2"/><path d="M16 8V3H3v13h5"/>',
  github:'<path d="M9 19c-4.3 1.4-4.3-2.5-6-3m12 5v-3.5c0-1-.1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1.1-.3-3.5 1.3a12.3 12.3 0 0 0-6.2 0C6.5 2.8 5.4 3.1 5.4 3.1a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4 9.5c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V21"/>'
};
const svg = name => `<svg viewBox="0 0 24 24" aria-hidden="true">${icons[name] || icons.arrow}</svg>`;
const escapeHTML = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const main = document.getElementById('main');
const right = document.getElementById('right-sidebar');
let articles = [];
let observer;
let toastTimer;
const articleLink = article => `/p/${encodeURIComponent(article.id)}/`;
const isLinux = article => /linux|gnome/i.test([article.category,...article.tags].join(" "));
const countLabel = count => String(count).padStart(2,"0");
function archiveGroups(){return [...new Set(articles.map(a=>a.date.slice(0,4)))].sort().reverse().map(year=>({year,posts:articles.filter(a=>a.date.startsWith(year))}));}
const searchLink = query => `#/search?q=${encodeURIComponent(query)}`;
function themeButton(){return `<button class="mobile-theme-button" data-theme-toggle aria-label="切换明暗模式">${svg(document.documentElement.dataset.theme === 'dark' ? 'sun' : 'moon')}</button>`;}
function eyebrow(text){return `<div class="eyebrow"><span class="eyebrow-dot"></span>${text}${themeButton()}</div>`;}
function pageHeader(english, title, text){return `<header class="page-header">${eyebrow(english)}<h1>${title}</h1><p>${text}</p></header>`;}
function card(article){
  const green = isLinux(article);
  return `<article class="post-card"><span class="post-category ${green?'green':''}">${svg(green?'terminal':'atom')}${escapeHTML(article.category)}</span><h2><a href="${articleLink(article)}">${escapeHTML(article.title)}</a></h2><p class="excerpt">${escapeHTML(article.description)}</p><footer class="post-card-footer"><time class="meta-piece" datetime="${article.date}">${svg('calendar')}${article.date.replaceAll('-',' / ')}</time><span class="meta-piece">${svg('clock')}${article.minutes} 分钟阅读</span><span class="read-link">阅读全文 ${svg('arrow')}</span></footer></article>`;
}
function defaultWidgets(){
  const topics=[...new Set(articles.map(a=>a.category))].map(name=>({name,count:articles.filter(a=>a.category===name).length}));
  const keywords=[...new Set(articles.flatMap(a=>a.tags))].slice(0,10);
  return `<form class="search-widget" data-search-form role="search"><label class="search-box">${svg('search')}<input name="q" aria-label="搜索文章" placeholder="寻找一篇笔记…" autocomplete="off"><kbd>⌘ K</kbd><button aria-label="提交搜索">${svg('arrow')}</button></label></form><section class="widget"><h2 class="widget-title">${svg('archive')}文章归档<small>ARCHIVE</small></h2><div class="archive-links">${archiveGroups().map(({year,posts})=>`<a class="archive-link" href="#/archives?year=${year}"><span>${year}</span><span class="archive-count">${posts.length} 篇文章&nbsp; ↗</span></a>`).join('')}</div></section><section class="widget"><h2 class="widget-title">${svg('grid')}按主题阅读<small>TOPICS</small></h2>${topics.map(({name,count})=>`<a class="topic-link ${/linux/i.test(name)?'green':''}" href="${searchLink(name)}">${escapeHTML(name)}<span>${countLabel(count)}</span></a>`).join('')}</section><section class="widget"><h2 class="widget-title">${svg('tag')}关键词<small>KEYWORDS</small></h2><div class="tag-cloud">${keywords.map(tag=>`<a href="${searchLink(tag)}">${escapeHTML(tag)}</a>`).join('')}</div></section><div class="side-note"><span class="little-star" aria-hidden="true">✳</span><p>在探索中学习，<br>在记录中思考。</p><p>A LITTLE SPACE FOR THOUGHTS.</p><a class="manage-link" href="/admin/">文章管理 ↗</a></div>`;
}
function renderHome(){
  main.innerHTML = `<header class="main-intro">${eyebrow('NOTES, IDEAS & LITTLE THINGS')}<h1>一些学习，一些记录。</h1><svg class="orbit-drawing" viewBox="0 0 150 150" fill="none" aria-hidden="true"><ellipse cx="75" cy="72" rx="57" ry="23" stroke="currentColor" stroke-width=".8"/><ellipse cx="75" cy="72" rx="57" ry="23" stroke="currentColor" stroke-width=".8" transform="rotate(60 75 72)"/><ellipse cx="75" cy="72" rx="57" ry="23" stroke="currentColor" stroke-width=".8" transform="rotate(120 75 72)"/><circle cx="75" cy="72" r="4" fill="currentColor"/><circle cx="126" cy="61" r="3" fill="currentColor"/><circle cx="47" cy="119" r="3" fill="currentColor"/><path d="M125 116v8m-4-4h8" stroke="currentColor" stroke-width=".8"/></svg></header><div class="section-heading"><h2>最近的记录</h2><span>${countLabel(articles.length)}</span><span class="heading-line"></span><span class="sort-label"><svg viewBox="0 0 18 18"><path d="M5 3v12m-3-3 3 3 3-3M10 4h6m-6 4h4m-4 4h2"/></svg>按时间排序</span></div><section class="post-list" aria-label="最近文章">${articles.map(card).join('')}</section><p class="post-list-end">写下的每一点，都算数</p>`;
  right.innerHTML=defaultWidgets();
}
function renderArchive(selectedYear=''){
  const groups=archiveGroups();
  const visible=groups.filter(g=>!selectedYear||g.year===selectedYear);
  main.innerHTML=pageHeader('A COLLECTION OF DAYS','文章归档','按时间，翻一翻过去写下的东西。')+`<div class="filter-bar"><a class="filter-button ${selectedYear?'':'active'}" href="#/archives">全部文章 · ${articles.length}</a>${groups.map(({year})=>`<a class="filter-button ${selectedYear===year?'active':''}" href="#/archives?year=${year}">${year}</a>`).join('')}</div>${visible.map(({year,posts})=>`<section class="archive-panel"><h2 class="archive-year">${year}<span>共 ${posts.length} 篇记录</span></h2><div class="timeline">${posts.map(a=>`<a class="timeline-item" href="${articleLink(a)}"><time datetime="${a.date}">${a.date.slice(5).replace('-',' / ')}</time><h2>${escapeHTML(a.title)}</h2></a>`).join('')}</div></section>`).join('')}`;
  right.innerHTML=defaultWidgets();
}
function normalized(value){return value.toLocaleLowerCase().replace(/\s+/g,' ').trim();}
function results(query){
  const terms=normalized(query).split(' ').filter(Boolean);
  return articles.filter(a=>terms.every(term=>a.searchText.includes(term)));
}
function resultContent(query){
  const matches=results(query);
  return `<p class="search-result-count" role="status">${query ? `“${escapeHTML(query)}” · 找到 ${matches.length} 篇文章` : `全部 ${articles.length} 篇文章 · 支持标题、主题与正文搜索`}</p>${matches.length?`<div class="post-list">${matches.map(card).join('')}</div>`:`<div class="empty-state"><div class="empty-icon">⌕</div><h2>还没有这方面的记录</h2><p>换个关键词，或回到全部文章再看看。</p><button id="clear-search">查看全部文章</button></div>`}`;
}
function renderSearch(query){
  main.innerHTML=pageHeader('FIND A LITTLE SOMETHING','搜索笔记','从标题、主题或正文中，找回那段记录。')+`<form class="search-page-form" id="main-search" data-search-form role="search"><label class="search-box">${svg('search')}<input type="search" name="q" id="search-input" aria-label="搜索标题和正文" placeholder="输入关键词，按下 Enter…" value="${escapeHTML(query)}" autocomplete="off"><button aria-label="提交搜索">${svg('arrow')}</button></label></form><div id="search-results">${resultContent(query)}</div>`;
  right.innerHTML=defaultWidgets();
  document.getElementById('search-input').addEventListener('input',event=>{
    const query=event.target.value.trim();
    history.replaceState(null,'','/'+searchLink(query));
    document.getElementById('search-results').innerHTML=resultContent(query);
  });
}
function renderLinks(){
  main.innerHTML=pageHeader('A FEW PLACES TO GO','常用链接','这里和别处，保持连接。')+`<div class="links-list"><a class="link-card" href="https://github.com/eigenwill" target="_blank" rel="noopener noreferrer"><span class="link-icon">${svg('github')}</span><div><h2>EigenWill on GitHub</h2><p>代码、配置，以及更多折腾的痕迹。</p></div><span class="arrow">↗</span></a><a class="link-card" href="https://github.com/eigenwill/eigenwill.github.io" target="_blank" rel="noopener noreferrer"><span class="link-icon">${svg('archive')}</span><div><h2>博客源码</h2><p>Markdown 博文、网站代码和发布记录。</p></div><span class="arrow">↗</span></a><a class="link-card" href="https://github.com/CaiJimmy/hugo-theme-stack" target="_blank" rel="noopener noreferrer"><span class="link-icon">${svg('grid')}</span><div><h2>Hugo Theme Stack</h2><p>原博客使用的主题，也是这里的版式灵感。</p></div><span class="arrow">↗</span></a></div>`;
  right.innerHTML=defaultWidgets();
}
function renderArticle(id){
  const article=articles.find(a=>a.id===id);
  if(!article){main.innerHTML=pageHeader('PAGE NOT FOUND','这页笔记不在这里','链接可能有误，回首页看看吧。')+'<a class="filter-button" href="#/">返回首页 →</a>';right.innerHTML=defaultWidgets();return;}
  document.title=`${article.title} · Will's blog`;
  main.dataset.articleId=id;
  const other=articles.find(a=>a.id!==id);
  main.innerHTML=`<div class="reading-toolbar"><a href="#/">${svg('back')} 返回全部文章</a><button id="copy-article">${svg('copy')}复制链接</button>${themeButton()}</div><article class="article-panel"><header class="article-header"><a class="post-category ${isLinux(article)?'green':''}" href="${searchLink(article.category)}">${svg(isLinux(article)?'terminal':'atom')}${escapeHTML(article.category)}</a><h1>${escapeHTML(article.title)}</h1><div class="article-meta"><time class="meta-piece" datetime="${article.date}">${svg('calendar')}${article.date.replaceAll('-',' / ')}</time><span class="meta-piece">${svg('clock')}${article.minutes} 分钟阅读</span><span>Will · 学习与实践笔记</span></div></header><div class="article-body" id="article-body">${article.html.replace(/\[image\](?:\s*<br>)?/g,'')}</div><footer class="article-end"><span>✧</span> 记录于 ${article.date}<a href="/admin/">管理文章 ↗</a></footer></article>${other?`<a class="next-post" href="${articleLink(other)}"><span>再读一篇 &nbsp; ↗</span><h2>${escapeHTML(other.title)}</h2></a>`:''}`;
  const body=document.getElementById('article-body');
  body.querySelectorAll('h1>a,h2>a,h3>a,h4>a').forEach(a=>{if(a.textContent.trim()==='#'&&a.getAttribute('href')?.startsWith('#'))a.remove();});
  body.querySelectorAll('.highlight').forEach(block=>{const source=block.querySelector('code[data-lang]')||[...block.querySelectorAll('pre code')].pop();if(source){const pre=document.createElement('pre');const code=document.createElement('code');code.textContent=source.textContent;pre.appendChild(code);block.replaceWith(pre);}});
  body.querySelectorAll('a').forEach(a=>{const href=a.getAttribute('href')||'';try{if(href.startsWith('#')){a.dataset.scroll=decodeURIComponent(href.slice(1));}else if(new URL(a.href).origin!==location.origin){a.target='_blank';a.rel='noopener noreferrer';}}catch(e){}});
  // A paragraph containing only one TeX expression is a display equation.
  body.querySelectorAll('p').forEach(p=>{const t=p.textContent.trim();if(p.childElementCount===0&&t.startsWith('$')&&t.endsWith('$')&&!t.startsWith('$$')&&(t.match(/\$/g)||[]).length===2){p.textContent=`$$${t.slice(1,-1)}$$`;}});
  if(typeof renderMathInElement==='function') renderMathInElement(body,{delimiters:[{left:'$$',right:'$$',display:true},{left:'\\[',right:'\\]',display:true},{left:'\\(',right:'\\)',display:false},{left:'$',right:'$',display:false}],throwOnError:false,strict:false,trust:false});
  body.querySelectorAll('pre').forEach(pre=>{
    const text=pre.textContent;
    const button=document.createElement('button');button.type='button';button.className='copy-code';button.textContent='复制';button.setAttribute('aria-label','复制这段代码');
    button.addEventListener('click',async()=>{if(await copyText(text)){button.textContent='已复制';setTimeout(()=>button.textContent='复制',1800);}});
    pre.appendChild(button);
  });
  const headings=[...body.querySelectorAll('h2,h3')];
  right.innerHTML=`<a class="reading-toolbar" href="#/">${svg('back')} 回到首页</a><section class="widget"><h2 class="widget-title">${svg('list')}文章目录<small>CONTENTS</small></h2><nav class="toc" aria-label="文章目录">${headings.map(h=>`<a href="${articleLink(article)}#${encodeURIComponent(h.id)}" data-scroll="${escapeHTML(h.id)}" class="${h.tagName==='H3'?'sub':''}">${escapeHTML(h.textContent.trim())}</a>`).join('')}</nav></section><div class="side-note"><span class="little-star">✳</span><p>不着急，慢慢读。<br>每一步理解都值得停留。</p></div>`;
  observer=new IntersectionObserver(entries=>{for(const entry of entries){if(entry.isIntersecting){right.querySelectorAll('[data-scroll]').forEach(a=>a.classList.toggle('active',a.dataset.scroll===entry.target.id));}}},{rootMargin:'-10% 0px -70% 0px'});
  headings.forEach(h=>observer.observe(h));
  document.getElementById('copy-article').addEventListener('click',()=>copyText(location.href));
}
function route(){
  observer?.disconnect();
  const hash=location.hash.startsWith('#/')?location.hash.slice(1):(location.pathname.startsWith('/p/')?'/post/'+location.pathname.split('/')[2]:'/');
  const [path,queryString='']=hash.split('?');
  const params=new URLSearchParams(queryString);
  const routeName=path.startsWith('/post/')?'article':path.split('/')[1]||'home';
  main.dataset.page=routeName;
  document.title="Will's blog · 学习与记录";
  document.querySelectorAll('[data-nav]').forEach(a=>{const active=a.dataset.nav===routeName||(routeName==='article'&&a.dataset.nav==='home');a.classList.toggle('active',active);if(active)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
  if(routeName==='home')renderHome();else if(routeName==='archives')renderArchive(params.get('year')||'');else if(routeName==='search')renderSearch(params.get('q')||'');else if(routeName==='links')renderLinks();else if(routeName==='article'){try{renderArticle(decodeURIComponent(path.slice(6)))}catch(e){renderArticle('')}}else{main.innerHTML=pageHeader('PAGE NOT FOUND','这页笔记不在这里','回到首页，继续翻翻吧。')+'<a class="filter-button" href="#/">返回首页 →</a>';right.innerHTML=defaultWidgets();}
  document.getElementById('main-nav').classList.remove('open');
  document.getElementById('menu-toggle').setAttribute('aria-expanded','false');
  let section;try{section=routeName==='article'&&location.hash&&!location.hash.startsWith('#/')?document.getElementById(decodeURIComponent(location.hash.slice(1))):null;}catch(e){}
  if(section)requestAnimationFrame(()=>section.scrollIntoView({block:'start'}));else window.scrollTo({top:0,behavior:'instant'});
  updateScroll();
}
function toggleTheme(){
  const theme=document.documentElement.dataset.theme==='dark'?'light':'dark';
  document.documentElement.dataset.theme=theme;
  try{localStorage.setItem('will-theme',theme);}catch(e){}
  updateThemeLabel();
}
function updateThemeLabel(){
  const dark=document.documentElement.dataset.theme==='dark';
  const button=document.getElementById('theme-toggle');button.querySelector('span').textContent=dark?'浅色模式':'深色模式';button.setAttribute('aria-label',dark?'切换到浅色模式':'切换到深色模式');
  document.querySelectorAll('[data-theme-toggle]').forEach(b=>b.innerHTML=svg(dark?'sun':'moon'));
  document.querySelector('meta[name=theme-color]').content=dark?'#1d1e25':'#f6f6f9';
}
function toast(text){const el=document.getElementById('toast');el.textContent=text;el.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('visible'),2200);}
async function copyText(text){try{await navigator.clipboard.writeText(text);toast('已复制到剪贴板');return true;}catch(e){toast('暂时无法复制，请手动选择文本');return false;}}
function updateScroll(){const max=document.documentElement.scrollHeight-window.innerHeight;document.getElementById('reading-progress').style.width=main.dataset.page==='article'&&max>0?`${Math.min(100,window.scrollY/max*100)}%`:'0';document.getElementById('back-top').classList.toggle('visible',window.scrollY>350);}
document.getElementById('theme-toggle').addEventListener('click',toggleTheme);
document.getElementById('menu-toggle').addEventListener('click',event=>{const button=event.currentTarget;const open=document.getElementById('main-nav').classList.toggle('open');button.setAttribute('aria-expanded',String(open));});
document.getElementById('back-top').addEventListener('click',()=>window.scrollTo({top:0,behavior:'smooth'}));
document.addEventListener('click',event=>{
  if(event.target.closest('.skip-link')){event.preventDefault();main.focus();main.scrollIntoView();}
  const theme=event.target.closest('[data-theme-toggle]');if(theme)toggleTheme();
  const toc=event.target.closest('[data-scroll]');if(toc){event.preventDefault();const target=document.getElementById(toc.dataset.scroll);if(target){const article=articles.find(a=>a.id===main.dataset.articleId);history.replaceState(null,'',(article?articleLink(article):location.pathname)+'#'+encodeURIComponent(toc.dataset.scroll));target.scrollIntoView({behavior:'smooth',block:'start'});}}
  if(event.target.closest('#clear-search')){const input=document.getElementById('search-input');input.value='';input.dispatchEvent(new Event('input'));input.focus();}
});
document.addEventListener('submit',event=>{if(event.target.matches('[data-search-form]')){event.preventDefault();const q=new FormData(event.target).get('q')?.trim()||'';const next=searchLink(q);if(location.hash===next){document.getElementById('search-input')?.focus();}else location.href='/'+next;}});
document.addEventListener('keydown',event=>{if((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==='k'){event.preventDefault();if(location.hash.startsWith('#/search'))document.getElementById('search-input')?.focus();else{location.href='/#/search';setTimeout(()=>document.getElementById('search-input')?.focus(),30);}}});
window.addEventListener('scroll',updateScroll,{passive:true});
window.addEventListener('hashchange',()=>{route();updateThemeLabel();});
updateThemeLabel();
fetch('assets/articles.json').then(response=>{if(!response.ok)throw new Error('读取失败');return response.json();}).then(data=>{articles=data.map(a=>{const doc=new DOMParser().parseFromString(a.html,'text/html');return {...a,searchText:normalized([a.title,a.description,a.category,...a.tags,doc.body.textContent].join(' '))};});route();updateThemeLabel();}).catch(()=>{main.innerHTML=pageHeader('SOMETHING WENT WRONG','笔记暂时没能展开','请刷新页面再试一次，或查看发布状态。')+'<a class="filter-button" href="https://github.com/eigenwill/eigenwill.github.io/actions">查看发布状态 ↗</a>';});
