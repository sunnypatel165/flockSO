'use strict';

var Client = require('node-rest-client').Client;
var client = new Client();

// Keys are stringified userId-questionId pairs
// Values are the last activity time
var watcher = {};

var url = 'https://api.stackexchange.com/2.2/';
var questionAnswerUrlAppend = '?site=stackoverflow';

// This is the frequency at which we check for updates on the watcher
var updateIntervalInMilliseconds = 300000;

function getLastActivityTime(questionId) {
    var questionUrl = url + '/questions/' + questionId + questionAnswerUrlAppend;

    console.log(questionUrl);

    var lastActivityDate = 0;

    // TODO: This call is not blocking!
    // We need to use either futures/promises
    client.get(questionUrl, function (data, response) {
        lastActivityDate = data.items[0].last_activity_date;
        console.log("Last Activity Date - " + lastActivityDate);
    });

    return lastActivityDate;
}

function checkForUpdates(callback) {
    console.log("Checking for updates");

    console.log(watcher);

    for(var toWatchObj in watcher) {
        var currentTime = watcher[toWatchObj];

        console.log(toWatchObj);

        var questionId = toWatchObj.split(",")[1];
        var userId = toWatchObj.split(",")[0];

        console.log("Question id: " + questionId);

        var newTime = getLastActivityTime(questionId);

        console.log("Current known last activity time: " + currentTime);

        if (newTime > currentTime){
            console.log("There has been new activity on question " + questionId);

            // We call callback first because we want the user to be notified first
            // If we update the watcher, but the notification fails, the user will never know
            // that the question was updated!
            callback(userId, questionId);
            watcher[questionId] =  newTime;
        }
    }
}

module.exports = {

    getWatchList: function(userId){
        console.log("Inside getWatchList");
        var watchedQuestions = [];
        for(var toWatchObj in watcher) {
            console.log(toWatchObj);

            var questionId = toWatchObj.split(",")[1];
            var watchingUserId = toWatchObj.split(",")[0];

            if (watchingUserId === userId){
                watchedQuestions.push(questionId);
            }
        }
        return watchedQuestions;
    },
    addWatcher: function(userId, questionId) {
        console.log("Now watching for userId = " + userId + ", questionId = " + questionId);
        watcher[[userId, questionId]] = getLastActivityTime(questionId);
    },

    startWatcher: function (callback) {
        console.log("Starting watcher");
        setInterval(function() {
            checkForUpdates(callback);
        }, updateIntervalInMilliseconds);
    }
};
