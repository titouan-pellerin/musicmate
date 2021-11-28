function analyze(users) {
  const analyzedUsers = [];
  console.time("first loop");
  users.forEach((user, key) => {
    let usersWithScores = [];

    const userTracks = user.spotify.tracks;
    const userArtists = user.spotify.artists;
    const userGenres = [];

    const usersToCompare = new Map(users);
    usersToCompare.delete(key);

    console.time("second loop");
    usersToCompare.forEach((userToCompare, keyToCompare) => {
      console.time("inner loop");
      const userTracksToCompare = userToCompare.spotify.tracks;
      const userArtistsToCompare = userToCompare.spotify.artists;
      const userGenresToCompare = [];

      console.time("artists");
      const artistsScore = compareArtists(
        userArtists,
        userArtistsToCompare,
        userGenres,
        userGenresToCompare
      );
      console.timeEnd("artists");

      console.time("tracks");
      const tracksScore = compareTracks(userTracks, userTracksToCompare);
      console.timeEnd("tracks");

      console.time("genres");
      userGenresToCompare.sort((a, b) => b.score - a.score).splice(10);
      userGenres.sort((a, b) => b.score - a.score).splice(10);

      const genresScore = compareGenres(userGenres, userGenresToCompare);
      console.timeEnd("genres");

      usersWithScores.push({
        user: {
          id: userToCompare.id,
          name: userToCompare.name,
          spotify: {
            id: userToCompare.spotify.id,
            name: userToCompare.spotify.name,
          },
        },
        scores: { artistsScore, tracksScore, genresScore },
      });
      console.timeEnd("inner loop");
    });

    usersWithScores.sort(
      (a, b) =>
        b.scores.artistsScore.score +
        b.scores.tracksScore.score +
        b.scores.genresScore.score -
        (a.scores.artistsScore.score +
          a.scores.tracksScore.score +
          a.scores.genresScore.score)
    );
    user.spotify.genres = userGenres;

    analyzedUsers.push({
      user: { ...user },
      usersWithScores,
    });
    console.timeEnd("second loop");
  });
  console.timeEnd("first loop");

  return analyzedUsers;
}

function compareArtists(
  artists,
  artistsToCompare,
  userGenres,
  userGenresToCompare
) {
  let score = 0;
  let matchingArtists = [];
  artists.forEach((artist, index) => {
    addUserGenre(artist, userGenres);
    if (artistsToCompare[index])
      addUserGenre(artistsToCompare[index], userGenresToCompare);
    const artistsMatch = artistsToCompare.filter(
      (artistToCompare) => artistToCompare.id === artist.id
    );
    if (artistsMatch.length === 1) {
      score++;
      matchingArtists.push(artist);
    }
  });
  return { score, matchingArtists };
}

function compareTracks(tracks, tracksToCompare) {
  let score = 0;
  let matchingTracks = [];
  tracks.forEach((track) => {
    const tracksMatch = tracksToCompare.filter(
      (trackToCompare) => trackToCompare.id === track.id
    );
    if (tracksMatch.length === 1) {
      score += 2;
      matchingTracks.push(track);
    }
  });
  return { score, matchingTracks };
}

function compareGenres(genres, genresToCompare) {
  let score = 0;
  let matchingGenres = [];
  genres.forEach((genre, index) => {
    genresToCompare.forEach((genreToCompare, indexToCompare) => {
      if (genre.genre === genreToCompare.genre) {
        score += Math.min(
          0.5 * (genres.length - index),
          0.5 * (genresToCompare.length - indexToCompare)
        );
        matchingGenres.push(genre.genre);
      }
    });
  });
  return { score, matchingGenres };
}

function addUserGenre(userArtist, userGenres) {
  const genres = userArtist.genres;
  if (genres)
    genres.forEach((genre) => {
      let filteredGenres = userGenres.filter(
        (userGenre) => userGenre.genre === genre
      );
      if (filteredGenres.length === 0) userGenres.push({ genre, score: 1 });
      else filteredGenres[0].score++;
    });
}

module.exports = analyze;
