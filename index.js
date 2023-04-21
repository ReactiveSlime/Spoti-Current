// Load environment variables from .env file
require('dotenv').config();

// Import required modules
const express = require('express');
const SpotifyWebApi = require('spotify-web-api-node');

// Create the Express app and the HTTP server
const app = express();
const http = require('http');
const server = http.createServer(app);

// Import and initialize Socket.io with the server
const io = require('socket.io')(server);

// Set the port number for the server
const port = process.env.PORT || 3000;

// Create a new instance of the SpotifyWebApi object
const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,         // Set the Spotify client ID
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET, // Set the Spotify client secret
  redirectUri: 'http://localhost:3000/callback'   // Set the callback URL for the authentication flow
});

// Function to refresh the access token for the Spotify API
function refreshAccessToken() {
  // Call the refreshAccessToken method on the SpotifyWebApi object
  spotifyApi.refreshAccessToken().then(data => {
    // If the access token is successfully refreshed, set it on the SpotifyWebApi object
    spotifyApi.setAccessToken(data.body.access_token);
    // Call this function again just before the access token expires
    setTimeout(refreshAccessToken, (data.body.expires_in - 60) * 1000);
  }).catch(error => {
    // If there is an error refreshing the access token, log the error and try again in 60 seconds
    console.error('Error refreshing access token:', error);
    setTimeout(refreshAccessToken, 60 * 1000);
  });
}

// Serve static files from the public directory
app.use(express.static('public'));

// Handle requests to the root URL
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

// Handle requests to the /cover URL
app.get('/cover', (req, res) => {
  res.sendFile(__dirname + '/public/cover.html');
});

// Handle Socket.io connections
io.on('connection', socket => {
  // Get the user's currently playing track from the Spotify API
  spotifyApi.getMyCurrentPlayingTrack().then(data => {
    // Extract the track information from the API response and emit it to the client
    let track = 'No track currently playing.';
    let albumCover = './placeholder.jpg';
    let trackUrl = '';
    if (data.body.item) {
      track = `Song: ${data.body.item.name}\nArtist: ${data.body.item.artists.map(artist => artist.name).join(', ')}\nAlbum: ${data.body.item.album.name}`;
      albumCover = data.body.item.album.images[0].url;
      trackUrl = data.body.item.external_urls.spotify;
    }
    socket.emit('currentTrack', { track, albumCover, trackUrl });
  }).catch(error => {
    // If there is an error getting the currently playing track, emit an error message to the client
    console.error('Error getting current playing track:', error);
    socket.emit('currentTrack', { track: 'Error getting current playing track!', albumCover: '' });
  });
});

// This code sets an interval of 1 second to get the current playing track of the user from Spotify API
setInterval(() => {
  // Call Spotify API to get the current playing track of the user
  spotifyApi.getMyCurrentPlayingTrack().then(data => {
    // Initialize variables for the track name, album cover and track url
    let track = 'No track currently playing.';
    let albumCover = './placeholder.jpg';
    let trackUrl = '';

    // Check if the user is currently playing a track
    if (data.body.item) {
      // Set the track name to the track name, artist name and album name
      track = `Song: ${data.body.item.name}\nArtist: ${data.body.item.artists.map(artist => artist.name).join(', ')}\nAlbum: ${data.body.item.album.name}`;
      // Set the album cover to the first image in the album's images array
      albumCover = data.body.item.album.images[0].url;
      // Set the track url to the Spotify external url for the track
      trackUrl = data.body.item.external_urls.spotify;
    }
    // Emit the current track information to all connected sockets
    io.emit('currentTrack', { track, albumCover, trackUrl });
  }).catch(error => {
    console.error('Error getting current playing track:', error);
    // If there is an error getting the current playing track, emit an error message to all connected sockets
    io.emit('currentTrack', { track: 'Error getting current playing track!', albumCover: '' });
  });
}, 1000);

// Start the server listening on the specified port
server.listen(port, () => {
  console.log(`Server is listening on port ${port}`);

  // Set the access token and refresh token for the Spotify API object
  spotifyApi.setAccessToken(process.env.SPOTIFY_ACCESS_TOKEN);
  spotifyApi.setRefreshToken(process.env.SPOTIFY_REFRESH_TOKEN);

  // Call the function to refresh the access token periodically
  refreshAccessToken();
});
