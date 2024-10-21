(()=>{"use strict";var t={d:(e,n)=>{for(var o in n)t.o(n,o)&&!t.o(e,o)&&Object.defineProperty(e,o,{enumerable:!0,get:n[o]})},o:(t,e)=>Object.prototype.hasOwnProperty.call(t,e)},e={};t.d(e,{processImage:()=>T});const n=(t,e)=>[t.data[e],t.data[e+1],t.data[e+2],t.data[e+3]];class o{constructor(t,e){this.topLeft=void 0,this.bottomRight=void 0,this.width=void 0,this.height=void 0,this.topLeft=t,this.bottomRight=e,this.width=this.bottomRight.x-this.topLeft.x,this.height=this.bottomRight.y-this.topLeft.y}getAllVisualPixels(){let t=[];for(let e=this.topLeft.x;e<=this.bottomRight.x;e++)for(let n=this.topLeft.y;n<=this.bottomRight.y;n++)t.push({x:e,y:n});return t}}let i=function(t){return t[t.NORTH=0]="NORTH",t[t.NORTH_EAST=1]="NORTH_EAST",t[t.EAST=2]="EAST",t[t.SOUTH_EAST=3]="SOUTH_EAST",t[t.SOUTH=4]="SOUTH",t[t.SOUTH_WEST=5]="SOUTH_WEST",t[t.WEST=6]="WEST",t[t.NORTH_WEST=7]="NORTH_WEST",t}({});class a{constructor(t,e){this.area=void 0,this.area=new o(t,e)}getPixelsToBeProcessed(){return this.area.getAllVisualPixels().filter((t=>(t.x+t.y)%2===0))}}const s={1:{row:1,column:1},2:{row:1,column:2},3:{row:1,column:3},4:{row:2,column:1},5:{row:2,column:2},6:{row:2,column:3},7:{row:3,column:1},8:{row:3,column:2},9:{row:3,column:3}};class r{constructor(t,e){this.area=void 0,this.area=new o(t,e)}static fromImageData(t){const{width:e,height:n}=t,o=Math.round(e/3),i=Math.round(e/3*2),a=Math.round(n/3),s=Math.round(n/3*2);return[new r({x:0,y:0},{x:o,y:a}),new r({x:o+1,y:0},{x:i,y:a}),new r({x:i+1,y:0},{x:e,y:a}),new r({x:0,y:a+1},{x:o,y:s}),new r({x:o+1,y:a+1},{x:i,y:s}),new r({x:i+1,y:a+1},{x:e,y:s}),new r({x:0,y:s+1},{x:o,y:n}),new r({x:o+1,y:s+1},{x:i,y:n}),new r({x:i+1,y:s+1},{x:e,y:n})]}static fromImageDataAndLabels(t,e){const n=r.fromImageData(t),o=e.map((t=>3*(t.row-1)+t.column-1));return n.filter(((t,e)=>o.includes(e)))}doesSegmentContainVisualPixel(t){const e=t.x>=this.area.topLeft.x&&t.x<=this.area.bottomRight.x,n=t.y>=this.area.topLeft.y&&t.y<=this.area.bottomRight.y;return e&&n}getSeam(t,e){const{topLeft:n,bottomRight:o}=this.area,s=Math.floor(this.area.width*e),r=Math.floor(this.area.height*e);switch(t){case i.NORTH:return new a(n,{x:o.x,y:n.y+r});case i.NORTH_EAST:return new a({x:o.x-s,y:n.y},{x:o.x,y:n.y+r});case i.EAST:return new a({x:o.x-s,y:n.y},o);case i.SOUTH_EAST:return new a({x:o.x-s,y:o.y-r},o);case i.SOUTH:return new a({x:n.x,y:o.y-r},o);case i.SOUTH_WEST:return new a({x:n.x,y:o.y-r},{x:n.x+s,y:o.y});case i.WEST:return new a(n,{x:n.x+s,y:o.y});case i.NORTH_WEST:return new a(n,{x:n.x+s,y:n.y+r})}}}const m={1:[{segment:2,orientation:i.WEST},{segment:4,orientation:i.NORTH},{segment:5,orientation:i.NORTH_WEST}],2:[{segment:1,orientation:i.EAST},{segment:3,orientation:i.WEST},{segment:4,orientation:i.NORTH_EAST},{segment:5,orientation:i.NORTH},{segment:6,orientation:i.NORTH_WEST}],3:[{segment:2,orientation:i.EAST},{segment:5,orientation:i.NORTH_EAST},{segment:6,orientation:i.NORTH}],4:[{segment:1,orientation:i.SOUTH},{segment:2,orientation:i.SOUTH_WEST},{segment:5,orientation:i.WEST},{segment:7,orientation:i.NORTH},{segment:8,orientation:i.NORTH_WEST}],5:[{segment:1,orientation:i.SOUTH_EAST},{segment:2,orientation:i.SOUTH},{segment:3,orientation:i.SOUTH_WEST},{segment:4,orientation:i.EAST},{segment:6,orientation:i.WEST},{segment:7,orientation:i.NORTH_EAST},{segment:8,orientation:i.NORTH},{segment:9,orientation:i.NORTH_WEST}],6:[{segment:2,orientation:i.SOUTH_EAST},{segment:3,orientation:i.SOUTH},{segment:5,orientation:i.EAST},{segment:8,orientation:i.NORTH_EAST},{segment:9,orientation:i.NORTH}],7:[{segment:4,orientation:i.SOUTH},{segment:5,orientation:i.SOUTH_WEST},{segment:8,orientation:i.WEST}],8:[{segment:4,orientation:i.SOUTH_EAST},{segment:5,orientation:i.SOUTH},{segment:6,orientation:i.SOUTH_WEST},{segment:7,orientation:i.EAST},{segment:9,orientation:i.WEST}],9:[{segment:5,orientation:i.SOUTH_EAST},{segment:6,orientation:i.SOUTH},{segment:8,orientation:i.EAST}]},T=(t,e,o)=>{const i=t.map((t=>s[t])),a=((t,e,o)=>{const i=4*t.width*t.height,a=r.fromImageDataAndLabels(t,o);let s=[];for(let r=0;r<i;r+=4){const o={x:(m=Math.floor(r/4))%(T=t.width),y:Math.floor(m/T)},i=a.some((t=>t.doesSegmentContainVisualPixel(o))),g=n(i?t:e,r);s.push(...g)}var m,T;const g=new Uint8ClampedArray(s);return new ImageData(g,t.width,t.width)})(e,o,i);return t.flatMap((t=>m[t])).filter((e=>!t.includes(e.segment))).forEach((t=>{((t,e,o)=>{const{segment:i,orientation:a}=o,[m]=r.fromImageDataAndLabels(t,[s[i]]);m.getSeam(a,.2).getPixelsToBeProcessed().forEach((o=>{const i=((t,e)=>{const{x:n,y:o}=t;return 4*(o*e+n)})(o,t.width);n(t,i).forEach(((t,n)=>{const o=i+n;e.data[o]=t}))}))})(e,a,t)})),a};addEventListener("message",(function(t){var n,o=t.data,i=o.type,a=o.method,s=o.id,r=o.params;"RPC"===i&&a&&((n=e[a])?Promise.resolve().then((function(){return n.apply(e,r)})):Promise.reject("No such method")).then((function(t){postMessage({type:"RPC",id:s,result:t})})).catch((function(t){var e={message:t};t.stack&&(e.message=t.message,e.stack=t.stack,e.name=t.name),postMessage({type:"RPC",id:s,error:e})}))})),postMessage({type:"RPC",method:"ready"})})();
//# sourceMappingURL=c9c97c2c3fb6788a217d.worker.js.map