const functions = require("firebase-functions");
const config = process.env.NODE_ENV === 'production' ? functions.config().env : require('./config');
const admin = require("firebase-admin");
const fetch = require('node-fetch');
const TwitterClient = require('twitter-api-client').TwitterClient;
const twitterClient = new TwitterClient(config.twitter);
admin.initializeApp();

exports.hourlyTweetCron = functions.pubsub.schedule('*/30 * * * *').onRun(async (context) => {
  const tweetIds = await tweetCommentLink()
  console.log(`Added Comment to ${tweetIds.length} tweets.`);
  return null;
});

exports.addCommentToTweetsHttp = functions.https.onRequest(async (request, response) => {
  const tweetIds = await tweetCommentLink()
  response.send(`Added Comment to ${tweetIds.length} tweets.`);
});

exports.tweetCommentOnCreate = functions.firestore
.document('tweets/{docId}')
.onCreate(async (snap, context) => {
    const { hnId, tweetId, tweetText} = snap.data()
    const COMMENTS = [
      'Here is the link to the discussion!',
      'You can find the comments link here:',
      'See what the Hacker News Community is saying:',
      'HN Comments Link:',
      'Comments on Hacker News:',
      'Link to comments:',
    ];
    const comment = COMMENTS[Math.floor(Math.random() * COMMENTS.length)]
    const link = `https://news.ycombinator.com/item?id=${hnId}`
    const fullComment = `${comment} ${link}`
    const newTweet = {
      status: fullComment,
      in_reply_to_status_id: tweetId,
      auto_populate_reply_metadata: true,
    }

    if (process.env.NODE_ENV === 'production') {
      await twitterClient.tweets.statusesUpdate(newTweet)
    } else {
      console.log('In Development, not posting real tweet.')
    }
    console.log(`Tweeted Comment for Tweet ${tweetId} - "${tweetText}"`)
    return null
});

async function getHNIdByName(text) {
  const storyTitle = text.replace(/(?:https?|ftp):\/\/[\n\S]+/g, '');
  const objectId = await fetch(`http://hn.algolia.com/api/v1/search_by_date?query=${storyTitle}&tags=story`)
    .then(res => res.json())
    .then(res => {
      if (!res || res.hits.length === 0) {
        throw 'No results found!'
      }
      return res.hits[0].objectID
    })
    .catch((e) => {
      console.log(e)
      return null
    })
  
  return objectId
}

async function tweetCommentLink() {
  const foundTweets = []
  const tweets = await twitterClient.tweets.statusesUserTimeline({
      screen_name: 'newsycombinator', 
      count: 5, 
      trim_user: true, 
      exclude_replies: true,
      tweet_mode: 'extended',
  });
  
  for (let tweet of tweets) {
    const tweetId = tweet.id_str
    const tweetText = tweet.full_text
    const tweetDoc =  await admin.firestore().doc(`tweets/${tweetId}`).get()
    if (tweetDoc.exists) { continue }

    const hnId = await getHNIdByName(tweetText)
    if (!hnId) { continue }

    await admin.firestore().doc(`tweets/${tweetId}`).set({tweetId, tweetText, hnId})
    foundTweets.push(tweetId)
  }

  return foundTweets
}
