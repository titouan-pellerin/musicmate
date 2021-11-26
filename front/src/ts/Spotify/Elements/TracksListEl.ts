export class TracksListEl {
  tracksEl: HTMLUListElement;
  constructor(tracks: SpotifyApi.TrackObjectFull[]) {
    this.tracksEl = document.createElement('ul');
    this.tracksEl.classList.add('tracks-list');
    if (tracks.length === 0) {
      const nameEl = document.createElement('h3');
      nameEl.textContent = 'Too bad, no track in common';
      nameEl.classList.add('text-only');

      const infoEl = document.createElement('div');
      infoEl.classList.add('track-info');
      infoEl.appendChild(nameEl);

      const trackEl = document.createElement('li');
      trackEl.appendChild(infoEl);
      this.tracksEl.appendChild(trackEl);
    } else
      tracks.forEach((track) => {
        const nameEl = document.createElement('h3');
        nameEl.textContent = track.name;

        const artistsEl = document.createElement('h4');
        artistsEl.textContent = track.artists.map((artist) => artist.name).join(', ');

        const infoEl = document.createElement('div');
        infoEl.classList.add('track-info');
        infoEl.appendChild(nameEl);
        infoEl.appendChild(artistsEl);

        const imgEl = document.createElement('img');
        imgEl.src = track.album.images[0].url;

        const trackEl = document.createElement('li');
        trackEl.appendChild(imgEl);
        trackEl.appendChild(infoEl);
        trackEl.id = track.id;
        this.tracksEl.appendChild(trackEl);
      });
  }
}