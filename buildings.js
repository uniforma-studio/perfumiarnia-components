import { define, svg } from "uce";


define("perfumiarnia-budynki", {
    extends: 'div',
    attachShadow: {mode: "open" },
    state: {
    image: undefined
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
            return pageContent;
          })
          .catch(function (err) {
            console.log("Failed to fetch page: ", err);
          });
        return dane;
      },
      imageMap(content) {
        return {
          id: content.id,
          data: svg([content.outerHTML]),
          kondygnacja: content.id !== "mapa",
          budynek: content.id !== "mapa" ? content.id.substring(0,1) : undefined,
          pietro: content.id !== "mapa" ? parseInt(content.id.substring(1)) - 1 : undefined
        };
      },
    activateTooltip(budynek,pietro){
      let tooltip = document.querySelector('perfumiarnia-tooltip');
      tooltip.setKondygnacja(budynek,pietro);
      tooltip.toggl(true);
    },
    deactivateTooltip(){
      let tooltip = document.querySelector('perfumiarnia-tooltip');
      tooltip.toggl(false);
    },
    getKondygnacja(id){
      let item = id.toLowerCase();
      let building = item.substring(0,1);
      let floor = item.substring(1);
      switch (building) {
        case 'a':
          return "ab"+floor;
        case 'b':
          return "ab"+floor;
        case 'c':
          return "cd"+floor;
        case 'd':
          return "cd"+floor;
        case 'e':
          return "ef"+floor;
        case 'f':
            return "ef"+floor;
        default:
            return "error: " + building;
            
      }
    },
    init(){
      const slots = this.slots();
      this.slots = slots;
      this.fetchData(this.slots.map.src+"?x-request=svg", '.kondygnacja, #mapa', "image/svg+xml")
      .then((imageData) => {
        return Array.prototype.map.call(imageData, this.imageMap);
      })
      .then((imageData) => {
        this.state.image = imageData;
        this.render();
      });
       
    },
   
    connected(){
    

      
    },
    disconnected(){},
  
    render(){
        let mapa = this.state.image.filter((item) => {
          return item.id == "mapa";
        })[0].data;
        let kondygnacje = this.state.image.filter((item) => {
            return item.kondygnacja === true;
        });
        let kondygnacjeRender = kondygnacje.map(item => svg.for(item)`
        <a class="kondygnacja" onMouseOut=${this.deactivateTooltip} onClick=${this.deactivateTooltip} onMouseOver=${() => this.activateTooltip(item.budynek,item.pietro)} href=${`/kondygnacje/${this.getKondygnacja(item.id)}`}">
        ${item.data}
        </a>
        `);
        this.html`
        <style>
        ${`
        :host{
          width: 100%;
          height: 100%;
        }
        .kondygnacja{
          color: transparent;
        }
        .kondygnacja:hover{
          color: #845D39;
          opacity:0.4;
        }
        `}
        </style>
        <svg  
          height="100%"
          width="100%"
          viewBox="0 0 2916 732"
          preserveAspectRatio="xMinYMid meet"
          xmlns="http://www.w3.org/2000/svg"
          stroke="none"
          stroke-width="1"
          fill="none"
          fill-rule="evenodd"
        >
        ${mapa}
        ${kondygnacjeRender}
        </svg>
        `;
    },
 


});



