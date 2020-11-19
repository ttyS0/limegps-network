<template>
  <div>
    <div style="height: 500px; width: 100%">
        <p>{{currentCenter}}</p>
        <l-map
            v-if="showMap"
            :zoom="zoom"
            :center="center"
            :options="mapOptions"
            style="height: 80%"
            @update:center="centerUpdate"
            @update:zoom="zoomUpdate"
            >
            <l-tile-layer
                :url="url"
                :attribution="attribution"
            />
            <l-circle-marker v-for="marker in markers" :lat-lng="marker.latLng" :key="marker.id" :radius="marker.radius" :color="marker.id == activeMarkerId ? '#00FF00' : '#0000FF'">
            </l-circle-marker>
            <l-polyline :lat-lngs="route" color="#FF0000"></l-polyline>
            <l-control position="bottomleft" >
              <input type="checkbox" v-model="cyclic">Cyclic Route<br>
              <label for="inputSpeed">Speed (min/km)</label>
              <input id="inputSpeed" type="text" v-model.number="speed" placeholder="min/km"><br>
              <label for="inputMinimalTick">Minimal Tick (s)</label>
              <input id="inputMinimalTick" type="text" v-model.number="minimalTick" placeholder="s"><br>
              <label for="inputShuffleAccuracy">Shuffle Accuracy (deg)</label>
              <input id="inputShuffleAccuracy" type="text" v-model.number="shuffleAccuracy" placeholder="deg"><br>
              <label for="inputRounds">Rounds</label>
              <input id="inputRounds" type="text" v-model.number="rounds" placeholder="rounds"><br>
              <button @click="sample">Sample</button>
              <button @click="shuffuleRoute">Shuffle</button>
              <button @click="resetRoute">No Shuffle</button>
              <button @click="exportRoute">Export</button>
              <button @click="calibrate">Calibrate</button>
              <button @click="startSdr">Start</button>
            </l-control>
        </l-map>
        <vue-dropzone
          id="drop"
          ref="dropzone"
          :options="dropOptions"
          @vdropzone-file-added="fileAdded"></vue-dropzone>
    </div>
  </div>
</template>

<script>
import L, { latLng } from 'leaflet';
import { LMap, LTileLayer, LMarker, LPopup, LPolyline, LCircleMarker, LControl } from 'vue2-leaflet';
import VueDropzone from 'vue2-dropzone';
import { parseNavigationFile } from '../geo/nav-parser';
import { INITIAL_CENTER } from '../geo/consts';
import { sampleBySpeed } from '../geo/route';
import { v4 as uuidv4 } from 'uuid';
import projector from 'ecef-projector';

L; LMarker; LPopup; LPolyline;
export default {
  name: 'PageMap',
  components: {
    LMap,
    LTileLayer,
    // LMarker,
    // LPopup,
    LPolyline,
    LCircleMarker,
    LControl,
    VueDropzone
  },
  data: () => ({
      dropOptions: {
        url: '/',
        thumbnailWidth: 150,
        maxFilesize: 1.0,
      },
      mapOptions: {
        zoomSnap: 0.5
      },
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution:
        '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
      zoom: 17,
      center: latLng(INITIAL_CENTER.latitude, INITIAL_CENTER.longitude),
      currentCenter: null,
      showMap: true,
      nav: [],
      route: [],
      samples: [],
      finals: [],
      markers: [],
      cyclic: true,
      speed: 7,
      shuffleAccuracy: 0.00001,
      minimalTick: 3,
      timer: null,
      rounds: 1,
      roundIndex: 0,
      timerIndex: 0,
      activeMarkerId: null
  }),
  computed: {
    realSpeed() {
      return 1000 / (this.speed * 60);
    }
  },
  methods: {
    zoomUpdate(zoom) {
      this.currentZoom = zoom;
    },
    centerUpdate(center) {
      this.currentCenter = center;
    },
    showLongText() {
      this.showParagraph = !this.showParagraph;
    },
    async fileAdded(file) {
      const data = await parseNavigationFile(file);
      this.nav = data;
      this.sample();
      this.$refs.dropzone.removeAllFiles();
    },
    sample() {
      console.log(this.minimalTick);
      if(this.cyclic && this.nav[this.nav.length - 1] != this.nav[0]) {
        this.nav.push(this.nav[0]);
      }
      this.route = this.nav.map(v => latLng(v.latitude, v.longitude));
      console.log(this.route);
      this.samples = sampleBySpeed(this.nav, this.realSpeed, this.minimalTick);
      this.center = latLng(this.nav[0].latitude, this.nav[0].longitude);
      this.resetRoute();
    },
    resetRoute() {
      this.finals = this.samples.map(v => v);
      this.markers = this.finals.map(v => ({
        id: uuidv4(),
        radius: 1,
        latLng: latLng(v.latitude, v.longitude)
      }));
    },
    shuffuleRoute() {
      console.log(this.samples);
      this.finals = this.samples.map(v => ({
        ...v,
        latitude: v.latitude * 1 + (0.5 - Math.random()) * this.shuffleAccuracy,
        longitude: v.longitude * 1 + (0.5 - Math.random()) * this.shuffleAccuracy
      }));
      this.markers = this.finals.map(v => ({
        id: uuidv4(),
        radius: 1,
        latLng: latLng(v.latitude, v.longitude)
      }));
    },
    exportRoute() {
      let csv = this.finals.map(v => `${v.tick},${projector.project(v.latitude, v.longitude, 0).join(',')}`).join('\n');
      let anchor = document.createElement('a');
      anchor.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
      anchor.target = '_blank';
      anchor.download = 'data.csv';
      anchor.click();
    },
    calibrate() {
      this.activeMarkerId = this.markers[0].id;
      fetch('/api/sdr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          latitude: this.finals[0].latitude,
          longitude: this.finals[0].longitude
        })
      });
    },
    startSdr() {
      if(this.timer != null) {
        clearInterval(this.timer);
        this.timer = null;
      }
      else {
        this.activeMarkerId = null;
        this.timerIndex = 0;
        this.roundIndex = 0;
        this.timer = setInterval(() => {
          fetch('/api/sdr', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              latitude: this.finals[this.timerIndex].latitude,
              longitude: this.finals[this.timerIndex].longitude
            })
          });
          this.activeMarkerId = this.markers[this.timerIndex].id;
          this.timerIndex++;
          if(this.timerIndex >= this.finals.length) {
            this.timerIndex = 0;
            this.roundIndex++;
            if(this.roundIndex >= this.rounds) {
              clearInterval(this.timer);
              this.timer = null;
            }
          }
        }, this.minimalTick * 1000);
      }
    }
  }
};
</script>
