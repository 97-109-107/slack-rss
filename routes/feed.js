var express = require('express');
var router = express.Router();
var async = require('async');
var rss = require('rss');
var getUrls = require('get-urls');
var util = require('util');
var embedly = require('embedly');
var _ = require('lodash');
var Slack = require('slack-node');
var ignoredSubtypes = ["file_share","bot_message","channel_join"]

router.get('/:channel_name', function(req, res, next) {
	console.log("-----")
	slack = new Slack(process.env.SLACK_API_KEY);

	slack.api('channels.list', function(err, response) {
		for(var c=0; c< response.channels.length; c++) {
			var channel = response.channels[c];

			if(channel.name == req.params.channel_name){
				var feed = new rss({
					title:"#" + channel.name,
					description:"The links that have been posted to the #"+channel.name +" on Slack",
					site_url: '',
					ttl: '30',
				});

				//Filter messages
				function getHistory(callback){
					var output = [];
					slack.api('channels.history', {'channel':channel.id,'count':process.env.HISTORY_LENGTH}, function(err, response){
						async.eachLimit(response.messages, 1, function(thisMessage, callback) {
							if(!_.includes(ignoredSubtypes, thisMessage.subtype)){
    							output.push(thisMessage)
    							callback(null);
  							}else{
  								callback(null);
  							}
						}, function(err){
    						if(err){
      							console.log(err);
    						}
    						console.log('will pass forward ' + output.length + ' message objects');
    						callback(null, output);
						});
					});
				}

				function filterUrls(messages, callback){
					var output = [];
					async.eachLimit(messages, 1, function(thisMessage, callback) {
						thisMessage.text = thisMessage.text.replace("<","");
						thisMessage.text = thisMessage.text.replace(">","");
						var urls = getUrls(thisMessage.text);

						if(urls.length > 0){
							thisMessage.ts = new Date(thisMessage.ts * 1000);
							thisMessage.url = urls[0]
    						output.push(thisMessage)
    						callback(null);
						}else{
  							callback(null);
  						}

					}, function(err){
    					if(err){
      						console.log(err);
    					}
    					console.log('will pass forward ' + output.length + ' message objects w/ links');
    					callback(null, output);
					});
				}

				//Process messages which contain links asyncly
				function addItemToFeed(messages, callback){
					async.eachLimit(messages, 1, function(thisMessage, callback) {

						new embedly({key: process.env.EMBEDLY_API_KEY}, function(err, api) {
  							api.oembed({url: thisMessage.url}, function(err, extracted) {
  								extracted = extracted[0]
    							if (err) {
    								callback(err.stack);
    							}else{
    								if(extracted.error_code == undefined || extracted.error_code != 404){
    									console.log('adding feed item of title', extracted.title);

										feed.item({
											title: extracted.title || extracted.type + " " + extracted.provider_name,
											description: extracted.description,
											url: thisMessage.url,
											date: thisMessage.ts
										});
    									callback(null);
    								}else{
    									callback(null);
    								}
    							}
  							});
						});

					}, function(err){
    					if(err){
      						console.log(err);
    					}
    					callback(null);
					});


				}

				async.waterfall([
    				getHistory,
    				filterUrls,
    				addItemToFeed
					], function (err){
						if(err){
							console.log(err);
						}else{
							res.send(feed.xml({indent: true}));
						}
					});

			}
		}
	});
});

module.exports = router;