define("perfumiarnia-tooltip", {
  attachShadow: { mode: "open" },
  state: {
    visible: false,
    xPosition: 0,
    yPosition: 0,
    listenerActive: false,
    activeBuilding: "A",
    activeFloor: 2,
  },
  apartments: {
      /* Wszystkie, Zarezerwowane, Sprzedane */
    'A': [
        [4,0,0]  /* Parter */,
        [4,0,0]  /* Pierwsze */,
        [4,0,0]  /* Drugie */,
        [4,0,0]  /* Trzecie */,
        [4,0,0]  /* Czwarte */,
        [3,0,0]  /* Piąte */,
        
    ],
    'B': [
        [2,0,0]  /* Parter */,
        [4,0,0]  /* Pierwsze */,
        [5,0,0]  /* Drugie */,
        [5,0,0]  /* Trzecie */,
        [5,0,0]  /* Czwarte */,
        [5,0,0]  /* Piąte */,
        
    ],
    'C': [
        [5,0,0]  /* Parter */,
        [4,0,0]  /* Pierwsze */,
        [4,0,0]  /* Drugie */,
        [4,0,0]  /* Trzecie */,
        [4,0,0]  /* Czwarte */,
        [4,0,0]  /* Piąte */,
        
    ],
    'D': [
        [4,0,0]  /* Parter */,
        [4,0,0]  /* Pierwsze */,
        [4,0,0]  /* Drugie */,
        [4,0,0]  /* Trzecie */,
        [4,0,0]  /* Czwarte */,
        [3,0,0]  /* Piąte */,
        
    ],
    'E': [
        [3,0,0]  /* Parter */,
        [3,0,0]  /* Pierwsze */,
        [3,0,0]  /* Drugie */,
        [3,0,0]  /* Trzecie */,
        [3,0,0]  /* Czwarte */,
        [3,0,0]  /* Piąte */,
        
    ],
    'F': [
        [5,0,0]  /* Parter */,
        [4,0,0]  /* Pierwsze */,
        [4,0,0]  /* Drugie */,
        [4,0,0]  /* Trzecie */,
        [4,0,0]  /* Czwarte */,
        [3,0,0]  /* Piąte */,
        
    ],
  },
  init() {
    this.state.visible = false;
    this.render();
  },
  reserveApartment(building,floor){
    this.apartments[building][floor][0] -= 1;
    this.apartments[building][floor][1] += 1;
  },
  sellApartment(building,floor){
   this.apartments[building][floor][0] -= 1;
   this.apartments[building][floor][2] += 1; 
  },

  connected(){
    this.updateListener();

  },

  disconnected(){
    this.updateListener();
  },
  toggl(state){
    this.state.visible = state;
    this.updateListener();
  },
  setKondygnacja(budynek,pietro){
    this.state.activeBuilding = budynek;
    this.state.activeFloor = pietro;
    this.render();
  },
  getBuildingNumber(building){
    switch(building){
        case "A":
            return 1;
        case "B":
            return 1;
        case "C":
            return 2;
        case "D":
            return 2;
        case "E":
            return 3;
        case "F":
            return 4;
        default:
            return 0;
    }

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

  render() {
      let activeBuilding = this.state.activeBuilding;
      let activeFloor = this.state.activeFloor;
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
        <span>Budynek ${this.getBuildingNumber(activeBuilding)}</span>
        <span>Klatka ${this.state.activeBuilding}</span>
        <span>Piętro: ${this.state.activeFloor}</span>
        </div>
        <div class="tooltip-column">
        <span>Zarezerwowane: ${this.apartments[activeBuilding][activeFloor][1]}</span>
        <span>Sprzedane: ${this.apartments[activeBuilding][activeFloor][2]}</span>
        <span class="featured">Wolne: ${this.apartments[activeBuilding][activeFloor][0]}</span>
        </div>
        </div>
        </div>
        `;
  },
});


/*
define("uniforma-powitanie", {
  extends: "div",
  attachShadow: { mode: "open" },
  init() {
    const data = this.slots();
    console.log(data);
    this.data = data;
    console.log("ACTIVE: " + this.state.active);
    this.render();
  },
  render() {
    this.html`
      <p>Cześć ${this.data.name}</p>
      <p>AKTYWNY? ${this.state.active}</p>
    `;
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
  testnumber: 23,
  state: {
    active: "TAK",
    toggl: false,
  },
  observedAttributes: ["liczba"],
  // properly configured in the defined class prototype
  get test() {
    console.log("TEST IS ON");
    return this.testnumber;
  },

  set test(value) {
    console.log("NIEMORZLIWE");
    this.testnumber = value;
  },

  set active(value) {
    this.state.active = value;
    this.render();
  },

  sharedData: [1, 2, 3],

  nocotam() {
    return this.sharedData;
  },
});
*/