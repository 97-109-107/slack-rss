## Changes
This is a fork of [gozmike's source version](https://github.com/gozman/slack-rss). Simply put, this app lifts urls from Slack chats and serves them in RSS feeds per each channel.

I have encounter what I thought was an edge case here https://github.com/gozman/slack-rss/issues/2 and decided to use [embedly's api](http://docs.embed.ly/docs/oembed) to process any links that appear in message text. This requires their api key (refer to ``app.json``)

For general usage please refer to the source or the ``README.old.md`` file.

<a href="https://heroku.com/deploy?template=https://github.com/97-109-107/slack-rss/tree/master">Deploy to heroku button</a>
