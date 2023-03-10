import {dialog} from 'electron';
import moment from "moment";

export const showOpenDialog = (browserWindow, filesPaths, cb) => {
  let date = moment().format('DD-MM-YY');
  dialog.showSaveDialog(browserWindow, {
    buttonLabel: "Выбрать",
    defaultPath: date + ".xlsx",
    title: "Выберите файл для сохранения",
    properties: ['createDirectory', 'showOverwriteConfirmation'],
    filters: [
      {name: 'Excel', extensions: ['xlsx']}
    ]
  }).then(({canceled, filePath}) => {
    if (!canceled && filePath) {
      console.log('file correct')
      cb(filesPaths, filePath, browserWindow);
    }
  }).catch(err => {
    console.log(err);
  })
};
