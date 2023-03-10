import $ from 'jquery';

// we also need to process some styles with webpack
import fontawesome from '@fortawesome/fontawesome';
import {faCheckCircle, faCloudUploadAlt, faExclamationCircle} from '@fortawesome/fontawesome-free-solid';
import './styles/index.scss';

fontawesome.library.add(faCloudUploadAlt);
fontawesome.library.add(faExclamationCircle);
fontawesome.library.add(faCheckCircle);

const drop = document.querySelectorAll('input');
const src_file = document.querySelector('#src_file');
const wb_file = document.querySelector('#wb_file');
const ready_btn = document.querySelector('#startProcessBtn');
const errorArea = document.querySelector('.error-toast');
const notificationArea = document.querySelector('.notification-toast');
const files = {};

const handleIn = (event) => {
  $(event.target).parent('.drop').css({
    border: '4px dashed #3023AE',
    background: 'rgba(0, 153, 255, .05)'
  });

  $(event.target).siblings('.cont').css({
    color: '#3023AE'
  });

};

const handleOut = (event) => {

  $(event.target).parent('.drop').css({
    border: '3px dashed #DADFE3',
    background: 'transparent'
  });

  $(event.target).siblings('.cont').css({
    color: '#8E99A5'
  });

};

const inEvents = ['dragenter', 'dragover'];
const outEvents = ['dragleave', 'dragend', 'mouseout', 'drop'];

inEvents.forEach(event => drop.forEach(item => item.addEventListener(event, handleIn)));
outEvents.forEach(event => drop.forEach(item => item.addEventListener(event, handleOut)));

const handleFileSelect = event => {
  try {
    const file = event.target.files[0];
    let $this = $(event.target);

    // Only process excel file.
    if (!file.type.match('officedocument.*')) {
      // continue;
      window.postMessage({
        type: 'file-error',
        data: 'Неверный тип файла!'
      }, '*');
    } else {
      // $this.siblings('.cont').css({display: 'none'});
      $this.siblings('.file_name')
        // .css({display: 'block'})
        .text('Выбран файл: ' + file.path);

      let fld = $this.get(0).name;
      files[fld] = file.path
    }

    let count = Object.keys(files).length

    if (count > 1) {
      window.postMessage({
        type: 'files-ready',
        data: files
      }, '*');
    }

    event.preventDefault();
    event.stopPropagation();
  } catch {
    window.postMessage({
      type: 'file-error',
      data: 'Файл не выбран!'
    }, '*');
  }
};


function filesReadyHandler () {
  ready_btn.disabled = false;
}

function handleReadyClick(){
  console.log('handleReadyClick');
  window.postMessage({
    type: 'start-processing',
    data: files
  }, '*');
}

src_file.addEventListener('change', handleFileSelect);
wb_file.addEventListener('change', handleFileSelect);
ready_btn.addEventListener('click', handleReadyClick);

const $progress = $('.progress'),
  $bar = $('.progress__bar'),
  $text = $('.progress__text'),
  orange = 30,
  yellow = 55,
  green = 85;

const resetColors = () => {

  $bar.removeClass('progress__bar--green')
    .removeClass('progress__bar--yellow')
    .removeClass('progress__bar--orange')
    .removeClass('progress__bar--blue');

  $progress.removeClass('progress--complete');

};

const update = (percent) => {

  percent = parseFloat(percent.toFixed(1));

  $text.find('em').text(percent + '%');

  if (percent >= 100) {

    percent = 100;
    $progress.addClass('progress--complete');
    $bar.addClass('progress__bar--blue');
    $text.find('em').text('Complete');

  } else {

    if (percent >= green) {
      $bar.addClass('progress__bar--green');
    } else if (percent >= yellow) {
      $bar.addClass('progress__bar--yellow');
    } else if (percent >= orange) {
      $bar.addClass('progress__bar--orange');
    }

  }

  $bar.css({width: percent + '%'});

};

const processStartHandler = () => {

  $progress.addClass('progress--active');
  $progress.show();
  $('.wrapper').hide();

};

const progressHandler = percentage => update(percentage);

const processCompletedHandler = ({processedItemsCount, incompatibleItems, erroneousItems, logFilePath}) => {

  $(notificationArea).find('.text').text(
    [
      `${processedItemsCount} item(s) successfully processed,`,
      `${incompatibleItems.length} item(s) skipped,`,
      `${erroneousItems.length} item(s) erroneous,`,
      `Log file ${logFilePath} is written on disk.`
    ].join('\r\n')
  );

  $(notificationArea).show().animate({
    top: '10%'
  }, 'slow');

};

const processErrorHandler = data => {

  const oldText = $(errorArea).find('.text').text();

  $(errorArea).find('.text').text(
    [
      `${oldText}`,
      `${data.itemInfo} ${data.statusText}`
    ].join('\r\n')
  );

  $(errorArea).show().animate({
    bottom: '10%'
  }, 'slow');

};

const fileErrorHandler = data => {

  $(errorArea).find('.text').text(`${data}`);

  $(errorArea).show().animate({
    bottom: '10%'
  }, 'slow');

};

const resetProcess = () => {

  resetColors();
  update(0);
  $('.wrapper').show();
  $progress.hide();

};

const errorAreaClickHandler = () => {

  $(errorArea).animate({
    bottom: 0
  }, 'slow', function () {
    $(this).hide().find('.text').text('')
  });

};

const notificationAreaClickHandler = () => {

  $(notificationArea).animate({
    top: 0
  }, 'slow', function () {
    $(this).hide().find('.text').text('')
  });

  errorAreaClickHandler();
  resetProcess();
};


errorArea.addEventListener('click', errorAreaClickHandler);

notificationArea.addEventListener('click', notificationAreaClickHandler);

const disableDrop = event => {
  // if(event.target !== filesInput) {
  //   event.preventDefault();
  //   event.stopPropagation();
  // }
};

// Prevent loading a drag-and-dropped file
['dragover', 'drop'].forEach(event => {
  document.addEventListener(event, disableDrop);
});

window.addEventListener('message', event => {
  const message = event.data;
  const {data, type} = message;

  switch (type) {
    case 'files-ready':
      filesReadyHandler();
      break;
    case 'process-started':
      processStartHandler();
      break;
    case 'process-completed':
      processCompletedHandler(data);
      break;
    case 'progress':
      progressHandler(data);
      break;
    case 'process-error':
      processErrorHandler(data);
      break;
    case 'file-error':
      fileErrorHandler(data);
  }
});
