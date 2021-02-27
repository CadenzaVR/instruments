function requireAll(req) {
  req.keys().forEach(req);
}

require("aframe-haptics-component");

requireAll(require.context("./components/", true, /\.js$/));
require("./game");
