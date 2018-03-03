var filedbid = "1DGxWAaaZFvgRXvrEo8H7hXNufT0kYfCvpaY3Yq_LXxA";
var filetable = SpreadsheetApp.openById(filedbid);


/*
================================ DOGET =====================================
This functions gets called when the pages loads every time.
============================================================================
*/
function doGet(e) {
  Logger.log("Opening page...");  
  parameter = e.parameter;
  var page= e.parameter.page;
  if(!page){
    page = 'index';
  }
  
  Logger.log(page);
  var html = HtmlService.createTemplateFromFile(page).evaluate();
  html.addMetaTag('viewport', 'width=device-width, initial-scale=1');
  return html;
}

/*
=============================== INCLUDE ====================================
this function let you include other files' content in your index.html
============================================================================
*/
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename)
      .getContent();
}

/* 
=========================== DATAINTOHASHROWS ===============================
Any time you get some rows from a google sheet, run it through this function
so that it uses the column names as keys, instead of just numbers.
data : the data from the sheet
keysRow : the row that holds the column names (starts a 0, NOT 1)
startsRow : the row that holds the FIRST row of data (starts a 0, NOT 1)
filterFunction: a function that gets a row of data (with the column names as
keys), and returns true or false, based on whatever criteria you want.
============================================================================
*/
function dataIntoHashRows(data, keysRow, startRow, filterFunction){
  var idKey= {};
  var keyId= {};
  var newData = [];
  Logger.log("data");

  for (var k = 0; k < data[keysRow].length; k++) { 
    var key = data[keysRow][k];
    key = key.replace("?","");
    key = key.replace("'","");
    key = key.replace(":","");
    if(key.trim() == ""){
       continue;
    }
    
    idKey[k] = key;
    keyId[key] = k;
  }
    
  for (var i = startRow; i < data.length; i++) { 
    var newRow = {};
    for (var j = 0; j < data[i].length; j++) { 
      if(!idKey[j] || idKey[j].trim() == ""){
        continue; 
      }
      newRow[idKey[j]] = data[i][j];
    }
    if(!filterFunction || filterFunction(newRow) == true){
      newData.push(newRow);
    }
  }
  
  return {data:newData, keyId: keyId, idKey: idKey};
  
}

/* 
============================ INSERTHASHROW =================================
Insert a new row into a sheet. Use column names as keys. You don't have to 
have blank columns in the row
table: the google sheets object
data: the row, with column names as keys
keysrow: which row of the table holds the column names (starts a 0, NOT 1)
============================================================================
*/
function insertHashRow(table, data, keysrow){
  var insertArray = [];
  var idKey= {};
  var keyId= {};
    
  var range = "A"+(keysrow+1).toString() +":"+(keysrow+1).toString();

  tableMetaData = table
  .getActiveSheet()
  .getRange(range)
  .getValues();  
  
  for (var k = 0; k < tableMetaData[0].length; k++) { 
    var key = tableMetaData[0][k];
    // key is text, k is number
    if(key.trim() == ""){
       continue;
    }
    insertArray.push(""); 
    idKey[k] = key;
    keyId[key] = k;
  }
   
  datakeys = Object.keys(data);

  for(var i = 0; i < datakeys.length; i++){
    var key = datakeys[i];
    var k = keyId[key];
    insertArray[k] = data[key];
  }
  
  table.getActiveSheet().appendRow(insertArray);
}

