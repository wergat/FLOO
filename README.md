# FLOO
Force Lead Organized Overlay

Overlay for organizing any number of platoons in Planetside 2.
Uses an Electron app as an overlay above the in-game map screen to allow the user to place additional markers on the map.
Requires the game to be started in windowed mode, as it does not hook into the game itself.  

## Features
 -  Moveable markers for squads on the ingame map
 -  Easily manage squads with the platoon list 
 -  Change platoon color and name to keep everything organized
 -  Support for 1080p and 1440p
 -  Change UI scale and position

## Keep this in mind
 - Enable grid ingame, the map bounding box (black box) should align with it.
 - The overlay tracks your mouse movements and simulates how the ingame map should behave. It's not perfect and can desync.
 - When the map and the overlay are not synced, zoom out fully and drag the map until one corner of the bounding box aligns.
 - Don't zoom in/out and drag the map around at the same time, ingame map behaves erraticly and i have yet to simulate that properly.
 - After clicking on the overlay, click once on the ingame map before dragging the ingame map around again to prevent sudden map movements.

## FAQ
- #### Q: Why do i have to download an exe? Can't this work in a browser?  
  A: The transparent background and mouse tracking used to sync the overlay with the background are not supported in any normal browser. The mouse needs to be tracked outside the normal browser window, when it's interacting with ingame map.  
- #### Q: Can't you just display the normal map in the browser?  
  A: Even with the extensive API PS2 proviedes, you can't access a lot of information that is important to a force lead, like base capture timers, hex pop and bastion position/status.  
- #### Q: I've found an error/bug/have a suggestion  
  A: check if there is an issue for that already, if not, just open one.  
- #### Q: My Antivirus is blocking the installer.  
  A: Sir, this is a github. Try to convince your AV to accept it, it will probably run fine once installed. You can also always build it yourself.  
- #### Q: Will i be banned for using this programm?  
  A: This overlay does not hook into the game or game files in any way. Thats why there will be slight difference between overlay UI and in-game UI elements, and you can't use this overlay with the game in fullscreen mode.  
- #### Q: Does this app require an internet connection?  
  A: No. Once you have downloaded the installer, all files are on your pc. This tool might get some support for the PS2 API in the future, but it is not a feature at the moment.  
- #### Q: Help, there is an error about iohook, it's not working.  
  A: AAAAAAAAAAAAAAA  


## How to build this yourself
* get node `10.22.1` electron `8.5.2`
* fork this repository, have fun!
### Some stuff to look out for:
* Code is gonna get some improvements to be friendlier to other devs soon, so watch out for that.
* `iohook`dependency sucks hard. I can't get rid of it, because i need to track the mouse outside of the electron window to keep the map synced. Once that module gets upgraded for newer electron versions, this project can be upgraded as well.
* asar is needed, because some filedirs/names are longer than 260 chars. Has something to do with building the installer in some %TEMP% folder and some node_module, probably vue related? Error messages weren't helpful.
### Some pointers:
* `npm run serve` to start the vue dev server (hot reload to do UI stuff)
* `npm run build` to build all the ts/vue files into /dist (pretty quick, allows to test in dev build of app)
* `npm start` to start electron with the build in /dist
* `npm run pack` to pack the app into an executable in /out/FLOO-win32-x64/ (takes some time, but non-dev version)
* `npm run make` to turn whats in /out/FLOO-win32-x64/ into an installer (takes quite a while to build the installers)
* `npm run full` to build, pack and make in one command.
