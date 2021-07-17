<template>
  <div class="Graph">
    <Dropdown
      class="channel-dropdown"
      :options="arrayOfObjects"
      :selected="selectedObject"
      v-on:updateOption="onSelectedChannel"
      :placeholder="'Select channel to plot'"
    >
    </Dropdown>
    <div class="chart">
      <datalog-chart ref="datalogChart" />
    </div>
    <div id="container">
      {{ offlineDatalogStatus }}
      {{ computePacket }}
    </div>

    <div class="progress-bar">
      <progress-bar
        v-if="startRetrivedOfflineDatalog"
        size="medium"
        bar-color="	#7CFC00"
        :val="percentage"
      />
    </div>
    <br />
    <br />
    <ul class="container">
      <button class="item" @click="syncOfflineDatalogRecords()">
        Sync Data
      </button>
      <button class="item" @click="clearData()">Clear</button>
      <button class="item" @click="test()">Test</button>
    </ul>
  </div>
</template>

<script>
import { mapActions, mapGetters } from "vuex";
import { CONST } from "@/store/const";
import DatalogChart from "@/components/Chart.vue";
import Dropdown from "vue-dropdowns";
import ProgressBar from "vue-simple-progress";

export default {
  name: "Graph",
  components: {
    DatalogChart,
    Dropdown,
    ProgressBar,
  },
  data: function () {
    return {
      cmdCategory: 0,
      cmdID: 0,
      cmdParams: "",
      offlineDatalogStatus: "",
      startRetrivedOfflineDatalog: false,
      dataChunk: [],
      lookupTable: [],
      datalogRecords: [],
      lookupTableFileSize: 0,
      datalogRecordsFileSize: 0,
      percentage: 0,
      arrayOfObjects: [],
      selectedObject: {
        name: "selete channel",
      },
    };
  },
  props: {
    msg: String,
  },
  computed: {
    ...mapGetters(["gogoResponse"]),

    computePacket() {
      if (this.startRetrivedOfflineDatalog) {
        this.offlineDatalogStatus = this.unpackOfflineDatalogPackets(
          this.gogoResponse
        );
      }
    },
  },
  mounted() {},
  created() {},
  methods: {
    ...mapActions(["sendWS"]),

    onSelectedChannel(payload) {
      this.selectedObject = payload;
      let nRecords = 0;

      //* pass new series data to highcharts
      this.$refs.datalogChart.chartOptions.series =
        this.datalogRecords[this.selectedObject["name"]];

      this.datalogRecords[this.selectedObject["name"]].forEach((eachField) => {
        nRecords += eachField["data"].length;
      });
      this.offlineDatalogStatus =
        this.selectedObject.name + " with " + nRecords + " records.";
    },

    splitRecordsToChartSeries: function (retrievedRecords) {
      let chartSeries = {};
      retrievedRecords.forEach((record) => {
        //! if channel exist
        if (record[1] in chartSeries) {
          //* every() -> it stops iterating through the array whenever the callback function returns a falsy value.
          let notFoundExistField = chartSeries[record[1]].every(
            (eachFieldInChannel) => {
              //! if field exist need to return false
              if (eachFieldInChannel["name"] == record[2]) {
                eachFieldInChannel["data"].push([record[0], record[3]]);
                return false;
              }
              return true;
            }
          );
          //! in case of field not exist
          if (notFoundExistField) {
            chartSeries[record[1]].push({
              name: record[2],
              data: [[record[0], record[3]]],
              animation: false,
            });
          }
        } else {
          chartSeries[record[1]] = [
            {
              name: record[2],
              data: [[record[0], record[3]]],
              animation: false,
            },
          ];
        }
      });

      //? sorted by timestamp
      for (const [key, channelRecords] of Object.entries(chartSeries)) {
        channelRecords.forEach((fieldRecords) => {
          fieldRecords["data"].sort((a, b) => a[0] - b[0]);
        });
      }
      return chartSeries;
    },

    unpackOfflineDatalogPackets: function (packet) {
      if (packet.status == CONST.offline_datalog_status_empty) {
        this.startRetrivedOfflineDatalog = false;
        return "this file is empty";
      }

      if (packet.data) {
        this.dataChunk.push.apply(this.dataChunk, packet.data);

        if (this.datalogRecordsFileSize + this.lookupTableFileSize) {
          this.percentage +=
            (packet.size /
              (this.datalogRecordsFileSize + this.lookupTableFileSize)) *
            100;
        }

        //todo - retrieve files size
        if (packet.status == CONST.offline_datalog_status_file_size) {
          let startPoint = 0;
          for (let i = 0; i < packet.size; i++) {
            if (String.fromCharCode(this.dataChunk[i]) == "\n") {
              let tmpSize = parseInt(
                String.fromCharCode.apply(
                  String,
                  this.dataChunk.slice(startPoint, i)
                )
              );
              !startPoint
                ? (this.lookupTableFileSize = tmpSize)
                : (this.datalogRecordsFileSize = tmpSize);
              startPoint = i + 1;
            }
          }
          this.dataChunk = [];
          startPoint = 0;
          console.log(this.lookupTableFileSize, this.datalogRecordsFileSize);
          return "retrieved file size...";
        }

        //todo - retrieve lookup table
        if (packet.status == CONST.offline_datalog_status_lookup_table) {
          let startPoint = 0;
          for (let i = 0; i < this.lookupTableFileSize; i++) {
            if (String.fromCharCode(this.dataChunk[i]) == ",") {
              this.lookupTable.push(
                String.fromCharCode.apply(
                  String,
                  this.dataChunk.slice(startPoint, i)
                )
              );
              startPoint = i + 1;
            }
          }
          this.dataChunk = [];
          console.log(this.lookupTable);
          return "retrieved lookup table...";
        }

        //todo - retrieve datalog records
        if (packet.status == CONST.offline_datalog_status_records) {
          let eachRecord = [];
          let records = [];
          for (let i = 1; i <= this.datalogRecordsFileSize; i++) {
            eachRecord.push(this.dataChunk[i - 1]);
            if (i % CONST.offline_datalog_record_size == 0) {
              records.push(eachRecord);
              eachRecord = [];
            }
          }
          records.forEach((record) => {
            this.datalogRecords.push([
              parseInt(
                new BigUint64Array(new Uint8Array(record.slice(0, 8)).buffer)[0]
              ),
              this.lookupTable[
                new Uint16Array(new Uint8Array(record.slice(8, 10)).buffer)[0]
              ],
              this.lookupTable[
                new Uint16Array(new Uint8Array(record.slice(10, 12)).buffer)[0]
              ],
              new Float32Array(new Uint8Array(record.slice(12, 16)).buffer)[0],
            ]);
          });
          this.dataChunk = [];

          //todo - convert retrieved records to highcharts series object
          this.datalogRecords = this.splitRecordsToChartSeries(
            this.datalogRecords
          );
          console.log(this.datalogRecords);

          //todo - push channel to dropdown list
          Object.keys(this.datalogRecords).forEach((channel) => {
            this.arrayOfObjects.push({
              name: channel,
            });
          });

          //? clearing all related data stream variables
          this.startRetrivedOfflineDatalog = false;
          packet.status = 0;
          packet.command = 0;
          packet.size = 0;
          packet.data = 0;

          return "done... please select channel from dropdown list.";
        }
        return "Syncing...";
      }
    },

    sendCommand: function (data, callback) {
      var cmdPacket = new Array(64).fill(0); //? HID data 64 bytes ** include endpoint ID
      for (var i in data) {
        cmdPacket[parseInt(i)] = data[i];
      }
      this.sendWS(cmdPacket);

      if (typeof callback === "function") {
        callback();
      }
    },

    syncOfflineDatalogRecords: function () {
      //? clear all variables
      this.dataChunk = [];
      this.lookupTable = [];
      this.datalogRecords = [];
      this.lookupTableFileSize = 0;
      this.datalogRecordsFileSize = 0;
      this.percentage = 0;

      //? set flag to retrieve new packets
      this.startRetrivedOfflineDatalog = true;

      var cmdList = [];
      cmdList[CONST.category_id_index] = CONST.response_packet_type;
      cmdList[CONST.command_id_index] = CONST.rcmd_get_offline_datalog;

      this.sendCommand(cmdList, null);
    },

    clearData() {
      var cmdList = [];
      cmdList[CONST.category_id_index] = 20;
      cmdList[CONST.command_id_index] = 3;

      this.sendCommand(cmdList, null);
    },
  },
};
</script>

<style scoped>
h3 {
  margin: 40px 0 0;
}

ul {
  list-style-type: none;
  padding: 0;
}

li {
  display: inline-block;
  margin: 0 10px;
}

a {
  color: #42b983;
}

textarea {
  width: 500px;
  height: 200px;
}

.progress-bar {
  width: 50%;
  margin: auto;
}

button {
  font-size: 0.8em;
  cursor: pointer;
  outline: none;
  padding: 0.75em 2em;
  border-radius: 2em;
  display: inline-block;
  color: #09af32;
  background-color: transparent;
  transition: all 0.15s ease;
  box-sizing: border-box;
  border: 1px solid #09af32;
}

button.alt {
  color: #fff;
  background-color: #851e3e;
}

.channel-dropdown {
  border-radius: 5px;
}
</style>


