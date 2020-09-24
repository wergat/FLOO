# FLOO
Force Lead Organized Overlay

Overlay for organizing any number of platoons in Planetside 2.
Uses Electron as an overlay above the in-game map screen to allow the user to place additional markers on the map.
Requires the game to be started in windowed mode, as it does not hook into the game itself.  
While this does prevent FLOO from getting important information out of the game, like exact position of the map, capture timers, ect., it also means the user wont be banned for using this tool.
Because this tool does not hook into the game, there will be slight difference between Tool UI and in-game UI.  

Some things the user has to keep in mind when using this tool, as they will cause desync between ingame map and the overlay.
* Don't zoom in/out and drag the map around at the same time.
* After clicking on any UI element, click on anything ingame before dragging the ingame map around again.

Currently supported resolutions: 
* 2560x1440


iohook and active-win dependency sucks, but electron 8.5.2 and node v10.22.1 versions seems to work.

