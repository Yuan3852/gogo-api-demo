# Offline Datalog Implementation Notes
This file contains usage guide and development note of offline datalog.

---
## User Usage Procedure
1. User clicking on `Sync Data` button to start retrives offline datalog data from GoGo Board
2. while retriving data, progress bar will showing with precentage
3. when syncing completed, click on `select channel` dropdown, this will showing the channel of retrived offline datalog data
4. after selected channel, Graph will rendering the selected channel on screen
---

## WebApp - Development Note
### Syncing procedure

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