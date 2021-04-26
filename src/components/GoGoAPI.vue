<template>
  <div class="gogo">
    <div>
      <h3>GoGo Report</h3>
      <ul>
        {{
          gogoReport
        }}
      </ul>
    </div>

    <div>
      <h3>Logo Program</h3>
      <br />
      <div>
        <textarea v-model="logoProgram" placeholder="Enter the logo program">
        </textarea>
        <div></div>

        <button @click="downloadLogoProgram()">Download</button>
      </div>
    </div>

    <div>
      <h3>Raw commands</h3>
      <br />
      <div>
        <li>Category ID: <input type="number" v-model="cmdCategory" /></li>
        <li>Command ID: <input type="number" v-model="cmdID" /></li>
        <li>Command Params: <input type="text" v-model="cmdParams" /></li>
      </div>
      <br />
      <button @click="sendControlCommand()">Send command</button>
    </div>
  </div>
</template>

<script>
import { mapActions, mapGetters } from "vuex";

export default {
  name: "GoGoAPI",
  data: function () {
    return {
      logoProgram: "",
      cmdCategory: 0,
      cmdID: 0,
      cmdParams: "",
    };
  },
  props: {
    msg: String,
  },
  computed: {
    ...mapGetters(["gogoReport", "boardStatus"]),
  },
  methods: {
    ...mapActions(["sendWS"]),

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

    setLogoMemoryPointer: function (callback) {
      var cmdList = [];
      cmdList[1] = 1; //? Category ID
      cmdList[2] = 1; //? Command ID
      cmdList[3] = 0;
      cmdList[4] = 0;
      this.sendCommand(cmdList, callback);
    },

    writeLogoMemory: function (content, callback, offset) {
      offset = offset || 0;
      if (offset > content.length) {
        if (typeof callback === "function") {
          callback();
        }
        return;
      }

      /* Write content to the flash memory */
      var txLength = content.length;

      var cmdList = [];
      cmdList[1] = 1; //? category ID
      cmdList[2] = 3; //? command ID

      //? set parameter 1 for content length
      //* # if the content cannot fit in one packet
      if (txLength - offset > 60) {
        cmdList[3] = 60;
      } else {
        cmdList[3] = txLength - offset;
      }

      // # copy the content to be transmitted to the output buffer
      for (var i = 0; i < cmdList[3]; i++) {
        cmdList[4 + Number(i)] = content[offset + Number(i)];
      }
      offset += 60;

      this.sendCommand(cmdList, () => {
        setTimeout(() => {
          this.writeLogoMemory(content, callback, offset);
        }, 10);
      });
    },

    downloadOpcodeToBoard: function (logoOpcode) {
      this.setLogoMemoryPointer(() => {
        this.writeLogoMemory(
          logoOpcode,
          () => {
            setTimeout(() => {
              //* sending beep packet
              var cmdList = [];
              cmdList[1] = 0; //? Category ID
              cmdList[2] = 11; //? Command ID
              this.sendCommand(cmdList, null);
            }, 15);
          },
          0
        );
      });
    },

    downloadLogoProgram: function () {
      if (this.logoProgram && this.boardStatus) {
        console.log(this.logoProgram);

        var compilerUrl =
          "https://7fkqkq6trh.execute-api.ap-southeast-1.amazonaws.com/logo/1.4/compile";
        var sendingData = {
          logo: this.logoProgram,
          firmware_version: this.gogoReport[20],
          board_type: this.gogoReport[17],
          board_version: this.gogoReport[18],
        };

        this.$http.post(compilerUrl, sendingData, { emulateJSON: true }).then(
          (response) => {
            if (response.data.data != undefined) {
              console.info(response.data);
              this.downloadOpcodeToBoard(response.data.data);
            } else {
              console.error(response.data);
            }
          },
          (response) => {
            if (
              response.data &&
              response.data.status &&
              response.data.status >= 500 &&
              response.data.status < 600
            ) {
              console.error("syntax error");
            } else {
              console.error("cloud service unavailable");
            }
          }
        );
      } else {
        console.error("board not connected or no logo program to download");
      }
    },

    sendControlCommand: function () {
      var cmdList = [];
      cmdList[1] = Number(this.cmdCategory); //? category ID
      cmdList[2] = Number(this.cmdID); //? command ID

      var params = "";
      if (this.cmdParams != "") params = this.cmdParams.split(",");

      for (var i in params)
        cmdList[parseInt(i) + 3] = parseInt(params[parseInt(i)]);

      this.sendCommand(cmdList, null);
    },
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
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
</style>
