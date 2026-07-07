// Charm admin — click the charm image to set its join point (loop → wire).
// Writes normalized (x, y) into the anchor_x / anchor_y fields and shows a marker.
(function () {
  'use strict';

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  ready(function () {
    var picker = document.getElementById('charm-anchor-picker');
    var marker = document.getElementById('charm-anchor-marker');
    if (!picker || !marker) return;

    var inputX = document.getElementById('id_anchor_x');
    var inputY = document.getElementById('id_anchor_y');
    var img = picker.querySelector('img');

    function place(nx, ny) {
      marker.style.left = (nx * 100) + '%';
      marker.style.top = (ny * 100) + '%';
      marker.style.display = 'block';
    }

    // Show the existing point on load (from data attrs or the inputs).
    var ax = parseFloat((inputX && inputX.value) || picker.dataset.ax);
    var ay = parseFloat((inputY && inputY.value) || picker.dataset.ay);
    if (!isNaN(ax) && !isNaN(ay)) place(ax, ay);

    function round4(v) { return Math.round(v * 10000) / 10000; }

    picker.addEventListener('click', function (e) {
      var rect = img.getBoundingClientRect();
      var nx = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
      var ny = Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height));
      if (inputX) inputX.value = round4(nx);
      if (inputY) inputY.value = round4(ny);
      place(nx, ny);
    });
  });
})();
