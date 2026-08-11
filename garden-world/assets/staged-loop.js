(function(){
  'use strict';
  function ready(fn){if(document.readyState!=='loading')fn();else document.addEventListener('DOMContentLoaded',fn);}
  ready(function(){
    const slide=document.querySelector('.gw-loop-method-slide');
    const reveal=slide&&slide.querySelector('.gw-loop-reveal');
    const gif=reveal&&reveal.querySelector('img[data-src]');
    if(!slide||!reveal||!gif)return;
    const base=gif.getAttribute('data-src');

    function active(){return slide.classList.contains('is-active');}
    function shown(){return reveal.classList.contains('is-revealed');}
    function restartGif(){gif.removeAttribute('src');void gif.offsetWidth;gif.src=base+'?play='+(Date.now());}
    function show(){restartGif();reveal.classList.add('is-revealed');reveal.setAttribute('aria-hidden','false');}
    function hide(){reveal.classList.remove('is-revealed');reveal.setAttribute('aria-hidden','true');gif.removeAttribute('src');}
    function next(){hide();location.hash='#/11';}

    document.addEventListener('keydown',function(e){
      if(!active()||e.metaKey||e.ctrlKey||e.altKey)return;
      if(['ArrowRight',' ','PageDown','Enter'].includes(e.key)){
        if(!shown())show();else next();
        e.preventDefault();e.stopImmediatePropagation();
      }else if(shown()&&['ArrowLeft','PageUp','Backspace','Escape'].includes(e.key)){
        hide();e.preventDefault();e.stopImmediatePropagation();
      }
    },true);

    slide.addEventListener('click',function(e){
      if(!active())return;
      if(!shown())show();else next();
      e.preventDefault();e.stopPropagation();
    },true);

    window.addEventListener('hashchange',function(){if(!/^#\/10(?:$|\?)/.test(location.hash))hide();});
  });
})();
