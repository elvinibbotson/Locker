function id(el) {
	return document.getElementById(el);
}
'use strict';
// GLOBAL VARIABLES	
var items=[];
var item=null;
var categories=[];
var category=null;
var itemIndex=0;
var listItems=[];
var listItem=null;
var currentDialog=null;
var pin='';
var keyCode=null;
var dragStart={};
var root; // OPFS root directory
// DRAG TO RETURN TO CATEGORY LIST
id('main').addEventListener('touchstart', function(event) {
    // console.log(event.changedTouches.length+" touches");
    dragStart.x=event.changedTouches[0].clientX;
    dragStart.y=event.changedTouches[0].clientY;
})
id('main').addEventListener('touchend', function(event) {
    var drag={};
    drag.x=dragStart.x-event.changedTouches[0].clientX;
    drag.y=dragStart.y-event.changedTouches[0].clientY;
    if(Math.abs(drag.y)>50) return; // ignore vertical drags
    if((drag.x<-50)&&category) {
        category=null;
        listCategories();
    }
    else if((drag.x>50)&&(currentDialog)) showDialog(currentDialog,false); // drag left to close dialogs
})
// TAP ON HEADER
id('heading').addEventListener('click',function() {
	if(category===null) showDialog('dataDialog',true);
});
// DISPLAY MESSAGE
function display(message) {
	id('message').innerText=message;
	showDialog('messageDialog',true);
}
// SHOW/HIDE DIALOG
function showDialog(dialog,show) {
    console.log('show '+dialog+': '+show);
    if(currentDialog) id(currentDialog).style.display='none';
    if(show) {
        id(dialog).style.display='block';
        currentDialog=dialog;
        id('buttonNew').style.display='none';
    }
    else {
        id(dialog).style.display='none';
        currentDialog=null;
        id('buttonNew').style.display='block';
    }
}
// NEW CATEGORY/NOTE
id('buttonNew').addEventListener('click', function(){
	item={};
    if(category==null) { // add new category
    	id('categoryField').value='';
    	id('addCategoryButton').style.display='block';
        showDialog('categoryDialog',true);
    }
    else { // add note
    	id('noteField').value='';
    	id('deleteNoteButton').style.display='none';
    	id('addNoteButton').style.display='block';
    	id('saveNoteButton').style.display='none';
        showDialog('noteDialog',true);
    }
})
id('addCategoryButton').addEventListener('click',function() {
	category=id('categoryField').value;
	if(category.length<1) return; // no category name
	if(categories.indexOf('category')>=0) return; // category already exists
	list.innerHTML='';
	id('header').innerText=category;
	showDialog('categoryDialog',false);
	console.log('new category - '+category);
})
id('addNoteButton').addEventListener('click', function() {
	console.log('add note '+id('noteField').value);
    item={};
    item.category=category;
    item.text=cryptify(id('noteField').value,keyCode);
    console.log('encrypted to '+item.text);
    items.push(item);
    writeData(); // WAS saveData();
    itemIndex=null;
    showDialog('noteDialog',false);
    listCategoryItems();
    console.log('note added');
})
// EDIT NOTE
id('saveNoteButton').addEventListener('click', function() {
	console.log('update item '+itemIndex);
	itemIndex=listItems[itemIndex].index;
	console.log('ie. item '+itemIndex);
	item={};
    item.category=category;
    item.text=cryptify(id('noteField').value,keyCode);
    console.log("encrypted note: "+item.text);
    items[itemIndex]=item;
    writeData(); // WAS saveData();
    console.log('note updated');
    showDialog('noteDialog',false);
    listCategoryItems();
})
id('deleteNoteButton').addEventListener('click', function() {
	console.log('delete item '+itemIndex);
	itemIndex=listItems[itemIndex].index;
	console.log('ie. item '+itemIndex);
    items.splice(itemIndex,1);
    writeData(); // WAS saveData();
    console.log("delete complete");
    showDialog('noteDialog',false);
    listCategoryItems();
    itemIndex=null;
})
// LIST CATEGORIES
function listCategories() {
	console.log('list categories');
	listItem;
	id("list").innerHTML=""; // clear list
	categories.sort(function(a,b){ // sort alphabetically
		if(a.toUpperCase()<b.toUpperCase()) return -1;
		if(a.toUpperCase()>b.toUpperCase()) return 1;
		return 0;
	});
	for(var i in categories) {
		console.log('list '+categories[i]);
		listItem=document.createElement('li');
		listItem.index=i;
		listItem.innerText=categories[i];
		listItem.addEventListener('click',function() {
			itemIndex=this.index;
			console.log('open item '+itemIndex);
			category=categories[this.index];
			console.log('list category '+categories[this.index]);
			listCategoryItems();
		});
		listItem.style.fontWeight='bold'; // lists are bold
		id('list').appendChild(listItem);
	}
	id('heading').innerText='Locker';
}
// LIST ITEMS IN CATEGORY
function listCategoryItems() {
	console.log('list items in category '+category);
	listItems=[];
	id("list").innerHTML=""; // clear list
	for(var i in items) {
		console.log('item '+i+' category: '+items[i].category);
		if(items[i].category==category) {
			listItem={};
			listItem.index=i;
			listItem.text=cryptify(items[i].text,keyCode);
			listItems.push(listItem);
		}
	}
	listItems.sort(function(a,b){ // sort alphabetically
		if(a.text.toUpperCase()<b.text.toUpperCase()) return -1;
		if(a.text.toUpperCase()>b.text.toUpperCase()) return 1;
		return 0;
	});
	for(i in listItems) {
		console.log('list '+listItems[i].text);
		listItem=document.createElement('li');
		listItem.index=i;
		listItem.innerText=listItems[i].text;
		listItem.addEventListener('click',function() {
			itemIndex=this.index;
			item=listItems[this.index];
			console.log('edit note '+i+': '+item.text);
			id('noteField').value=item.text;
			id('deleteNoteButton').style.display='block';
			id('addNoteButton').style.display='none';
			id('saveNoteButton').style.display='block';
			showDialog('noteDialog',true);
		});
		id('list').appendChild(listItem);
	}
	id('heading').innerText=category;
}
// DATA
async function readData() {
	root=await navigator.storage.getDirectory();
	console.log('OPFS root directory: '+root);
	var persisted=await navigator.storage.persist();
	console.log('persisted: '+persisted);
	var handle=await root.getFileHandle('LockerData');
	var file=await handle.getFile();
	var loader=new FileReader();
    loader.addEventListener('load',function(evt) {
    	var data=evt.target.result;
    	console.log('data: '+data.length+' bytes');
    	items=JSON.parse(data);
		categories=[];
		for(var i in items) {
			if(categories.indexOf(items[i].category)<0) categories.push(items[i].category);
		}
		console.log(items.length+' items loaded; '+categories.length+' categories');
		category=null;
	});
	loader.addEventListener('error',function(event) {
    	alert('load failed - '+event);
	});
	loader.readAsText(file);
}
async function writeData() {
	var data=JSON.stringify(items);
	var handle=await root.getFileHandle('LockerData',{create:true});
	var writable=await handle.createWritable();
    await writable.write(data);
    await writable.close();
	console.log('data saved to LockerData');
}
id('backupButton').addEventListener('click',function() {showDialog('dataDialog',false); backup();});
id('importButton').addEventListener('click',function() {showDialog('importDialog',true)});
id("fileChooser").addEventListener('change', function() {
	var file=id('fileChooser').files[0];
	console.log("file: "+file+" name: "+file.name);
	var fileReader=new FileReader();
	fileReader.addEventListener('load', function(evt) {
		console.log("file read: "+evt.target.result);
	  	var data=evt.target.result;
		var json=JSON.parse(data);
		console.log("json: "+json);
		items=json.items;
		console.log(items.length+" items loaded - first is "+items[0].text+' category '+items[0].category);
		writeData(); // WAS saveData();
		showDialog('importDialog',false);
		display("data imported - restart");
  	});
  	fileReader.readAsText(file);
});
function backup() {
  	console.log("EXPORT");
	var fileName="LockerData.json";
	console.log(items.length+" items - save");
	var data={'items': items};
	var json=JSON.stringify(data);
	var blob=new Blob([json], {type:"data:application/json"});
  	var a=document.createElement('a');
	a.style.display='none';
    var url=window.URL.createObjectURL(blob);
	console.log("data ready to save: "+blob.size+" bytes");
   	a.href=url;
   	a.download=fileName;
    document.body.appendChild(a);
    a.click();
	display(fileName+" saved to downloads folder");
}
/*
function saveData() {
	var data=JSON.stringify(items);
	window.localStorage.setItem('items',data);
	console.log('data saved');
}
*/
// ENCRYPT/DECRYPT TEXT USING KEY
function cryptify(value,key) {
	var i=0;
	var result="";
	var k;
	var v;
	for (i=0;i<value.length;i++) {
		k=key.charCodeAt(i%key.length);
		v=value.charCodeAt(i);
		result+=String.fromCharCode(k ^ v);
	}
	return result;
};
// KEY CHECK
function tapKey(n) {
	if(n=='<') {
		console.log('BACKSPACE');
		var l=pin.length;
		if(l>0) pin=pin.substr(0,l-1);
		console.log('pin: '+pin);
		id('pinField').innerHTML='';
		while(l>1) {
			id('pinField').innerHTML+='*';
			l--;
		}
		return false;
	}
	pin+=n;
	id('pinField').innerHTML+='*';
	console.log('pin: '+pin);
	if(pin.length>3) { // 4 digits entered
		console.log("keyCode: "+keyCode);
		console.log("check: "+id('keyCheck').value);
		if(keyCode===null) { // set keyCode - step 1
			keyCode=pin;
			id('keyCheck').value=pin;
			id('pinField').innerText='';
			pin='';
			id('keyTitle').innerText='confirm PIN';
        	return;
    	}
    	else if(pin==id('keyCheck').value) { // set keyCode step 2 or unlock
        	window.localStorage.keyCode=cryptify(pin,'secrets');
        	// unlocked=true;
        	showDialog('keyDialog',false);
        	listCategories();
        	return true;
    	}
    	else {
    		id('pinField').innerText='';
			pin='';
    	}
	}
}  
// START-UP CODE
keyCode=window.localStorage.keyCode; // load any saved key
console.log("saved key: "+keyCode);
if(!keyCode) { // first use - set a PIN
	console.log('set new PIN');
    keyCode=null;
    id('keyTitle').innerText='set a PIN';
    id('pinField').innerText='';
    pin='';
    showDialog('keyDialog',true);
}
else { // start-up - enter PIN
	console.log('encrypted keyCode: '+keyCode);
	keyCode=cryptify(keyCode,'secrets'); // saved key was encrypted
	console.log("decoded keyCode: "+keyCode);
	id('keyTitle').innerText='PIN';
	id('pinField').innerText='';
	pin='';
    id('keyCheck').value=keyCode;
    showDialog('keyDialog',true);
}
readData();
/*
var data=window.localStorage.getItem('items');
var items=JSON.parse(data);
categories=[];
for(var i in items) {
	if(categories.indexOf(items[i].category)<0) categories.push(items[i].category);
}
console.log(items.length+' items loaded; '+categories.length+' categories');
category=null;
*/
// implement service worker if browser is PWA friendly
if (navigator.serviceWorker.controller) {
	console.log('Active service worker found, no need to register')
} else { //Register the ServiceWorker
	navigator.serviceWorker.register('sw.js', {
		scope: '/Locker/'
	}).then(function(reg) {
		console.log('Service worker has been registered for scope:'+ reg.scope);
	});
}