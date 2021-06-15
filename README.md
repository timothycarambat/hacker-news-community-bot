# HACKER NEWS @newsycombinator COMMUNITY COMMENTER BOT
This is a bot that comments the community URL of the @newsycombinator account posts. This account is the primary hacker news account and the operator has stated they will not put the community discussion in the links. I am not sure why but much like Reddit, I go for the comments so here it it. I also spend most of my time on Twitter so this is where I see stuff first.


Some notes:
- This grabs the 5 most recent tweets of the account
- The cron task collects them and inserts them into the firestore DB
- the firestore DB has an onCreate trigger that will shoot off the actaul tweet.
- You will need a twitter app with Read/Write permissions and login as the Twitter user you want to tweet as to get OAuth.

### Development
`npm install`
Place the correct credentials into the `env.json` file using `env.example.json` as a template.
`npm run start` - will start firebase services for functions and firestore.

### Deploy
`npm run deploy` - Will copy env.json to firebase configs and have them available in production & push to production.