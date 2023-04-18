const express = require('express');
const SpotifyWebApi = require('spotify-web-api-node');
const app = express();
const port = 3000;
const http = require('http');
const server = http.createServer(app);
const io = require('socket.io')(server);

app.use(express.static('public'));

const spotifyApi = new SpotifyWebApi({
  clientId: 'CLIENT-ID',
  clientSecret: 'CLIENT-Secret',
  redirectUri: 'http://localhost:3000/callback'
});

spotifyApi.setAccessToken('AccessTokenHere');
spotifyApi.setRefreshToken('RefreshTokenHere');

// Refresh access token before it expires
spotifyApi.refreshAccessToken().then(data => {
  spotifyApi.setAccessToken(data.body.access_token);

  setInterval(() => {
    spotifyApi.refreshAccessToken().then(data => {
      spotifyApi.setAccessToken(data.body.access_token);

      spotifyApi.getMyCurrentPlayingTrack().then(data => {
        let track = 'No track currently playing.';
        let albumCover = './placeholder.jpg';
        let trackUrl = '';
        if (data.body.item) {
          track = `Song: ${data.body.item.name}\nArtist: ${data.body.item.artists.map(artist => artist.name).join(', ')}\nAlbum: ${data.body.item.album.name}`;
          albumCover = data.body.item.album.images[0].url;
          trackUrl = data.body.item.external_urls.spotify;
        }
        io.emit('currentTrack', { track, albumCover, trackUrl });
      }, error => {
        io.emit('currentTrack', { track: 'Something went wrong!', albumCover: '' });
      });
    }, error => {
      io.emit('currentTrack', { track: 'Something went wrong!', albumCover: '' });
    });
  }, 1000);
}).catch(error => {
  console.log('Something went wrong!', error);
});

app.use(express.static(__dirname + '/public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

app.get('/cover', (req, res) => {
  res.sendFile(__dirname + '/public/cover.html');
});

server.listen(port, () => {
  console.log('Server is listening on port',port);
});