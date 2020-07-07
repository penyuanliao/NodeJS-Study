var FxLibrary = {
  onHeadersDecoded: function () {
    onHeadersDecoded();
  },
  onPictureDecoded: function (buffer, width, height, infos) {
    onPictureDecoded(buffer, width, height, infos);
  }
};

mergeInto(LibraryManager.library, FxLibrary);
