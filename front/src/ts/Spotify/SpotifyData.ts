import SpotifyWebApi from 'spotify-web-api-js';

export class SpotifyData {
  accesstoken: string;
  spotifyWebApi: SpotifyWebApi.SpotifyWebApiJs;

  constructor(accessToken: string) {
    this.accesstoken = accessToken;
    this.spotifyWebApi = new SpotifyWebApi();
    this.spotifyWebApi.setAccessToken(this.accesstoken);
  }

  async getData() {
    const data = await Promise.all([
      this.spotifyWebApi.getMyTopArtists({
        limit: 50,
        offset: 0,
        time_range: 'medium_term',
      }),
      this.spotifyWebApi.getMyTopTracks({
        limit: 50,
        offset: 0,
        time_range: 'medium_term',
      }),
      await this.spotifyWebApi.getMe(),
    ]);

    return {
      name: data[2].display_name as string,
      id: data[2].id,
      artists: data[0].items.map((artist) => {
        return {
          id: artist.id,
          name: artist.name,
          genres: artist.genres,
          image: artist.images[0].url,
        };
      }),
      tracks: data[1].items.map((track) => {
        return {
          id: track.id,
          name: track.name,
          artists: track.artists.map((artist) => {
            return { id: artist.id, name: artist.name };
          }),
          album: {
            id: track.album.id,
            name: track.album.name,
            image: track.album.images[0].url,
          },
        };
      }),
    };
  }
}
