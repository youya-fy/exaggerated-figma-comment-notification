const Gpio = require("onoff").Gpio;
const led = new Gpio(4, "out");

led.writeSync(1);
setTimeout(()=>{
    led.writeSync(0)
},300)