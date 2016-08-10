"use strict";

angular.module('myApp',[]);

angular.module('myApp').service('AppModel', function($http, $rootScope) {

  var self = this;

  this.tasks = [];
  this.description = '';
  this.isAuthenticated = false;
  this.isDirty = false;

  this.getTasks = function(user) {

      $http.get('http://localhost:3000/real-time/api/v1/tasks', user)
          .then(function(response) {
              this.tasks = response.data;
          }.bind(this),
          function(response) {
            alert('An error occurred.' + response.data.message);
          });

  };

  this.createTask = function(task) {
    $http.post('http://localhost:3000/real-time/api/v1/tasks', task)
      .then(function(response) {
          task = _.merge(task, response.data);
          // this.tasks.push(task);
          this.description = '';
        }.bind(this),
        function(response) {
          alert('An error occurred.' + response.data.message);
        });
  };

  this.updateTask = function(task) {
    if (!this.isDirty) {
      return;
    }
    this.isDirty = false;
    $http.put('http://localhost:3000/real-time/api/v1/tasks/' + task.id, task)
      .then(function(response) {
          // task = _.merge(task, response.data);
        }.bind(this),
        function(response) {
          alert('An error occurred.' + response.data.message);
        });
  };

  this.deleteTask = function(taskId) {
    $http.delete('http://localhost:3000/real-time/api/v1/tasks/' + taskId)
      .then(function(response) {
          //this.tasks = _.remove(this.tasks, function(task) {
          //  return task.id !== taskId;
          //});
        }.bind(this),
        function(response) {
          alert('An error occurred.' + response.data.message);
        });
  };


  this.changeTaskStatus = function(task) {
    this.updateTask(task);
  };

  this.handleCreateEvent = function(data) {
    if (data.type === 'task') {
      self.tasks.push(data.item);
    }
    $rootScope.$apply();
  };

  this.handleUpdateEvent = function(data) {
    if (data.type === 'task') {
      var task = _.find(self.tasks, { id: data.item.id });
      _.merge(task, data.item);
    }
    $rootScope.$apply();
  };

  this.handleDeleteEvent = function(data) {
    if (data.type === 'task') {
      self.tasks = _.remove(self.tasks, function(task) {
        return task.id !== Number(data.item.id);
      });
    }
    $rootScope.$apply();
  };

  this.login = function() {
    var self = this;
    $http.post('http://localhost:3000/real-time/api/v1/login', { email: this.email, password: this.password })
      .then(function(response) {
          this.isAuthenticated = true;
          this.user = response.data;
          $http.defaults.headers.common.Authorization = this.user.authorization;
          this.getTasks();

          // Make the connection
          var socket = io.connect( 'http://localhost:4000', { query: 'token=' + this.user.authorization + '&user_id=' + this.user.id } );
          socket.on('CREATE', this.handleCreateEvent);
          socket.on('UPDATE', this.handleUpdateEvent);
          socket.on('DELETE', this.handleDeleteEvent);

        }.bind(this),
        function(response) {
          alert('An error occurred.' + response.data.message);
        });
  }
});

angular.module('myApp').controller('MainController', ['AppModel', function(AppModel) {
    this.model = AppModel;
}]);
