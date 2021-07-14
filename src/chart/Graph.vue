<template>
    <div class="Graph">
        <Dropdown
            :options="dropdownOptions"
            :disabled="false"
            v-on:filter="getDropdownValues"
            name="channels"
            :maxItem="10"
            placeholder="Please select an option">
        </Dropdown>
        <div class="chart">
            <chart :series="series" />
            {{
                logRecord
            }}
        </div>
        <div id="container"></div>
        {{
            computePacket
        }}
          <h3>Offline Datalog</h3>
          <div class="progress-bar">
              {{progressStatus}}
            <progress-bar
            v-if="clicked"
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
import { CONST } from "../store/const";
import chart from "../components/Chart.vue"
import Dropdown from 'vue-simple-search-dropdown'
import ProgressBar from 'vuejs-progress-bar'

let saver = []

let sin = []

let dropdownname = []

export default {
    name: "Graph",
    components: {
        chart,
        Dropdown,
        ProgressBar
    },
    data: function () {
        return {
            cmdCategory: 0,
            cmdID: 0,
            cmdParams: "",
            stacker: [],
            toggle: true,
            dropdownOptions: [],
            selected: "",
            clicked: false,
            series: [],
            nRecords: 0,
            statusRec: {
                channel: '',
                size: 0
            },
            saver: [],
            sizeOfPacket: [],
            tableVal: [],
            packetValue: [],
            percentage: 0,
            progressStatus: '',
            progressBarOptions: {
                text: {
                    color: '#FFFFFF',
                    shadowEnable: true,
                    shadowColor: '#000000',
                    fontSize: 14,
                    fontFamily: 'Helvetica',
                    dynamicPosition: false,
                    hideText: true
                },
                progress: {
                    color: '#2dbd2d',
                    backgroundColor: '#C0C0C0'
                },
                layout: {
                    height: 35,
                    width: 200,
                    verticalTextAlign: 61,
                    horizontalTextAlign: 43,
                    zeroOffset: 0,
                    strokeWidth: 30,
                    progressPadding: 0,
                    type: 'bar'
                }
            }
        };
    },
    props: {
        msg: String,
    },
    computed: {
        ...mapGetters(["gogoRespond","gogoRespondSize","gogoRespondStatus"]),

        computePacket() {
            // console.log(this.clicked);
            if(this.clicked){
                return this.readText(this.gogoRespond)
            }
        },
        logRecord() {
            if(this.nRecords == 0){
                return ''
            }else{
                return this.selected + ' with ' + this.nRecords + ' records.'
            }
        }

    },
    mounted() {

    },
    created() { 
        // let intval = setInterval(() => {
        //     if(this.percentage < 100) this.percentage += .1
        //     else clearInterval(intval)
        // }, 10)
    },
    methods: {
        ...mapActions(["sendWS"]),
        getDropdownValues(keyword) {
            this.selected = keyword;
            let objJSON = []
            this.nRecords = 0
            for(let i = 0 ; i < sin.length ; i++){
                if(this.selected == sin[i]["channel"]){
                    for(let j = 0 ; j < sin[i]["data"].length ; j ++){
                        objJSON.push(sin[i]["data"][j])
                    }
                }
            }
            this.series = objJSON
            console.log(objJSON);
            for(let i = 0 ; i < this.series.length ; i++){
                try{
                    console.log('in rep :' + i + 'works fine.');
                    this.nRecords += objJSON[i]["data"].length;
                }catch(e){
                    console.log('this is error in ' + i + 'with ' + objJSON[i]["data"]);
                }
            }

        },
        testData:function (data){
            let inputString = data
            let obj = []
            for(let i = 0 ; i < inputString.length ; i ++){
                
                if(obj.length == 0){
                    obj.push({
                    channel: inputString[i][1],
                    data: [{
                        name: inputString[i][2],
                        data: [[inputString[i][0],inputString[i][3]]],
                        animation: false
                    }]
                    })
                    console.log('added' + (i + 1))
                }else{
                    for(let j = 0 ; j < obj.length ; j++){// for in obj

                        if(inputString[i][1] == obj[j]["channel"]){// if same channel

                            for(let k = 0 ; k < obj[j]["data"].length ; k ++){// for in channel's data

                                if(inputString[i][2] == obj[j]["data"][k]["name"]){//if same field

                                    obj[j]["data"][k]["data"].push([inputString[i][0],inputString[i][3]])
                                    // console.log('rep' + i + ' ' + obj[j]["data"] + ' ' + obj[j]["data"][k]["data"]);
                                    break
                                }

                                else if(k == obj[j]["data"].length - 1){
                                    obj[j]["data"].push({// if not same field
                                        name: inputString[i][2],
                                        data: [[inputString[i][0],inputString[i][3]]],
                                        animation: false
                                    })
                                    break
                                }
                            }

                            break
                        }
                        
                        else if(j == obj.length - 1){
                            obj.push({
                            channel: inputString[i][1],
                            data: [{
                                name: inputString[i][2],
                                data: [[inputString[i][0],inputString[i][3]]],
                                animation: false
                            }]
                            })
                            break
                        }
                        
                        // if not same channel
                        
                    }
                }
            }

            return obj
        },
        readText: function (data) {
            // saver.push(data)
            // console.log(data);
            
            if(!data){
                
                }
            else{
                let indexToRead = 0
                let save = ''
                let size = 0
                let x = data
                this.saver.push.apply(this.saver, x)
                let arr = this.saver
                if(this.sizeOfPacket[1] != undefined){
                    // console.log(this.sizeOfPacket);
                    this.percentage += (59/this.sizeOfPacket[1]) * 100
                    this.progressStatus = 'Syncing.... '
                }
                // in with size
                if(this.gogoRespondStatus == 4){
                    // this.sizeOfPacket = []
                    size = this.gogoRespondSize
                    console.log("computing size" + `with size ${size}`);
                    for(let i = indexToRead ; i < size ; i ++){
                        indexToRead ++
                        if(String.fromCharCode(arr[i]) == '\n'){
                            this.sizeOfPacket.push(parseInt(save))
                            console.log(`adding ${this.sizeOfPacket} in rep ${i}`);
                            save = ''
                        }else{
                            save += String.fromCharCode(arr[i])
                        }
                    }
                    // console.log(this.sizeOfPacket);
                    this.saver = []
                }
                // in with table
                if(this.gogoRespondStatus == 5){
                    // this.tableVal = []
                    console.log("conputing table");
                    size = this.sizeOfPacket[0]
                    for(let i = 0 ; i < size ; i ++){
                        indexToRead ++
                        if(String.fromCharCode(arr[i]) == ','){
                            this.tableVal.push(save)
                            save = ''
                        }else{
                            save += String.fromCharCode(arr[i])
                        }
                    }
                    console.log(this.tableVal);
                    this.saver = []
                }
                // in with value
                if(this.gogoRespondStatus == 6){
                    // this.packetValue = []
                    this.progressStatus = 'Converting bytes to value...'
                    console.log("computing values")
                    size = this.sizeOfPacket[1]
                    let tempArr = []
                    let saveByteArray = []
                    let readSizeIndex = 0
                    for(let i = 0 ; i < size ; i++){
                        saveByteArray.push(parseInt(arr[i]))
                        readSizeIndex ++
                        if(readSizeIndex == 8 || readSizeIndex == 10 || readSizeIndex == 12){
                            // tempArr.push(saveByteArray.reverse())
                            tempArr.push(saveByteArray)
                            saveByteArray = []
                        }
                        if(readSizeIndex == 16){
                            tempArr.push(saveByteArray)
                            // tempArr.push(saveByteArray)
                            this.packetValue.push(tempArr)
                            readSizeIndex = 0
                            saveByteArray = []
                            tempArr = []
                        }
                        // this.saver = []
                    }
                    // console.log(this.packetValue);


                    // start to convert bytes
                    let saveBuff = 0
                    for(let i = 0 ; i < this.packetValue.length ; i++){
                        // copy buffer 0 (Time stamp)
                        let saveForConvertByte = this.packetValue[i][0]
                        for(let j = 0; j < saveForConvertByte.length  ; j ++){
                            saveBuff += (saveForConvertByte[j] << (j * 8))
                        }
                        this.packetValue[i][0] = saveBuff
                        saveBuff = 0
                        // ***************************************************
    
                        // copy buffer 1 (channel)
                        saveForConvertByte = this.packetValue[i][1]
                        for(let j = 0; j < saveForConvertByte.length  ; j ++){
                            saveBuff += (saveForConvertByte[j] << (j * 8))
                        }
    
                        // let parseChannel = this.tableVal.filter((element,index) => {
                        //     if(index == saveBuff){
                        //         return element
                        //     }
                        // })
                        this.packetValue[i][1] = this.tableVal[saveBuff]
                        saveBuff = 0
                        // ***************************************************
    
                        // copy buffer 2 (field)
                        saveForConvertByte = this.packetValue[i][2]
                        for(let j = 0; j < saveForConvertByte.length  ; j ++){
                            saveBuff += (saveForConvertByte[j] << (j * 8))
                        }
    
                        // parse index ไปก็พอ
                        // let parseField = this.tableVal.filter((element,index) => {
                        //     if(index == saveBuff){
                        //         return element
                        //     }
                        // })
                        this.packetValue[i][2] = this.tableVal[saveBuff]
                        saveBuff = 0
                        // ***************************************************
    
                        // copy buffer 3 (Value)
                        saveForConvertByte = this.packetValue[i][3].reverse()
                        var buf = new ArrayBuffer(4)
                        var view = new DataView(buf)
                        // set bytes
                        saveForConvertByte.forEach(function (b, i) {
                            view.setUint8(i, b);
                        });
                        // Read the bits as a float; note that by doing this, we're implicitly
                        // converting it from a 32-bit float into JavaScript's native 64-bit double
                        var num = view.getFloat32(0);
                        this.packetValue[i][3] = num
                        saveBuff = 0
                    // ***************************************************
                    }
                    // console.log(this.packetValue);
                    dropdownname = []
                    sin = this.testData(this.packetValue)
                    console.log(sin);
                    for(let i = 0 ; i < sin.length ; i++){
                        dropdownname.push({
                            name: sin[i]["channel"],
                            id: i + 1
                        })
                    }
                    this.progressStatus = 'Done.'
                    this.dropdownOptions = dropdownname
                    this.saver = []
                }
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
        sendControlCommand: function () {
            var cmdList = [];
            cmdList[CONST.category_id_index] = Number(this.cmdCategory);
            cmdList[CONST.command_id_index] = Number(this.cmdID);

            var params = "";
            if (this.cmdParams != "") params = this.cmdParams.split(",");

            for (var i in params)
                cmdList[CONST.parameters_index + parseInt(i)] = parseInt(params[parseInt(i)]);

            this.sendCommand(cmdList, null);
        },
        sendOfflineDatalog: function () {
            var cmdList = [];
            this.saver = []
            this.packetValue = []
            this.tableVal = []
            this.sizeOfPacket = []
            this.dropdownOptions= []
            cmdList[CONST.category_id_index] = 20;
            cmdList[CONST.command_id_index] = 2;

            var params = "";
            // if (this.cmdParams != "") params = this.cmdParams.split(",");
            this.clicked = true

            for (var i in params)
                cmdList[CONST.parameters_index + parseInt(i)] = parseInt(params[parseInt(i)]);

            this.sendCommand(cmdList, null);
            // this.showText(this.gogoRespond)
            
        },
        clearData () {
            var cmdList = [];
            cmdList[CONST.category_id_index] = 20;
            cmdList[CONST.command_id_index] = 3;

            var params = "";
            // if (this.cmdParams != "") params = this.cmdParams.split(",");

            for (var i in params)
                cmdList[CONST.parameters_index + parseInt(i)] = parseInt(params[parseInt(i)]);

            this.sendCommand(cmdList, null);
        }
    },
}
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

</style>


