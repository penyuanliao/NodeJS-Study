#!/bin/sh

   echo '    ______    '
   echo '   / ____/ __ '
   echo '  / /__\ \/ / '
   echo ' / ___//   /  '
   echo '/_/   /_/\_\  '
   echo '              v0.5'
#  --always-compact
SERV_PARAMS="--max-old-space-size=8192 --expose-gc"

SERV_FILE="FxLiveStreamSrv.js"

SERV_PORT="80"

SERV_PATH="rtmp://192.168.188.72/video/daabb/video0 
 rtmp://192.168.188.72/video/daabc/video0 
 rtmp://192.168.188.72/video/daabd/video0 
 rtmp://192.168.188.72/video/daabg/video0 
 rtmp://192.168.188.72/video/daabh/video0 
 rtmp://192.168.188.72/video/daabdg/video0 
 rtmp://192.168.188.72/video/daabdh/video0"

exec node ${SERV_PARAMS} ${SERV_FILE} -p ${SERV_PORT} -f "rtmp://192.168.188.72/video/daabb/video0 rtmp://192.168.188.72/video/daabc/video0 rtmp://192.168.188.72/video/daabd/video0 rtmp://192.168.188.72/video/daabg/video0 rtmp://192.168.188.72/video/daabh/video0 rtmp://192.168.188.72/video/daabdg/video0 rtmp://192.168.188.72/video/daabdh/video0" > app.log 2>&1 &

echo "NodeJS Server START."







