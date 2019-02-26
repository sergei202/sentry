# Sentry

Sentry is a NodeJS security system.  It is divided into separate 3 module:
- Camera: Connects a webcam to the server
- Client: The frontend interface for Sentry
- Server: All clients and cameras connect to the server

## Install

The default configs will let you run all three modules on a single machine and pay with it.

### Camera Module
- NodeJS
- OpenCV dependencies
- Typescript and `ts-node`
- `pm2` if you would like it to autostart on start up
- `npm install`
- Copy `src/config.default.ts` to `src/config.ts`


### Raspberry Pi
If you are installing the camera part on a Raspberry Pi:

#### Install NodeJS
- `wget https://nodejs.org/dist/v10.15.1/node-v10.15.1-linux-armv6l.tar.gzz`
- `tar -xzf node-v10.15.1-linux-armv6l.tar.gz`
- `cp -r node-v10.15.1-linux-armv6l/* /usr/local/`

#### Typescript and Friends
- `sudo npm install -g typescript ts-node pm2`

#### Camera
You'll need to install the dependencies for OpenCV:
`sudo apt install cmake build-essential unzip pkg-config libjpeg-dev libpng-dev libtiff-dev libavcodec-dev libavformat-dev libswscale-dev libv4l-dev libxvidcore-dev libx264-dev libgtk-3-dev libcanberra-gtk* libatlas-base-dev gfortran`


If you are using a Raspberry Pi camera: `sudo modprobe bcm2835-v4l2`
Or add `bcm2835-v4l2` to `/etc/modules`

You'll also have to add yourself to the `video` group (if you want run this as non-root):
```
sudo usermod -a -G video $USER
reboot
```

### Server
- `npm install`
- Copy `src/config.default.ts` to `src/config.ts`

### Client
- `npm install`

## Run
`npm start` in each module:
- `cd camera && npm start`
- `cd server && npm start`
- `cd clinet && npm start`
