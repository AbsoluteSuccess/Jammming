const clientId = process.env.REACT_APP_APIKEY;
const redirectUri = 'http://localhost:3000/';
let accessToken;

const Spotify = {
    getAccessToken() {
        if(accessToken) {
            return accessToken;
        }

        const accessTokenMatch = window.location.href.match(/access_token=([^&]*)/);
        const expiresInMatch = window.location.href.match(/expires_in=([^&]*)/);
        
        if(accessTokenMatch && expiresInMatch){
            accessToken = accessTokenMatch[1];
            const expiresIn = Number(expiresInMatch[1]);
            window.setTimeout(() => accessToken = '', expiresIn * 1000);
            window.history.pushState('Access Token', null, '/');
        } else {
            const accessUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=token&scope=playlist-modify-public&redirect_uri=${redirectUri}`;
            window.location = accessUrl;
        }
    },
    
    async search(term) {
        const accessToken = Spotify.getAccessToken();
        const response = await fetch(`https://api.spotify.com/v1/search?type=track&q=${term}`, {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        });
        const jsonResponse = await response.json();
        if(!jsonResponse.tracks)
            return [];
        return await jsonResponse.tracks.items.map(track => ({
            id: track.id,
            name: track.name,
            artist: track.artists[0].name,
            album: track.album.name,
            uri: track.uri
        }))
    },

    async savePlaylist(name, trackUris) {
        if(!name || !trackUris.length){
            return;
        }
        const accessToken = Spotify.getAccessToken();
        const headers = {Authorization: `Bearer ${accessToken}`, 'Content-type': 'application/json'};
        let response = await fetch('https://api.spotify.com/v1/me', {headers: headers});
        let jsonResponse = await response.json();
        const userId = jsonResponse.id;
        response = await fetch(`https://api.spotify.com/v1/users/${userId}/playlists`, 
        {
            headers: headers,
            method: 'POST',
            body: JSON.stringify({name: name})
        });
        jsonResponse = await response.json();
        const playlistId = jsonResponse.id;
        return fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, 
        {
            headers: headers,
            method: 'POST',
            body: JSON.stringify({uris: trackUris})
        });
    }
};

export default Spotify;
