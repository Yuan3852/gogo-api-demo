# Offline Datalog Implementation Notes
This file contains usage guide and development notes of offline datalog.

---
## User Usage Procedure
1. User clicking on `Sync Data` button to start retrieves offline datalog data from GoGo Board
2. while retrieving data, progress bar will showing with precentage
3. when syncing completed, click on `select channel` dropdown, this will showing the channel of retrieved offline datalog data
4. after selected channel, Chart will rendering the selected channel on screen
---

## WebApp - Development Note
### Overview
**Data syncing** `-- offline datalog data -->` **Selecting datalog channel** `-- specific channel data -->` **Chart rendering**

### Syncing procedure
- Starting with send `offline datalog request` command to GoGo Board (clicking `Sync Data` button), then set `startRetrivedOfflineDatalog` flag to start receives response packet from GoGo Board.
- GoGo Board will sending chunks of `response_packet_type` (packet type 20) with following data status in every packet.
  - 1: on progress
  - 2: failure
  - 3: records empty
  - 4: file size complete
  - 5: lookup table complete
  - 6: records complete
  
  these status will be used when unpacking the data packet in `unpackOfflineDatalogPackets` while receives the response.

- while receiving chunks of response packet, this can be divided into five states. indicates each state by looking from data status on response packet. e.g. GoGo Board sending `files size` data, GoGo Board will sending this data into multiple chunk of packets if it cann't fits into one packet. last chunk of packet, the status data will be `file size complete`(4), while other packets before last one will be `on progress`(1) status.
  - retrieve files size
    - this contains `lookup table size` and `offline datalog records size` splits by using **`\n`** as delimiter.
      - data format: `<table size> <'\n'> <records size> <'\n'>`
  - retrieve lookup table
    - this contains `lookup word` splits by using **`,`** as delimiter.
      - data format: `<lookup word 0> <','> <lookup word 1> <','> <lookup word ...>`
  - retrieve datalog records
    - this contains datalog records, each record contains timestamp, channel, field and value in fixed 16 bytes per record.
      - data format: `<timestamp(8 bytes)> <channel(2 bytes)> <field(2 bytes)> <value(4 bytes)>`
    - after unpack, each record must be mapping `channel` and `field` number to string by using number as index of lookup table, while `timestamp` parse to number and `value` parse to float.
  - convert retrieved records to highcharts series object
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
  - push channels to channels dropdown list
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

### Channel selecting procedure

### Rendering procedure

---
## Firmware - Development Note
## Overview
Offline Datalog Implementation is mainly about the communication between **Web Application** and **GoGoBoard** as shown in the diagram down below.

Request:**Web Aplication** `-- request command -->` **GoGoBoard**

Response:**Web Application** `<-- response command --` **GoGoBoard**

## Request command(s) from WebApp
The request will be sent as a packet through the **GoGo Plugin** to the **GoGoBoard** when the button was clicked. Each button contains the commnad ID which will be processed in **GoGoBoard**.
>Available command ID:
>- `2`: Get offline datalog data.
>- `3`: Clear offline datalog data in **GoGoBoard**.

## Response command(s) to WebApp
**GoGoBoard** responds to the **WebApp** on which command ID that it recieved. Note that `clear data` command will not sending a response.

## Example: request offline datalog data
When the **Sync Data** button was clicked the **WebApp** will send the packet with a length of 64 bytes which contains the category ID as 20 and command ID as 2 to the **GoGoBoard** through **GoGo Plugin**.

>request packet: 20,2,0,0,0,0 ....... 0

**GoGoBoard** will process the recieving packet then constructs the response packet for sending back to the **WebApp**

>response packet: 20,(packet length),(command ID),(status),(data)

---
