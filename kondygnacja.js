import { define, svg } from "uce";

define("kondygnacja-mapa", {
  attachShadow: { mode: "open" },
  state: {
      image: [],
      dataInitialized: false,
      header: "0 0 1328 1329",
  },
  external: {
    newState: {}
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
  fetchData(adress, tag, header) {
    let dane = fetch(adress)
      .then(function (response) {
        return response.text();
      })
      .then(function (html) {
        let parser = new DOMParser();
        let doc = parser.parseFromString(html, header);
        let pageContent = doc.querySelectorAll(tag);
        let boxHeader = doc.querySelector('svg').attributes.viewBox.value;
        return [pageContent,boxHeader];
      })
      .catch(function (err) {
        console.log("Failed to fetch page: ", err);
      });
    return dane;
  },
  imageMap(content){
    return {
      id: content.id,
      data: svg([content.outerHTML]),
      mieszkanie: content.id !== "mapa",
      stan: "dostępne"
    };
  },
  mieszkanieChangeState(id,newStan){
    let apartment = this.state.image.filter((item) => {
        return item.id == id;
    });
    apartment[0].stan = newStan;
    this.render();

  },
  set mieszkanieNewState(value){
    if(!this.state.dataInitialized){
    this.external.newState[value.id] = value.state;
    }
    else{
      let apartment = this.state.image.filter((item) => {
        return item.id == value.id;
    });
    apartment[0].stan = value.state;
    this.render();
    }
    
  },
  activateTooltip(id){
    let tooltip = document.querySelector('kondygnacja-tooltip');
    tooltip.setMieszkanie(id);
    tooltip.toggl();
  },
  deactivateTooltip(){
    let tooltip = document.querySelector('kondygnacja-tooltip');
    tooltip.toggl();
  },
  stateSwitch(state){
    switch (state){
        case 'dostępne':
            return 'mieszkanie';
        case 'zarezerwowane':
            return 'mieszkanie zarezerwowane';
        case 'sprzedane':
            return 'mieszkanie sprzedane';
        default:
            return 'mieszkanie error ' + state;
    }
  },
 
  init(){
    const slots = this.slots();
    this.slots = slots;
    this.fetchData(this.slots.map.src+"?x-request=svg", "g[id='mapa'],g[fill='currentColor']", "image/svg+xml")
    .then(([imageData,boxHeader]) => {
      return [Array.prototype.map.call(imageData, this.imageMap),boxHeader];
    })
    .then(([imageData,boxHeader]) => {
      this.state.dataInitialized = true;
      
      let idDoZmiany = Object.keys(this.external.newState);
      let mieszkaniaDoZmiany = this.external.newState;
      if( idDoZmiany.length > 0){
        idDoZmiany.forEach(function(id) {
          let apartment = imageData.filter((item) => {
            return item.id == id;
        });
        apartment[0].stan = mieszkaniaDoZmiany[id];
        })
      }
      this.state.image = imageData;
      this.state.header = boxHeader;

      this.render();
    });

  },
  render(){
    let header = this.state.header;
    let mapa = this.state.image.filter((item) => {
        return item.id == "mapa";
      })[0].data;
      let mieszkania = this.state.image.filter((item) => {
        return item.mieszkanie === true;
    });
    let mieszkaniaRender = mieszkania.map(item => svg.for(item)`
    <a class="${this.stateSwitch(item.stan)}" onMouseOut=${this.deactivateTooltip} onMouseOver=${() => this.activateTooltip(item.id)} href=${`/mieszkania/${item.id}`}">
    ${item.data}
    </a>
    `);
    this.html`
        ${this.slots.direction}
    <style>
    ${`
    :host{
      width: 100%;
      height: 100%;
      padding-right: 64px;
    }
    .zarezerwowane{
           color: rgba(0, 0, 0, 0.5) !important  ;
       }
       .mieszkanie{
        color: #845D39 ;
       }
       .sprzedane{
        color: transparent !important;
        pointer-events: none !important;
       }
 
       .mieszkanie * {
        opacity: 0.4 !important;

       }
       .mieszkanie:hover * {
        opacity: 0.5 !important;

       }
    `} 
  </style>
  
  <svg
    height="100%"
    width="100%"
    viewBox=${header}
    preserveAspectRatio="xMinYMid meet"
    xmlns="http://www.w3.org/2000/svg"
    stroke="none"
    stroke-width="1"
    fill="none"
    fill-rule="evenodd"
  >
  
  ${mapa}
  ${mieszkaniaRender}
        

        </svg>
    `
  }
});

define("kondygnacja-tooltip", {
    attachShadow: {mode: "open"},
    observedAttributes: ["data"],
    state: {
        visible: false,
        xPosition: 0,
        yPosition: 0,
        listenerActive: false,
        activeMieszkanie: "a-02-01",
      },
      metaMap(content) {
        let meta = content.querySelector(".meta");
        return {
          name: meta.getAttribute("data-name"),
          slug: meta.getAttribute("data-slug"),
          status: meta.getAttribute("data-status").toLowerCase(),
          area: meta.getAttribute("data-area"),
          rooms: meta.getAttribute("data-rooms"),
        };
      },
      fetchData(adress, tag, header) {
        let dane = fetch(adress)
          .then(function (response) {
            return response.text();
          })
          .then(function (html) {
            let parser = new DOMParser();
            let doc = parser.parseFromString(html, header);
            let pageContent = doc.querySelectorAll(tag);
            return pageContent;
          })
          .catch(function (err) {
            console.log("Failed to fetch page: ", err);
          });
        return dane;
      },
    init(){
        this.fetchData(this.props.data, ".w-dyn-item", "text/html")
      .then((data) => {
        return Array.prototype.map.call(data, this.metaMap);
      })
      .then((meta) => {
       
        this.state.data = meta;
        let mapa = document.querySelector('kondygnacja-mapa');
        if (mapa !== null){
          this.state.data.forEach((mieszkanie) => {
            mapa.mieszkanieNewState = {id: mieszkanie.slug,state: mieszkanie.status}
          })
        }
        else {
        document.addEventListener('readystatechange', () => {
          let mapa = document.querySelector('kondygnacja-mapa');
          if(document.readyState === "complete"){
          this.state.data.forEach((mieszkanie) => {
            mapa.mieszkanieNewState = {id: mieszkanie.slug, state: mieszkanie.status};
          })
          }
        });
        }
        this.render();
      });
    },
    toggl(){
      this.state.visible = !this.state.visible;
      this.updateListener();
    },
    setMieszkanie(id){
     this.state.activeMieszkanie = id;
      this.render();
    },
    connected(){
      this.updateListener();
    },
  
    disconnected(){
      this.updateListener();
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
    render(){
      let mieszkanieRender = this.state.data ? this.state.data.filter((mieszkanie) => {
        return mieszkanie.slug == this.state.activeMieszkanie;
    })[0] : [];
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
        <div class="tooltip-column">
        <span>${mieszkanieRender ? mieszkanieRender.name : "" }</span>
        <span>${mieszkanieRender ? mieszkanieRender.area : ""} m²</span>
        </div>
        <div class="tooltip-column">
        <span>${ mieszkanieRender ? mieszkanieRender.rooms : ""} ${mieszkanieRender ? mieszkanieRender.rooms == 1 ? " pokój" : " pokoje" : ""}</span>
        <span>${mieszkanieRender ? mieszkanieRender.status : ""}</span>
        </div>
        </div>
    </div>
    `

    }
})