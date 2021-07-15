<template>
  <div class="Graph">
    <Dropdown
      class="channel-dropdown"
      :options="arrayOfObjects"
      :selected="selectedObject"
      v-if="showDropdown"
      v-on:updateOption="onSelectedChannel"
      :placeholder="'Choose channel to plot.'"
    >
    </Dropdown>
    <div class="chart">
      <datalog-chart ref="datalogChart" />
      {{ logRecord }}
    </div>
    <div id="container"></div>
    {{ computePacket }}
    <!-- <h3>Offline Datalog</h3> -->
    <div class="progress-bar">
      {{ progressStatus }}
      <progress-bar
        v-if="startRetrivedOfflineDatalog"
        :options="progressBarOptions"
        :value="percentage"
      />
    </div>
    <br />
    <br />
    <button @click="sendOfflineDatalog()">Sync Data</button>
    <button @click="clearData()">Clear</button>
    <button @click="test()">Test</button>
  </div>
</template>

<script>
import { mapActions, mapGetters } from "vuex";
import { CONST } from "@/store/const";
import DatalogChart from "@/components/Chart.vue";
import Dropdown from "vue-dropdowns";
import ProgressBar from "vuejs-progress-bar";

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
      arrayOfObjects: [],
      selectedObject: {
        name: "",
      },
      showDropdown: false,
      startRetrivedOfflineDatalog: false,
      series: [],
      nRecords: 0,
      percentage: 0,
      progressStatus: "",
      progressBarOptions: {
        text: {
          color: "#FFFFFF",
          shadowEnable: true,
          shadowColor: "#000000",
          fontSize: 14,
          fontFamily: "Helvetica",
          dynamicPosition: false,
          hideText: true,
        },
        layout: {
          height: 35,
          width: 200,
          verticalTextAlign: 61,
          horizontalTextAlign: 43,
          zeroOffset: 0,
          strokeWidth: 30,
          progressPadding: 0,
          type: "bar",
        },
      },
      dataChunk: [],
      lookupTable: [],
      datalogRecords: [],
      lookupTableFileSize: 0,
      datalogRecordsFileSize: 0,
    };
  },
  props: {
    msg: String,
  },
  computed: {
    ...mapGetters(["gogoResponse"]),
    computePacket() {
      if (this.startRetrivedOfflineDatalog) {
        return this.unpackOfflineDatalogPackets(this.gogoResponse);
      }
    },
    logRecord() {
      if (this.nRecords == 0) {
        return "";
      } else {
        return this.selected + " with " + this.nRecords + " records.";
      }
    },
  },
  mounted() {},
  created() {},
  methods: {
    ...mapActions(["sendWS"]),
    onSelectedChannel(payload) {
      console.log("hi");
      this.selectedObject = payload;
      let objJSON = [];
      this.nRecords = 0;
      for (let i = 0; i < this.datalogRecords.length; i++) {
        if (this.selectedObject.name == this.datalogRecords[i]["channel"]) {
          for (let j = 0; j < this.datalogRecords[i]["data"].length; j++) {
            objJSON.push(this.datalogRecords[i]["data"][j]);
          }
        }
      }
      this.$refs.datalogChart.chartOptions.series = objJSON;

      for (let i = 0; i < objJSON.length; i++) {
        try {
          console.log("in rep :" + i + "works fine.");
          this.nRecords += objJSON[i]["data"].length;
        } catch (e) {
          console.log("this is error in " + i + "with " + objJSON[i]["data"]);
        }
      }
    },
    splitInToChannel: function (data) {
      let inputString = data;
      let obj = [];
      for (let i = 0; i < inputString.length; i++) {
        if (obj.length == 0) {
          obj.push({
            channel: inputString[i][1],
            data: [
              {
                name: inputString[i][2],
                data: [[inputString[i][0], inputString[i][3]]],
                animation: false,
              },
            ],
          });
          console.log("added" + (i + 1));
        } else {
          for (let j = 0; j < obj.length; j++) {
            // for in obj

            if (inputString[i][1] == obj[j]["channel"]) {
              // if same channel

              for (let k = 0; k < obj[j]["data"].length; k++) {
                // for in channel's data

                if (inputString[i][2] == obj[j]["data"][k]["name"]) {
                  //if same field

                  obj[j]["data"][k]["data"].push([
                    inputString[i][0],
                    inputString[i][3],
                  ]);
                  // console.log('rep' + i + ' ' + obj[j]["data"] + ' ' + obj[j]["data"][k]["data"]);
                  break;
                } else if (k == obj[j]["data"].length - 1) {
                  obj[j]["data"].push({
                    // if not same field
                    name: inputString[i][2],
                    data: [[inputString[i][0], inputString[i][3]]],
                    animation: false,
                  });
                  break;
                }
              }

              break;
            } else if (j == obj.length - 1) {
              obj.push({
                channel: inputString[i][1],
                data: [
                  {
                    name: inputString[i][2],
                    data: [[inputString[i][0], inputString[i][3]]],
                    animation: false,
                  },
                ],
              });
              break;
            }

            // if not same channel
          }
        }
      }

      return obj;
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
            (69 / (this.datalogRecordsFileSize + this.lookupTableFileSize)) *
            100;
        }

        //todo - retrive files size
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
          console.log(this.lookupTableFileSize, this.datalogRecordsFileSize);
          return "retrieved file size...";
        }

        //todo - retrive lookup table
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

        //todo - retrive datalog records
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
          console.log(this.datalogRecords);
          // added by toro
          console.log(this.splitInToChannel(this.datalogRecords));
          this.datalogRecords = this.splitInToChannel(this.datalogRecords);
          let dropdownname = [];
          for (let i = 0; i < this.datalogRecords.length; i++) {
            dropdownname.push({
              name: this.datalogRecords[i]["channel"],
            });
          }
          this.arrayOfObjects = dropdownname;
          console.log(this.arrayOfObjects);
          this.showDropdown = true;
          return "done...";
        }

        return "Syncing...";
      }
    },
    sendCommand: function (data, callback) {
      var cmdPacket = new Array(64).fill(0); //? HID data 64 bytes ** include endpoint ID
      for (var i in data) {
        cmdPacket[parseInt(i)] = data[i];
      }
      // console.log(cmdPacket);
      this.sendWS(cmdPacket);

      if (typeof callback === "function") {
        callback();
      }
    },
    sendOfflineDatalog: function () {
      var cmdList = [];
      this.packetValue = [];
      this.tableVal = [];
      this.sizeOfPacket = [];
      this.dropdownOptions = [];
      cmdList[CONST.category_id_index] = CONST.response_packet_type;
      cmdList[CONST.command_id_index] = CONST.rcmd_get_offline_datalog;

      this.startRetrivedOfflineDatalog = true;

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
  margin: 40px 0 0;
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
  color: tomato;
  font-size: 25px;
  font-weight: 800;
}
</style>


