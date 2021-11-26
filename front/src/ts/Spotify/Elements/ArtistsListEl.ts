export class ArtistsListEl {
  artistsEl: HTMLUListElement;
  constructor(artists: SpotifyApi.ArtistObjectFull[]) {
    this.artistsEl = document.createElement('ul');
    this.artistsEl.classList.add('artists-list');

    if (artists.length === 0) {
      const artistEl = document.createElement('li');
      const nameEl = document.createElement('h3');
      nameEl.classList.add('text-only');

      nameEl.textContent = 'Too bad, no artist in common';
      artistEl.appendChild(nameEl);
      this.artistsEl.appendChild(artistEl);
    } else
      artists.forEach((artist) => {
        const artistEl = document.createElement('li');
        const nameEl = document.createElement('h3');
        nameEl.textContent = artist.name;
        const imgEl = document.createElement('img');
        imgEl.src = artist.images[0].url;
        artistEl.appendChild(imgEl);
        artistEl.appendChild(nameEl);
        artistEl.id = artist.id;
        this.artistsEl.appendChild(artistEl);
      });
  }
}