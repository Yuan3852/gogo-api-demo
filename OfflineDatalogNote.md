# Offline Datalog Implementation Notes
This file contains usage guide and development notes of offline datalog.

---
## User Usage Procedure
1. User clicking on `Sync Data` button to start retrieves offline datalog data from **GoGo Board**
2. while retrieving data, progress bar will showing with percentage
3. when data sync is completed, click on `select channel` dropdown, this will showing the channel of retrieved offline datalog data
4. after selected channel, Chart will rendering the selected channel records on screen
---

## WebApp - Development Note
### Overview
**Data syncing** `-- offline datalog data -->` **Selecting datalog channel** `-- selected channel data -->` **Chart rendering**

### Syncing procedure
- Starting with send `read offline datalog data` command to GoGo Board (clicking `Sync Data` button), then set `startRetrivedOfflineDatalog` flag to start receives response packet from GoGo Board.
- GoGo Board will sending chunks of `response_packet_type` (packet type 20) with following data status in every packet.
    > Packet data status
    >  - `1`: on progress
    >  - `2`: failure
    >  - `3`: records empty
    >  - `4`: file size complete
    >  - `5`: lookup table complete
    >  - `6`: records complete
  
  these status will be used when unpacking the data packet in `unpackOfflineDatalogPackets` while receives the response.

- while receiving chunks of response packet, this can be divided into five states. indicates each state by looking from data status on response packet. e.g. GoGo Board sending `files size` data, GoGo Board will sending this data into multiple chunk of packets if it cann't fits into one packet. last chunk of packet, the status data will be `file size complete (4)`, while other packets before last one will be `on progress (1)` status.
  1. retrieve files size
      - this contains `lookup table size` and `offline datalog records size` splits by using **`\n`** as delimiter.
        - data format: `<table size> <'\n'> <records size> <'\n'>`
  2. retrieve lookup table
      - this contains `lookup word` splits by using **`,`** as delimiter.
        - data format: `<lookup word 0> <','> <lookup word 1> <','> <lookup word ...>`
  3. retrieve datalog records
      - this contains datalog records, each record contains timestamp, channel, field and value in fixed 16 bytes per record.
        - data format: `<timestamp(8 bytes)> <channel(2 bytes)> <field(2 bytes)> <value(4 bytes)>`
      - after unpack, each record must be mapping `channel` and `field` number to string by using number as index of lookup table, while `timestamp` parse to number and `value` parse to float.
  4. convert retrieved records to highcharts series object
      - manipulate records in `splitRecordsToChartSeries` to convert each record to channel based records
        - data format: 
          ``` json
          { 
              "channel 1" : [
                  { 
                      name : "field 1",
                      data : [[ timestamp0 , value0 ]],
                      animation: false
                  },
                  { 
                      name : "field 2",
                      data : [[ timestamp1, value1 ], [ timestamp2, value2]],
                      animation: false
                  }
              ],
              "channel 2" : [
                  { 
                      name : "field 1",
                      data : [[ timestamp5, value5 ]],
                      animation: false
                  },
              ]
          }
          ```
  5. push channels to channels dropdown list
      - create list of channel name to generate dropdown list for user to selected.
        - data format:
          ``` json
          [
              {
                  name: "channel 1"
              },
              {
                  name: "channel 2"
              }
          ]
          ``` 

    After complete all five states, Data syncing will be done.

### Channel selecting and Rendering procedure
- We have created `datalog-chart` as component to separates rendering from data handler stuff.
- After user selected channel from dropdown list. Channel name will be use as key to feed the records data to `datalog-chart`. To feed data to chart, We use `$refs` binding to directly access a child component(datalog-chart) as name `datalogChart`, Then injects `datalogRecords` by directly access `chartOption` of chart itself. For detailed can be found in this function `onSelectedChannel`.
  >Beware to confusion about name of chart variables
  >- `DatalogChart` - include name to registers component to `OfflineDatalog.vue`
  >- `datalogChart` - reference name of `datalog-chart` component
  >- `datalog-chart` - component name of chart itself
- In this project, We use `highcharts` along with `highcharts-vue` as a wrapper. For more info and usage can be found [here](https://github.com/highcharts/highcharts-vue)

---
## Firmware - Development Note
## Overview
the communication between **Web Application** and **GoGoBoard** can be separated into `Request` and `Response` commands.

Request:**Web Aplication** `-- request command -->` **GoGoBoard**

Response:**Web Application** `<-- response command --` **GoGoBoard**

## Request command(s) from WebApp
The request will be sent as a packet to **GoGoBoard** when the button was clicked. Each button contains the command ID which will be processed in **GoGoBoard**.
>Available command ID:
>- `2`: Read offline datalog data.
>- `3`: Erase offline datalog data .

## Response command(s) to WebApp
**GoGoBoard** sends a response to the **WebApp** on which command ID that it has recieved. Note that some commands will not sending a response if it doesn't need to response. e.g. erase command.

## Example: read offline datalog data
When a **Sync Data** button was clicked, The **WebApp** will sending a packet with a length of 64 bytes which contains the category ID as `20`(packet type) and command ID as `2`(response of read command) to the **GoGoBoard**.
>request packet: `[ 20, 2, 0, 0, 0, 0, ......., 0 ]`

**GoGoBoard** will process the recieving packet then constructs the response packet for sending back to the **WebApp**

>response packet: `[ 20, <Packet Length>, <Command ID>, <Data Status>, <Payload / Data>, ... ]`

---
