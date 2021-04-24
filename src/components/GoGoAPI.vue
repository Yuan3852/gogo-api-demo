<template>
  <div class="gogo">
    <h1>{{ msg }}</h1>

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

        <button @click="downloadLogo()">Download</button>
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
      <button @click="sendCommand()">Send command</button>
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
    ...mapActions(["sendMessageWS"]),
    downloadLogo: function () {
      console.log("board version: " + this.gogoReport[18]);
      if (this.logoProgram && this.boardStatus && false) {
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
            console.info(response.data);
            // this.sendMessageWS(response.data);
          },
          (response) => {
            // Error
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
    sendCommand: function () {
      console.info(this.cmdCategory, this.cmdID, this.cmdParams);
      // let gogoPacket = [0x54, 0xfe, ...]
      // this.sendMessageWS(gogoPacket)
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