/* 
============================ UPDATEHASHROW =================================
update a row in a sheet. Use column names as keys.  
table: the google sheets object
data: the row, with column names as keys. Missing columns will be updated to 
blank, NOT left alone.
keysrow: which row of the table holds the column names (starts a 0, NOT 1)
updateKey: object {key: column Name of identifying key of row to update 
(eg 'NetId'), value : value for that cell in that row (eg 'dhu3')
============================================================================
*/
function updateHashRow(table, data, keysrow, updateKey){
  Logger.log("updating2");
  var insertArray = [];
  var idKey= {};
  var keyId= {};
    
  var range = "A"+(keysrow+1).toString() +":"+(keysrow+1).toString();

  tableMetaData = table
  .getActiveSheet()
  .getRange(range)
  .getValues();  
  
  for (var k = 0; k < tableMetaData[0].length; k++) { 
    var key = tableMetaData[0][k];
    // key is text, k is number
    if(key.trim() == ""){
       continue;
    }
    insertArray.push(""); 
    idKey[k] = key;
    keyId[key] = k;
  }
   
  datakeys = Object.keys(data);

  for(var i = 0; i < datakeys.length; i++){
    var key = datakeys[i];
    var k = keyId[key];
    insertArray[k] = data[key];
  }
  
  var index = findRowNumForQuery(table, keysrow, keysrow + 1, function(row){
    if(row[updateKey.key] == updateKey.value){
      return true;
    }else{
      return false;
    }
  });
    
  var toDelete = index + 1;
  
  if(index){
    table.getActiveSheet().deleteRow(toDelete);
  }
  table.getActiveSheet().appendRow(insertArray);
  
  return index;
  
}


function findRowNumForQuery(table, keysRow, startRow, queryFunction){
  var tableData = table.getActiveSheet().getDataRange().getValues();

  var data = dataIntoHashRows(tableData, keysRow, startRow).data;
    
  for (var i = 0; i < data.length; i++) { 
    var res = queryFunction(data[i]);
    if(res == true){
      return i + startRow;
    }
  }
  return false;
}


function getImageUrl(imagename){
  var results = PicasaApp.find(imagename);
  if(results.length > 0){
    return results[0].getUrl();
  }
  return false;
}


function uploadFileToGoogleDrive(data, file, text) {

  Logger.log("got file upload");
  Logger.log(file);
  Logger.log(text);
  try {

  var now = new Date();
  var date = now.getDate();
  var month = now.getMonth() + 1; 
  var year = now.getFullYear();
  var hour = now.getHours();
  var minute = now.getMinutes();
  var seconds = now.getSeconds();
  var timestamp = month + "/" + date + "/" + year + " " + hour + ":" + minute + ":" + seconds;
    
    
    var dropbox = "SlideshowAndUploaderImages";
    var folder, folders = DriveApp.getFoldersByName(dropbox);

    if (folders.hasNext()) {
      folder = folders.next();
    } else {
      folder = DriveApp.createFolder(dropbox);
    }

    var contentType = data.substring(5,data.indexOf(';')),
        bytes = Utilities.base64Decode(data.substr(data.indexOf('base64,')+7)),
        blob = Utilities.newBlob(bytes, contentType, file);

    folder.createFile(blob);

    // also add row to table.
    
    insertHashRow(filetable, {timestamp: timestamp, filename: file, description: text}, 0);
    
    return "OK";

  } catch (f) {
    return f.toString();
  }

}


function saveImage(){
  
}

function getAllFileData(){
  var allFileData = filetable
  .getActiveSheet()
  .getDataRange()
  .getValues();
 
  var fileData = dataIntoHashRows(allFileData, 0, 1); //, function(row){ return row['NetId'] == netId;}).data;  
  
  Logger.log(fileData);
  
  for( var i = 0; i < fileData.data.length ; i++){
    var name = fileData.data[i].filename;
    
  }
  
  return JSON.parse(JSON.stringify(fileData));
}

function getFileBlob(filename){
  //https://developers.google.com/apps-script/reference/base/blob
 Logger.log("looking for " + filename);
 var files = DriveApp.getFilesByName(filename);
 while (files.hasNext()) {
   var file = files.next();
   var blob = file.getBlob();
   Logger.log("got blob");
   return  { blob: blob.getBytes(),
             contentType : blob.getContentType()
           };
 } 
 Logger.log("returning false");
 return false;
}
