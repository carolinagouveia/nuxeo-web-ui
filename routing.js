customElements.whenDefined('nuxeo-app').then(function() {

  var app = document.querySelector('nuxeo-app');

  // strip final /
  page.base(app.baseUrl.replace(/\/$/, ''));

  // Middleware
  function scrollToTop(ctx, next) {
    next();
  }

  // Routes
  page('*', scrollToTop, function(ctx, next) {
    next();
  });

  page('/', function() {
    page.redirect('/home');
  });

  page('/home', function() {
    app.show('home');
  });

  page('/browse', function() {
    app.load('browse', '', '/', 'view');
  });

  // /browse/<path>@<action>
  page(/^\/browse\/(.*)?/, function(data) {
    if (!data.state.contentView) {
      app.currentContentView = null;
    }
    var searchParams = new URLSearchParams(data.querystring);
    app.load('browse', '', '/' + data.params[0], searchParams.get('p') || 'view');
  });

  page('/search/:searchName', function(data) {
    // trigger search when navigating to it directly
    if (page.len === 0) {
      app._searchOnLoad = true;
    }
    app.searchName = data.params.searchName;
    app.show('search');
  });

  page('/doc/:repo?/:id/', function(data) {
    if (!data.state.contentView) {
      app.currentContentView = null;
    }
    app.load('browse', data.params.id, '', 'view');
  });

  page('/admin/:tab?', function(data) {
    // prevent currentUser from being undefined
    app.$.nxcon.connect().then(function() {
      // block access to admin center to non-admin/non-power users
      var hasPermission = app.currentUser.isAdministrator || app.currentUser.extendedGroups.find(function(grp) {
        return grp.name === 'powerusers';
      });
      if (hasPermission) {
        if (data.params.tab) {
          app.selectedAdminTab = data.params.tab;
        }
        app.entity = {};
        app.show('admin');
      } else {
        app.showError(404, '', data.path);
      }
    });
  });

  page('/admin/user-group-management/:type/:id(.*)', function(data) {
    app.selectedAdminTab = 'user-group-management';
    app.entity = {type: data.params.type, id: data.params.id};
    app.show('admin');
  });

  page('/user/:id', function(data) {
    page.redirect('/admin/user-group-management/user/' + data.params.id);
  });

  page('/group/:id(.*)', function(data) {
    app.entity = {type: 'group', id: data.params.id};
    page.redirect('/admin/user-group-management/group/' + data.params.id);
  });

  page('/tasks/:repo?/:id/', function(data) {
    app.loadTask(data.params.id);
  });

  page('/tasks', function() {
    app.loadTask();
  });

  page('/diff/:id1/:id2', function(data) {
    app.showDiff(data.params.id1, data.params.id2);
  });

  page('/:page', function(ctx) {
    app.show(ctx.params.page);
  });

  page('*', function(ctx) {
    app.showError(404, '', ctx.path);
  });

  // add #! before urls
  page({hashbang: true, click: false, decodeURLComponents: false});

  app.router = {

    baseUrl: app.baseUrl,

    useHashbang: true,

    browse: function(path, subPage) {
      return '/browse' +  (path ? path.split('/').map(function(n) {
        return encodeURIComponent(n);
      }).join('/') : '') + (subPage ? '?p=' + encodeURIComponent(subPage) : '');
    },

    document: function(id) {
      return '/doc/' + id;
    },

    home: function() {
      return '/home';
    },

    search: function(searchId) {
      return '/search/' + searchId;
    },

    queue: function(searchId) {
      return '/queue/' + searchId;
    },

    tasks: function(id) {
      return '/tasks' + (typeof id === 'undefined' ? '' : '/' + id);
    },

    administration: function(tab) {
      return '/admin/' + tab;
    },

    user: function(name) {
      return '/user/' + name;
    },

    group: function(name) {
      return '/group/' + name;
    },

    diff: function(id1, id2) {
      return '/diff/' + id1 + '/' + id2;
    },

    page: function(name) {
      return '/' + name;
    },

    navigate: page

  };

});
