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
// import Highcharts from 'highcharts'
// import stockInit from 'highcharts/modules/stock'
import chart from "../components/Chart.vue"
import Dropdown from 'vue-simple-search-dropdown'
import { normalizeTickInterval } from 'highcharts';

let saver = ""

let sin = []

let dropdownname = []

export default {
    name: "Graph",
    components: {
        chart,
        Dropdown
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
            }
        };
    },
    props: {
        msg: String,
    },
    computed: {
        ...mapGetters(["gogoRespond","gogoRespondSize","gogoRespondStatus"]),

        computePacket() {
            console.log(this.clicked);
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

    },
    methods: {
        ...mapActions(["sendWS"]),
        test() {
            //  light,lilcmu,1 1 0 500
            let arr = ['13','10','32','10',
            '108', '105', '103', '104', '116', '44', '108', '105', '108', '99', '109', '117','44',
            '1','0','0','0','0','0','0','0',
            '1','0',
            '0','0',
            '244','1','0','0',
            '2','0','0','0','0','0','0','0',
            '1','0',
            '0','0',
            '244','1','0','0',
            ]

            let rawData = []
            let byteValue = 16
            let indexToRead = 0
            let save = ''
            let saveSize = ''
            let tableVal = []
            let table = ""
            let readSizeIndex = 0
            let sizeOfPacket = []
            //extracts the size
            for(let i = indexToRead ; i < arr.length ; i ++){
                indexToRead ++
                if(String.fromCharCode(arr[i]) == '\n'){
                    readSizeIndex ++
                    sizeOfPacket.push(parseInt(save))
                    save = ''
                    if(readSizeIndex == 2){
                        readSizeIndex = 0
                        break
                    }
                }else{
                    save += arr[i]
                }
            }
            console.log(sizeOfPacket);

            let shiftRead = indexToRead
            //extracts the table
            try{
                for(let i = indexToRead ; i < sizeOfPacket[0] + shiftRead ; i ++){
                    indexToRead ++
                    if(String.fromCharCode(arr[i]) == ','){
                        tableVal.push(save)
                        save = ''
                    }else{
                        save += String.fromCharCode(arr[i])
                    }
                }
            }
            catch(e){
                console.log(e);
            }
            console.log(tableVal);

            //extracts an array of raw data
            shiftRead = indexToRead
            try{
                for(let i = indexToRead ; i < sizeOfPacket[1] + shiftRead ; i ++){
                    console.log(arr[i]);
                    readSizeIndex ++
                    save += arr[i]
                    if(readSizeIndex == 16){
                        rawData.push(save)
                        readSizeIndex = 0
                        save = ''
                    }
                }
            }catch(e){
                console.log(e);
            }
            console.log(rawData);

            let data = []
            try{
                for(let i = 0 ; i < rawData.length ; i ++){
                    let dataForSave = []
                    for(let j = 0 ; j < rawData[i].length ; j ++){
                        if(j < 8){
                            save += rawData[i][j]
                            if(j == 7){
                                dataForSave.push(save.split("").reverse().join(""))
                                save = ''
                            }
                        }
                        else if(j < 10){
                            save += rawData[i][j]
                            if(j == 9){
                                dataForSave.push(save.split("").reverse().join(""))
                                save = ''
                            }
                        }
                        else if(j < 12){
                            save += rawData[i][j]
                            if(j == 11){
                                dataForSave.push(save.split("").reverse().join(""))
                                save = ''
                            }
                        }
                        else if(j < 16){
                            save += rawData[i][j]
                            if(j == 15){
                                dataForSave.push(save.split("").reverse().join(""))
                                save = ''
                            }
                        }
                    }
                    data.push(dataForSave)
                }
            }catch(e){
                console.log(e);
            }
            console.log(data);




    
        },
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
            let save = ""
            // console.log("hi")
            let respondSize = this.gogoRespondSize
            // console.log(this.gogoRespondSize)
            for (let i = 0 ; i < respondSize ; i++){
                save = String.fromCharCode(data[i])
                if(save == ','){
                    saver += save
                }else{
                }
                // console.log(save)
            }
            // console.log("this is data lenght: " + respondSize)

            // console.log(saver);

            if(respondSize < 59){
                console.log('this is respond size: ' + respondSize);
                let data_toPlot = []
                let x = saver
                let y = x.split('\n')
                y.splice(0,1)
                y.splice(-1,1)
                console.log(y)
                let z = []
                // console.log(y);
                for (let i = 0 ; i < y.length ; i++){
                    try{
                        z[i] = y[i].split(',')
                        z[i][0] = parseInt(z[i][0])
                        z[i][1] = z[i][1].trim()
                        z[i][2] = z[i][2].trim()
                        z[i][3] = parseFloat(z[i][3])
                    }catch(e){
                        continue
                    }
                }

                console.log(z);

                dropdownname = []

                sin = this.testData(z)
                console.log(sin);
                for(let i = 0 ; i < sin.length ; i++){
                    dropdownname.push({
                        name: sin[i]["channel"],
                        id: i + 1
                    })
                }
                this.dropdownOptions = dropdownname
                this.clicked = false

                // this.gogoRespondStatus = 


                return this.gogoRespondStatus

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
                saver = ""
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

