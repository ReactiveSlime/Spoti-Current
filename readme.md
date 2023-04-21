**Spoti-Current**

You will need to create a new app in the [spotify dashboard](https://developer.spotify.com/dashboard/create). The info can be what ever you want except for the "Redirect URI" that will need to be http://localhost:3000/callback

You will also need the following moduals installed
[spotify-web-api-node](https://github.com/thelinmichael/spotify-web-api-node#installation), [dotenv](https://www.npmjs.com/package/dotenv)

Once install you will need to cd into the folder and `node ./setup.js`
You will be prompted to authorize with spotify and once done you will recive a Access Token and a Refresh Token in console.
You will need to put them in index.js with your Client ID and Secret from the spotify dashboard
