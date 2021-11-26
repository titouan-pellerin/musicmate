import { ForceGraph } from './../Three/ForceGraph';
import { UserMesh } from './../Three/UserMesh';
import { SimpleUser, UserAnalysis } from './../../../typings/index';
import { io, Socket } from 'socket.io-client';
import { MainScene } from '../Three/MainScene';
import { Group, Mesh, ShaderMaterial, Vector3 } from 'three';
import gsap from 'gsap';
import { ArtistsListEl } from '../Spotify/Elements/ArtistsListEl';
import { TracksListEl } from '../Spotify/Elements/TracksListEl';
import { GenresListEl } from '../Spotify/Elements/GenresListEl';

export class UsersSocket {
  socket: Socket;
  usersDiv: HTMLDivElement | null = null;
  users: SimpleUser[] = [];
  scene: MainScene;
  currentUser: string | null = null;
  usersAnalysis: UserAnalysis[] | null = null;
  forceGraph: ForceGraph | null = null;
  constructor(serverUrl: string, scene: MainScene) {
    this.scene = scene;
    this.usersDiv = document.querySelector('.users');
    this.socket = io(serverUrl);

    this.socket.on('connect', () => {
      console.log(this.socket.id);
      this.currentUser = this.socket.id;
    });

    this.socket.on('disconnect', () => {
      console.log(this.socket.id);
    });

    this.socket.emit('getUsers');

    this.socket.on('users', this.getUsers.bind(this));

    this.socket.on('spotifyUpdate', this.addUser.bind(this));

    this.socket.on('analysisDone', this.analysisDone.bind(this));

    this.socket.on('userDisconnection', this.removeUser.bind(this));
  }

  setSpotify(spotifyData: {
    name: string;
    id: string;
    artists: SpotifyApi.ArtistObjectFull[];
    tracks: SpotifyApi.TrackObjectFull[];
  }) {
    this.socket.emit('setSpotify', spotifyData);
  }

  getUsers(users: SimpleUser[]) {
    users.forEach(async (user) => {
      if (!UserMesh.userMeshes.has(user.id)) this.createUserMesh(user);
    });
  }

  async addUser(user: SimpleUser) {
    console.log(user.spotify.name);
    if (!UserMesh.userMeshes.has(user.id)) {
      this.users.push(user);
      this.createUserMesh(user);
    }
  }

  removeUser(user: SimpleUser) {
    console.log('remove user', user.spotify.name);

    this.users.splice(this.users.indexOf(user), 1);
    UserMesh.remove(user.id);
  }

  startAnalysis() {
    this.socket.emit('startAnalysis');
    const startBtn = document.querySelector('.start-btn');
    if (startBtn) startBtn.textContent = 'Loading...';
  }

  async analysisDone(usersAnalysis: UserAnalysis[]) {
    console.log('analysis done');
    document.querySelector('.start-btn-container')?.classList.add('hidden');

    this.usersAnalysis = usersAnalysis;
    // this.forceGraph = new ForceGraph(usersAnalysis);
    // this.forceGraph.showRelations();
    // this.showUserMatch();
  }

  createUserMesh(user: SimpleUser) {
    let currentMesh: UserMesh;
    if (UserMesh.userMeshes.size === 0) {
      console.log('first');
      currentMesh = new UserMesh(user.id, user.spotify.name);
    } else currentMesh = UserMesh.cloneUser(user.id, user.spotify.name);

    currentMesh.nameEl.addEventListener('click', this.showUserMatch.bind(this));
    UserMesh.userMeshes.set(user.id, currentMesh);

    currentMesh.scale.set(0, 0, 0);
    currentMesh.nameEl.classList.remove('hidden');
    gsap.to(currentMesh.scale, {
      duration: 0.75,
      x: 1,
      y: 1,
      z: 1,
      ease: 'power3.out',
    });
    console.log(UserMesh.userMeshes.size);
    console.log(currentMesh.position);

    UserMesh.userMeshesGroup.add(currentMesh);
  }

