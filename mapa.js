import { define, svg } from "uce";


define("inwestycja-mapa", {
    extends: "div",
    attachShadow: {mode: "open"},
    state: {},
    slots() {
        const data = {};
        this.querySelectorAll("[slot]").forEach((el) => {
          data[
            el.getAttribute("slot").replace(/-(\w)/g, ($0, $1) => $1.toUpperCase())
          ] = el;
        });
   
        return data;
      },
      fetchData(adress, header) {
        let dane = fetch(adress)
          .then(function (response) {
            return response.text();
          })
          .then(function (html) {
            let parser = new DOMParser();
            let doc = parser.parseFromString(html, header);
            let pageContent = {
              defs: doc.querySelector('defs'),
              image: doc.querySelector('#Photo'),
              letters: doc.querySelectorAll('.letter'),
              numbers: doc.querySelectorAll('.desktop[number]')
            }
            return pageContent;
          })
          .catch(function (err) {
            console.log("Failed to fetch page: ", err);
          });
        return dane;
      },
      letterMap(content) {
        let regex = /translate\((.+), (.+)\)/;
        return {
          id: content.id,
          x: parseFloat(regex.exec(content.attributes.transform.value)[1]),
          y: parseFloat(regex.exec(content.attributes.transform.value)[2]),
          transform: content.attributes.transform.value, 
          data: svg([content.innerHTML])
        };
      },
      numberMap(content) {
        return {
          number: content.attributes.number.value,
          x: parseFloat(content.attributes.cx.value),
          y: parseFloat(content.attributes.cy.value),
          data: svg([content.outerHTML])
        };
      },
      activateTooltip(id){
        let tooltip = document.querySelector("[is='inwestycja-tooltip']");
        tooltip.setPoint(id);
      },
      deactivateTooltip(){
        let tooltip = document.querySelector("[is='inwestycja-tooltip']");
        tooltip.turnOff();
      },

      init(){
        const slots = this.slots();
        this.slots = slots;
        let screenWidth = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
        if (screenWidth > 767) this.initDesktop();
        else this.static();
      },

    initDesktop() {
        this.fetchData(this.slots.material.src+"?x-request=svg", "image/svg+xml")
        .then((imageData) => {
          let dataOut = {
           defs: svg([imageData.defs.outerHTML]),
           map: svg([imageData.image.outerHTML]),
           numbers: Array.prototype.map.call(imageData.numbers, this.numberMap),
           letters: Array.prototype.map.call(imageData.letters, this.letterMap),
          }
          return dataOut;
        })
        .then((imageData) => {
          this.state.image = imageData;
          this.render();
        });
    },
    static() {
      this.html`
       <style>
            ${`
         .static, .static *{
           width:100%;
           height:100%;
         }
        
    `}
    </style>
    <div class="static">
      ${this.slots.material}
    </div>
      `
    },
    render() {
      let defs = this.state.image.defs;
      let map = this.state.image.map;
      let letters = this.state.image.letters.map(item => svg.for(item)`
      <g onMouseOut=${this.deactivateTooltip} transform=${item.transform} onMouseOver=${() => this.activateTooltip(item.id)}>
      ${item.data}
    </g>
      `);
       let numbers = this.state.image.numbers.map(item => svg.for(item)`
       <g  onMouseOut=${this.deactivateTooltip} onMouseOver=${() => this.activateTooltip(item.number)}>
       ${item.data}
     </g>
       `);
        this.html`
        <style>
        ${`
          
        `} 
      </style>
      <svg width="100%" height="100%" viewBox="0 0 2880 1440" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
      <a href="/mieszkania">
      ${defs}
      ${map}
      ${letters}
      ${numbers}
      </a>
      </svg>
        `
    }
});


