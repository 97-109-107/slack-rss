var express = require('express');
var router = express.Router();
var Slack = require('slack-node');

/* GET home page. */

slack = new Slack(process.env.SLACK_API_KEY);

router.get('/', function(req, res, next) {
	slack.api('channels.list', function(err, response) {
		var channels = response.channels;
  	res.render('index', {
  	  	title: '',
  	  	address: req.headers.host,
  	  	channels: channels
  	});
	})
});

module.exports = router;
