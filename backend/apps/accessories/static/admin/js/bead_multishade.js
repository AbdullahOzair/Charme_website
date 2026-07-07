// Bead admin — show the multi-shade sub-fields only when "Is multi shade" is ticked.
// Also auto-ticks "Use real photo" the first time multi-shade is enabled.
(function () {
  'use strict';

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  ready(function () {
    var checkbox = document.getElementById('id_is_multi_shade');
    if (!checkbox) return;

    // The .form-row wrappers for the fields we want to toggle.
    var rowNames = ['use_real_photo', 'texture_style', 'shade_colors', 'shade_preview'];

    function rowFor(name) {
      // Django renders each field row as <div class="form-row field-<name>">
      return document.querySelector('.form-row.field-' + name);
    }

    var useRealPhoto = document.getElementById('id_use_real_photo');
    var touchedRealPhoto = false;
    if (useRealPhoto) {
      useRealPhoto.addEventListener('change', function () { touchedRealPhoto = true; });
    }

    function sync() {
      var on = checkbox.checked;
      rowNames.forEach(function (name) {
        var row = rowFor(name);
        if (row) row.style.display = on ? '' : 'none';
      });
      // Convenience: enabling multi-shade auto-enables real-photo rendering
      // (only if the admin hasn't manually changed it).
      if (on && useRealPhoto && !touchedRealPhoto && !useRealPhoto.checked) {
        useRealPhoto.checked = true;
      }
    }

    checkbox.addEventListener('change', sync);
    sync();
  });
})();