define("inwestycja-tooltip", {
    extends: "div",
    attachShadow: {mode: "open"},
    state: {
        visible: false,
        xPosition: 250,
        yPosition: 320,
        init: false,
        listenerActive: false,
        activePoint: "A",
      },
    data: {
      1: "Ścieżka od ul. Głogowskiej",
      2: "Focha 34",
      3: "Kamienica przy Śniadeckich",
      4: "Wejście od ul. Śniadeckich",
      5: "Recepcja i SPA",
      6: "Betonhaus",
      "A": "Wejście A",
      "B": "Wejście B",
      "C": "Wejście C",
      "D": "Wejście D",
      "E": "Wejście E",
      "F": "Wejście F"
    },
    slots() {
      const data = {};
      this.querySelectorAll("[slot]").forEach((el) => {
        data[
          el.getAttribute("slot").replace(/-(\w)/g, ($0, $1) => $1.toUpperCase())
        ] = el;
      });
      return data;
    },
    init(){
      const slots = this.slots();
      this.slots = slots;
        let screenWidth = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
        if (screenWidth > 767)
        { 
          this.state.init = true;
          this.render();
        
        }
        else {
          this.static();
        }
    
    },
    connected(){
      if (this.state.init === true) this.updateListener();
    },
  
    disconnected(){
      if (this.state.init === true) this.updateListener();
    },
    
    setPoint(id){
    this.state.visible = true;
    this.state.activePoint = id;
    this.render();
    this.updateListener();

    },
   
    turnOff(){
      this.state.visible = false;
      this.render();
    },
    getTooltipPosition(e) {
      this.state.xPosition = e.clientX;
      this.state.yPosition = e.clientY;
      this.render();
  
    },
    addListener() {
      this.getTooltipPosition = this.getTooltipPosition.bind(this);
      window.addEventListener('mousemove', this.getTooltipPosition);
      this.state.listenerActive = true;
    },
  
    removeListener() {
      this.getTooltipPosition = this.getTooltipPosition.bind(this);
      window.removeEventListener('mousemove', this.getTooltipPosition);
      this.state.listenerActive = false;
    },
  
    updateListener() {
      if (!this.state.listenerActive && this.state.visible) {
        this.addListener();
      }
  
      if (this.state.listenerActive && !this.state.visible) {
        this.removeListener();
      }
      this.render();
    },
    static() {
      this.html`
      <link href="https://uploads-ssl.webflow.com/5eb408a1f5952329efe450f6/css/perfumiarnia.webflow.c7f6f0785.css" rel="stylesheet" type="text/css">
       <style>
            ${`
         .static{
           width:100%;
           height:100%;
         }
        
    `}
    </style>
    <div class="static">
      ${this.slots.static}
    </div>
      `
    },
    render(){
      let pointContent = this.data[this.state.activePoint];
      this.html`
      <style>
            ${`
            @keyframes fadein {
            from {opacity: 0;}
            to {opacity: 1;}
          }
            :host {
              display:block;
              z-index: 999;
              position:relative;
            }
            .tooltip-wrapper {
            display: ${this.state.visible ? 'block' : 'none'};
            position: fixed;
            top: 0px;
            left: 0px;
            animation-name: fadein;
            animation-duration: 0.4s;
            z-index: 999;
            transform: translateY(${this.state.yPosition + 15}px) translateX(${this.state.xPosition + 10 }px);
            }
        .tooltip {
            padding: 16px;
            background-color: #FFF;
            display:flex;
            flex-direction:row;
            font-family: neue-haas-grotesk-display, sans-serif;
            border: 1px solid #000000;
            text-transform: uppercase;
            font-size:12px;
            line-height:20px;
            font-weight: 600;
        }
        .tooltip-column {
            display:flex;
            flex-direction:column;
        }
        .featured{
            color: #845D39;
        }
        .tooltip-column:not(:last-child){
            margin-right:16px;

        }
    `}
    </style>
    <div class="tooltip-wrapper">
    <div class="tooltip">
        <span> ${pointContent}</span>
        </div>
    </div>
    `

    }
})