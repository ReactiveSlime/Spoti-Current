require('dotenv').config();
const http = require('http');
const url = require('url');
const SpotifyWebApi = require('spotify-web-api-node');
const port = 3000;

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: 'http://localhost:3000/callback' // Replace this with your own redirect URI
});

http.createServer((req, res) => {
  const requestUrl = url.parse(req.url, true);

  if (requestUrl.pathname === '/callback') {
    const code = requestUrl.query.code;
    spotifyApi.authorizationCodeGrant(code)
      .then((data) => {
        const { access_token, refresh_token, expires_in } = data.body;
        console.log(`Access token: ${access_token}`);
        console.log(`Refresh token: ${refresh_token}`);
        console.log(`Expires in: ${expires_in}`);
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.write('<html><body><p>Authorization code received. Check console for tokens.</p></body></html>');
        res.end();
      })
      .catch((err) => {
        console.log(`Error getting authorization code: ${err}`);
        res.writeHead(500, { 'Content-Type': 'text/html' });
        res.write('<html><body><p>Error getting authorization code. Check console for details.</p></body></html>');
        res.end();
      });
  } else {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.write(`<html><body><a href="${spotifyApi.createAuthorizeURL(['user-read-playback-state'], 'state')}">Authorize with Spotify</a></body></html>`);
    res.end();
  }
}).on('error', (err) => {
  console.error(`Server error: ${err}`);
}).listen(port, () => {
  console.log(`Server is listening on port ${port}`);
  console.log(`To authorize with Spotify, go to: http://localhost:${port}`);
});