  showUserMatch(e: Event) {
    if (this.usersAnalysis) {
      document
        .querySelector('.back-btn')
        ?.addEventListener('click', this.previous.bind(this));
      if (!UserMesh.userMeshesGroupPositions && !UserMesh.userMeshesGroupPosition) {
        UserMesh.userMeshesGroupPositions = Array.from(
          UserMesh.userMeshesGroup.children.map((child) => child.position.clone()),
        );
        UserMesh.userMeshesGroupPosition = UserMesh.userMeshesGroup.position.clone();
      }

      console.log(UserMesh.userMeshesGroupPositions);
      const id = (e.target as HTMLHeadingElement).id;
      // this.forceGraph?.d3Simulation?.stop();
      const currentUserAnalysis = this.usersAnalysis.filter(
        (userAnalysis) => userAnalysis.user.id === id,
      )[0];

      document.querySelector('.canvas-container')?.classList.add('reduced');
      document.querySelector('.back-btn-container')?.classList.remove('hidden');
      const currentUserMesh = UserMesh.userMeshes.get(id) as Mesh;
      const bestMatch = currentUserAnalysis.usersWithScores[0];
      const score = Math.ceil(
        ((bestMatch.scores.artistsScore.score +
          bestMatch.scores.tracksScore.score +
          +bestMatch.scores.genresScore.score) /
          177.5) *
          100,
      );
      (document.querySelector('.current-user') as HTMLSpanElement).textContent =
        currentUserAnalysis.user.spotify.name;
      (document.querySelector('.current-user-match') as HTMLSpanElement).textContent =
        bestMatch.user.spotify.name;
      (document.querySelector('.score') as HTMLSpanElement).textContent =
        score.toString() + '%';

      const artistsListEl = new ArtistsListEl(
        bestMatch.scores.artistsScore.matchingArtists,
      );
      const tracksListEl = new TracksListEl(bestMatch.scores.tracksScore.matchingTracks);
      const genresListEl = new GenresListEl(bestMatch.scores.genresScore.matchingGenres);

      const artistsContainer = document.querySelector('.artists-container');
      const tracksContainer = document.querySelector('.tracks-container');
      const genresContainer = document.querySelector('.genres-container');

      if (artistsContainer?.children[1]) artistsContainer.children[1].remove();
      if (tracksContainer?.children[1]) tracksContainer.children[1].remove();
      if (genresContainer?.children[1]) genresContainer.children[1].remove();

      artistsContainer?.appendChild(artistsListEl.artistsEl);
      tracksContainer?.appendChild(tracksListEl.tracksEl);
      genresContainer?.appendChild(genresListEl.genresEl);

      document.getElementById(id)?.classList.remove('hidden');
      document.querySelector('.results')?.classList.add('show');
      document.body.classList.remove('no-overflow-y');
      this.scene.controls.reset();
      this.scene.controls.enabled = false;
      gsap.to(currentUserMesh.position, {
        duration: 0.75,
        x: -1.5,
        y: 0,
        z: 0,
        ease: 'power3.out',
      });
      gsap.to(currentUserMesh.scale, {
        duration: 0.75,
        x: 1,
        y: 1,
        z: 1,
        ease: 'power3.out',
      });

      gsap.to(this.scene.camera, {
        duration: 0.75,
        zoom: 125,
        onUpdate: () => this.scene.camera.updateProjectionMatrix(),
      });
      gsap.to(UserMesh.userMeshesGroup.position, {
        duration: 0.75,
        x: 0,
        y: 0,
        ease: 'power3.out',
      });

      const bestMatchMesh = UserMesh.userMeshes.get(bestMatch.user.id);
      document.getElementById(bestMatch.user.id)?.classList.remove('hidden');

      if (bestMatchMesh) {
        gsap.to(bestMatchMesh.position, {
          duration: 0.75,
          x: 1.5,
          y: 0,
          z: 0,
          ease: 'power3.out',
        });
        gsap.to(bestMatchMesh.rotation, {
          duration: 0.75,
          x: Math.PI,
          y: 0,
          z: 0,
          ease: 'power3.out',
        });
        gsap.to(bestMatchMesh.scale, {
          duration: 0.75,
          x: 1,
          y: 1,
          z: 1,
          ease: 'power3.out',
        });
      }

      this.usersAnalysis.forEach((userAnalysis) => {
        if (userAnalysis.user.id !== bestMatch.user.id && userAnalysis.user.id !== id) {
          document.getElementById(userAnalysis.user.id)?.classList.add('hidden');

          const meshToHide = UserMesh.userMeshes.get(userAnalysis.user.id) as UserMesh;
          gsap.to(meshToHide.position, {
            duration: 0.75,
            x: 0,
            y: 0,
            stagger: 0.3,
            ease: 'power3.out',
          });
          gsap.to(meshToHide.scale, {
            duration: 0.75,
            x: 0.2,
            y: 0.2,
            z: 0.2,
            stagger: 0.3,
            ease: 'power3.out',
          });
        }
      });
    }
  }
  previous() {
    console.log('test');
    console.log(UserMesh.userMeshesGroupPositions);
    console.log(UserMesh.userMeshesGroup);

    document.querySelector('.canvas-container')?.classList.remove('reduced');
    document.querySelector('.back-btn-container')?.classList.add('hidden');
    document.querySelector('.results')?.classList.remove('show');
    document.body.classList.add('no-overflow-y');
    this.scene.controls.enabled = true;

    gsap.to(UserMesh.userMeshesGroup.position, {
      duration: 0.75,
      ease: 'power3.out',
      x: UserMesh.userMeshesGroupPosition.x,
      y: UserMesh.userMeshesGroupPosition.y,
    });
    (UserMesh.userMeshesGroup.children as UserMesh[]).forEach((child, i) => {
      child.nameEl?.classList.remove('hidden');
      // console.log('show', document.getElementById(child.userId));

      gsap.to(child.position, {
        duration: 0.75,
        stagger: 0.3,
        ease: 'power3.out',
        x: UserMesh.userMeshesGroupPositions[i].x,
        y: UserMesh.userMeshesGroupPositions[i].y,
      });
      gsap.to(child.scale, {
        duration: 0.75,
        stagger: 0.3,
        ease: 'power3.out',
        x: 1,
        y: 1,
        z: 1,
      });
    });
  }
}