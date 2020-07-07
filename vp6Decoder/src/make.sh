#!/bin/bash

#  make.sh
#  vp6Decoder install
#  0) ./emsdk install 1.35.0
#  1) ./emsdk activate latest
#  2) source ./emsdk_env.sh --build=Release
#  Created by penyuan on 2016/8/24.
#  Copyright © 2016年 penyuan.liao. All rights reserved.
#  emcc build 1.29.0 and 1.35.0
export emcc="/Users/Benson/Documents/Libraries/emscripten/emsdk_portable/emscripten/1.35.0";
export PATH=$emcc:$PATH
EXPORTED_FUNCTIONS="[ 'HEAP8', 'HEAP16', 'HEAPU8', 'HEAPU16', '_fxdecoder', '_createStream', '_setDecode', '_displayNextFrame', '_setStreamDecode', '_release']";

emcc_args="-s INVOKE_RUN=0 -s DOUBLE_MODE=0 -s PRECISE_I64_MATH=0 -s NO_EXIT_RUNTIME=1 -s NO_FILESYSTEM=1 -s NO_BROWSER=1 -s ALIASING_FUNCTION_POINTERS=1 -s DISABLE_EXCEPTION_CATCHING=1 -s AGGRESSIVE_VARIABLE_ELIMINATION=1 --llvm-lto 3 --js-library library.js"
size=1024*1024*20;
xmems="$size"

RESOURCE_FILE="fxVP62.cpp VP62Codec.cpp"
CONFIGURATION_BUILD_DIR="$PROJECT_DIR/src/build";
TARGET_NAME="studios.js";

echo ">>>" $CONFIGURATION_BUILD_DIR

mkdir -p -v "$CONFIGURATION_BUILD_DIR"
pushd "$PROJECT_DIR/src"

echo "Remove file...";
rm -rf build/"$TARGET_NAME";
rm -rf build/Decoder.js;
echo "Strating emcc Build...";
echo -O3 --memory-init-file 0 --llvm-opts 3 --llvm-lto 3 ${RESOURCE_FILE} -o build/${TARGET_NAME} -s EXPORTED_FUNCTIONS="$EXPORTED_FUNCTIONS" -s TOTAL_MEMORY=$xmems ${emcc_args}
emcc -O3 --memory-init-file 0 --llvm-opts '3' --llvm-lto '3' ${RESOURCE_FILE} -o build/${TARGET_NAME} -s EXPORTED_FUNCTIONS="$EXPORTED_FUNCTIONS" -s TOTAL_MEMORY=$xmems ${emcc_args}

cat "./merge/DecoderPre.js" > "build/Decoder.js";
cat "./build/studios.js" >> "build/Decoder.js";
cat "./merge/DecoderPost.js" >> "build/Decoder.js";

popd


#sudo emcc -O2 --memory-init-file 0 fxVP62.cpp VP62Codec.cpp -o studios.js -s EXPORTED_FUNCTIONS="[ 'HEAP8', 'HEAP16', 'HEAPU8', 'HEAPU16', '_fxdecoder', '_setDecode', '_displayNextFrame', '_setStreamDecode', '_vp62Decoder2RGB']" -s TOTAL_MEMORY=50971520

# emcc -O2 --memory-init-file 0 fxVP62.cpp VP62Codec.cpp -o build/fxVP62.js -s EXPORTED_FUNCTIONS="[ 'HEAP8', 'HEAP16', 'HEAPU8', 'HEAPU16', '_fxdecoder', '_createStream', '_setDecode', '_displayNextFrame', '_setStreamDecode']" -s TOTAL_MEMORY=50971520 -s INVOKE_RUN=0 -s DOUBLE_MODE=0 -s PRECISE_I64_MATH=0 -s NO_EXIT_RUNTIME=1 -s NO_FILESYSTEM=1 -s NO_BROWSER=1 -s ALIASING_FUNCTION_POINTERS=1 -s DISABLE_EXCEPTION_CATCHING=1 --llvm-lto 3 --js-library library.js
