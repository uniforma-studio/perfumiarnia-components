import { define, svg } from "uce";

/**
 * Defines the kondygnacja-mapa component.
 */
define("kondygnacja-mapa", {
  extends: "div",
  attachShadow: { mode: "open" },
  state: {
    image: [],
    dataInitialized: false,
    header: "0 0 1328 1329",
    activeMieszkanie: null, // Active apartment ID
    mapaPng: '', // State for the PNG map
  },
  external: {
    newState: {}
  },
  
  /**
   * Initializes the component and fetches the PNG map URL and apartment data.
   */
  init() {
    this.fetchAndSetMapaPng(); // Fetch the PNG URL from the background slot
    this.fetchMieszkaniaData(); // Fetch the apartment data
  },

  /**
   * Fetches the PNG URL from the "background" slot and sets it in the state.
   */
  fetchAndSetMapaPng() {
    const slots = this.slots();
    const backgroundSlot = slots.background; // Get the background slot element

    if (backgroundSlot) {
      const pngUrl = backgroundSlot.getAttribute('src'); // Assuming the URL is stored in a 'src' attribute
      if (pngUrl) {
        this.setMapaPng(pngUrl); // Call setMapaPng with the fetched URL
      } else {
        console.error("No URL found in the background slot.");
      }
    } else {
      console.error("Background slot not found.");
    }
  },

  /**
   * Collects and returns all elements with a slot attribute.
   * @returns {Object} An object mapping slot names to their corresponding elements.
   */
  slots() {
    const data = {};
    this.querySelectorAll("[slot]").forEach((el) => {
      data[
        el.getAttribute("slot").replace(/-(\w)/g, ($0, $1) => $1.toUpperCase())
      ] = el;
    });
    return data;
  },

  /**
   * Sets the PNG URL directly to the state.
   * @param {string} pngUrl - The URL of the PNG map.
   */
  setMapaPng(pngUrl) {
    this.state.mapaPng = pngUrl; // Directly set the PNG URL
    this.render();
  },

  /**
   * Fetches the apartment data.
   */
  fetchMieszkaniaData() {
    const slots = this.slots();
    return this.fetchData(slots.map.src + "?x-request=svg", "g[fill='currentColor']", "image/svg+xml").then((mieszkaniaData) => {
      this.state.image = mieszkaniaData; // Directly assign fetched data without modifying fill
      this.render();
    });
  },

  /**
   * Fetches data from a given address and parses it as HTML.
   * @param {string} adress - The URL to fetch data from.
   * @param {string} tag - The tag to query in the fetched HTML.
   * @param {string} header - The content type of the response.
   * @returns {Promise} A promise that resolves to the parsed data.
   */
  fetchData(adress, tag, header) {
    let dane = fetch(adress)
      .then(response => response.text())
      .then(html => {
        let parser = new DOMParser();
        let doc = parser.parseFromString(html, header);
        let pageContent = doc.querySelectorAll(tag);
        let boxHeader = doc.querySelector('svg').attributes.viewBox.value;
        return [pageContent, boxHeader];
      })
      .catch(err => {
        console.log("Failed to fetch page: ", err);
      });
    return dane;
  },

  /**
   * Maps the content of an SVG element to a structured object.
   * @param {Element} content - The SVG element to map.
   * @returns {Object} An object containing the mapped data.
   */
  imageMap(content) {
    return {
      id: content.id,
      data: svg([content.outerHTML]),
      mieszkanie: content.id !== "mapa",
      stan: "dostępne"
    };
  },

  /**
   * Changes the state of a specific apartment.
   * @param {string} id - The ID of the apartment to change.
   * @param {string} newStan - The new state to set for the apartment.
   */
  mieszkanieChangeState(id, newStan) {
    let apartment = this.state.image.filter(item => item.id == id);
    apartment[0].stan = newStan;
    this.render();
  },

  /**
   * Sets the new state for an apartment based on the provided value.
   * @param {Object} value - An object containing the apartment ID and new state.
   */
  set mieszkanieNewState(value) {
    if (!this.state.dataInitialized) {
      this.external.newState[value.id] = value.state;
    } else {
      let apartment = this.state.image.filter(item => item.id == value.id);
      apartment[0].stan = value.state;
      this.render();
    }
  },

  /**
   * Activates the tooltip for a specific apartment.
   * @param {string} id - The ID of the apartment to activate the tooltip for.
   */
  activateTooltip(id) {
    let tooltip = document.querySelector('kondygnacja-tooltip');
    tooltip.setMieszkanie(id);
    tooltip.toggl();
  },

  /**
   * Deactivates the currently active tooltip.
   */
  deactivateTooltip() {
    let tooltip = document.querySelector('kondygnacja-tooltip');
    tooltip.toggl();
  },

  /**
   * Maps the state of an apartment to a human-readable format.
   * @param {string} state - The state of the apartment.
   * @returns {string} A string representing the mapped state.
   */
  stateSwitch(state) {
    switch (state) {
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

  /**
   * Retrieves the "mapa" data for rendering.
   * @returns {string} The SVG data for the map.
   */
  getMapaData() {
    return this.state.image.filter(item => item.id === "mapa")[0]?.data || '';
  },

  /**
   * Retrieves the rendered apartments based on the active apartment ID.
   * @returns {Array} An array of rendered apartment elements.
   */
  getMieszkaniaRender() {
    const activeMieszkanie = this.state.activeMieszkanie;
    const mieszkania = this.state.image.filter(item => item.mieszkanie === true);
    
    return mieszkania.map(item => {
      if (item.id === activeMieszkanie) {
        return svg.for(item)`
          <a class="${this.stateSwitch(item.stan)}" onMouseOut=${this.deactivateTooltip} onMouseOver=${() => this.activateTooltip(item.id)} href=${`/mieszkania/${item.id}`}>
            ${item.data}
          </a>
        `;
      }
      return '';
    });
  },

  /**
   * Sets the active apartment ID for the tooltip.
   * @param {string} id - The ID of the apartment to set as active.
   */
  setActiveMieszkanie(id) {
    this.state.activeMieszkanie = id;
    this.render();
  },

  /**
   * Renders the component's HTML based on the current state.
   */
  render() {
    const mieszkaniaRender = this.getMieszkaniaRender();
    const viewBox = this.getMapaData().viewBox; // Fetch the viewBox from the SVG data
    const [minX, minY, width, height] = viewBox.split(' ').map(Number); // Parse the viewBox values

    this.html`
      <style>
        :host {
          width: 100%;
          height: 100%;
          padding-right: 64px;
        }
        .zarezerwowane {
          color: rgba(0, 0, 0, 0.5) !important;
        }
        .mieszkanie {
          color: #845D39;
        }
        .sprzedane {
          color: transparent !important;
          pointer-events: none !important;
        }
        .mieszkanie * {
          opacity: 0.4 !important;
        }
        .mieszkanie:hover * {
          opacity: 0.5 !important;
        }
      </style>
      
      <svg viewBox="${viewBox}" width="100%" height="auto">
        <image href="${this.state.mapaPng}" x="${minX}" y="${minY}" width="${width}" height="${height}" preserveAspectRatio="xMidYMid meet" />
        ${mieszkaniaRender}
      </svg>
    `;
  }
});

/**
 * Defines the kondygnacja-tooltip component.
 */
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
    init() {
      this.fetchDataAndProcess();
    },

    fetchDataAndProcess() {
      this.fetchData(this.props.data, ".w-dyn-item", "text/html")
        .then((data) => this.processFetchedData(data))
        .then(() => this.render());
    },

    processFetchedData(data) {
      return Array.prototype.map.call(data, this.metaMap).then((meta) => {
        this.state.data = meta;
        this.updateMapaState();
      });
    },

    updateMapaState() {
      let mapa = document.querySelector('[is=kondygnacja-mapa]');
      if (mapa !== null) {
        this.state.data.forEach((mieszkanie) => {
          mapa.mieszkanieNewState = { id: mieszkanie.slug, state: mieszkanie.status };
        });
      } else {
        document.addEventListener('readystatechange', () => {
          let mapa = document.querySelector('[is=kondygnacja-mapa]');
          if (document.readyState === "complete") {
            this.state.data.forEach((mieszkanie) => {
              mapa.mieszkanieNewState = { id: mieszkanie.slug, state: mieszkanie.status };
            });
          }
        });
      }
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