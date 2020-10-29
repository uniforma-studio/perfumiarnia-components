import {define} from 'wicked-elements';

function clickGenerator(arrow, time) {
    if (!arrow) console.log("THERE IS NO SLIDER INSIDE");
    if (isNaN(time)) console.log("TIME IS NOT A PROPER VALUE");
    function clickArrow(){
        arrow.click();
        setTimeout(clickArrow,time);
    }
    return setTimeout(clickArrow,time);
}

define(".k_slider-container", {
connected() {
    let arrow = this.element.querySelector(".w-slider-arrow-right")
    let time = parseInt(this.element.getAttribute("slider-delay"));
    clickGenerator(arrow,time);
}
})