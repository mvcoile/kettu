Settings = function(transmission) { with(transmission) {
  var context, original_settings;

  before(function() {
    context = this;
  });

  get('#/settings', function() {
    var request = { 'method': 'session-get', 'arguments': {} };

    context.remote_query(request, function(new_settings) {
      original_settings = new_settings;
      new_settings['reload-interval'] = context.reload_interval/1000;

      context.partial('./templates/settings/index.mustache', new_settings, function(rendered_view) {
        context.openInfo(rendered_view);
        trigger('settings-refreshed');
      });
    });
  });

  updateSettings = function() {
    var request = { 'method': 'session-get', 'arguments': {} };

    context.remote_query(request, function(new_settings) {
      var differences = context.hash_diff(original_settings, new_settings);
      if(differences) {
        for(difference in differences) {
          if(typeof(differences[difference]) == 'boolean') {
            $('.' + difference).attr('checked', differences[difference]);
          } else {
            $('.' + difference).val(differences[difference]);
          }
        }
        original_settings = new_settings;
      }
    });
  }

  put('#/settings', function() {
    var request = { 'method': 'session-set', 'arguments': this.prepare_arguments(context, this.params) };

    this.manage_handlers(context, this.params);

    if(this.is_speed_limit_mode_update(request['arguments']) || this.setting_arguments_valid(context, $.extend(request['arguments'], {'reload-interval': this.params['reload-interval']}))) {
      delete(request['arguments']['reload-interval']);
      context.remote_query(request, function(response) {
        trigger('flash', 'Settings updated successfully.');
        if(context.params['peer-port']) { updatePeerPortDiv(context); }
        if(context.params['reload-interval']) { context.update_reload_interval(context, context.params['reload-interval']); }
      });
    } else {
      trigger('flash', 'Settings could not be updated.');
      trigger('errors', this.setting_arguments_errors(context));
    }
  });

  updatePeerPortDiv = function(context) {
    $('#port-open').addClass('waiting');
    $('#port-open').show();
    var request = { 'method': 'port-test', 'arguments': {} };
    context.remote_query(request, function(response) {
      $('#port-open').removeClass('waiting');
      if(response['port-is-open']) {
        $('#port-open').addClass('active');
      } else {
        $('#port-open').removeClass('active');
      }
    });
  };

  bind('settings-refreshed', function() {
    context.updateSettingsCheckboxes(original_settings);
    context.updateSettingsSelects(original_settings);
    context.menuizeInfo();

    if(context.settings_interval_id) { clearInterval(context.settings_interval_id); }
    context.settings_interval_id = setInterval('updateSettings()', context.reload_interval);
  });
}};