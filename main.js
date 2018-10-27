const _ = require("lodash");
const Gpio = require("onoff").Gpio;
const switcher = new Gpio(4, "out");
const request = require("superagent");
const moment = require("moment");
const EventEmitter = require("events");
const emitter = new EventEmitter();

const TOKEN = reuqire("./privacy.json").token;  // 换成你自己的token
const FILE_KEY = reuqire("./privacy.json").file_key;  // 换成你的file key  
const url = "https://api.figma.com/v1/files/" + FILE_KEY + "/comments";
const local_data = {
  last_check_time: moment.utc(),
  check_interval: 5000,
  noti_duration: 4000,
  is_playing: false
};

let fetch = function() {
  request
    .get(url)
    .set("X-FIGMA-TOKEN", TOKEN)
    .set("Accept", "application/json")
    .then(res => {
      work_out_data(res.body);
    })
    .catch(err => {
      console.log("=====ERROR=====");
      console.log(err);
      console.log("===============");
    });
};

let work_out_data = function(data) {
  if (!data) return console.log("no data");
  let current_time = moment.utc();
  let comments = data.comments;
  let new_resolved_comments = _.filter(comments, cmt => {
    if (!cmt.resolved_at) return;
    let t = moment.utc(cmt.resolved_at);
    if (t.diff(local_data.last_check_time) > 0) return true;
  });
  local_data.last_check_time = current_time;
  new_resolved_comments.length && exaggeration();
};

let exaggeration = function() {
  if (!local_data.is_playing) emitter.emit("click");
  setTimeout(() => {
    emitter.emit("click");
  }, local_data.noti_duration);
};

emitter.on("click", () => {
  one_click()
    .then(() => {
      local_data.is_playing = !local_data.is_playing;
    })
    .catch(err => console.log(err));
});

let one_click = function() {
  return new Promise((res, rej) => {
    switcher.write(1, function() {
      setTimeout(() => {
        switcher.write(0, () => {
          res(true);
        });
      }, 200);
    });
  });
};

let main = function() {
  switcher.writeSync(0);
  setInterval(fetch, local_data.check_interval);
  process.on("SIGINT", function() {
    switcher.writeSync(0);
    switcher.unexport();
    process.exit();
  });
};
main();
