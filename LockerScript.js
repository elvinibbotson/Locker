function id(el) {
	return document.getElementById(el);
}
'use strict';
// GLOBAL VARIABLES	
var db=null;
var items=[];
var item=null;
var itemIndex=0;
var list={};
var currentListItem=null;
var currentDialog=null;
var depth=0;
// var path=[];
var lastSave=null;
var pin='';
var keyCode=null;
var unlocked=false;
var months="JanFebMarAprMayJunJulAugSepOctNovDec";
var dragStart={};

// DRAG TO CHANGE DEPTH
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
    if((drag.x<-50)&&(depth>0)) { // drag right to decrease depth...
        // console.log('path: '+path);
        list.id=list.owner;
        // path.pop();
        depth=0;
        if(depth<1) list.id=list.owner=null;
        console.log('list.id: '+list.id+' depth: '+depth);
        loadListItems();
    }
    else if((drag.x>50)&&(currentDialog)) showDialog(currentDialog,false); // drag left to close dialogs
})

// TAP ON HEADER
id('heading').addEventListener('click',function() {
	if(depth>0) { // list heading - show item edit dialog
		id(listField.value=list.name);
		console.log('edit list header - '+items.length+' items');
		for(var i in items) console.log('item '+i+': '+items[i].text);
		if(items.length>0) {
			id('deleteListButton').style.display='none';
			console.log('disable delete');
		}
		else id('deleteListButton').style.display='block';
		id('listAddButton').style.display='none';
		id('listSaveButton').style.display='block';
		showDialog('listDialog',true);
	}
	else showDialog('dataDialog',true);
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

// ADD ITEMS
id('buttonNew').addEventListener('click', function(){
	item={};
    if(depth<1) { // top level - can only add lists
    	id('listField').value='';
    	id('deleteListButton').style.display='none';
    	id('listAddButton').style.display='block';
    	id('listSaveButton').style.display='none';
        showDialog('listDialog',true);
    }
    else { // lower level: can only add notes
    	id('noteField').value='';
    	id('deleteNoteButton').style.display='none';
    	id('noteAddButton').style.display='block';
    	id('noteSaveButton').style.display='none';
        showDialog('noteDialog',true);
    }
})

id('addListButton').addEventListener('click',function() {
	id('listField').value='';
    id('deleteListButton').style.display='none';
    id('listAddButton').style.display='block';
	id('listSaveButton').style.display='none';
    showDialog('listDialog',true);
})

id('addNoteButton').addEventListener('click',function() {
    showDialog('noteDialog',true);
})

// LIST
id('listAddButton').addEventListener('click', function() { // SPLIT INTO ADD AND SAVE FUNCTIONS
    item={};
    item.owner=list.id; // NEW
    // NO LONGER USE type -USE DEPTH INSTEAD item.type=1;
    item.text=cryptify(id('listField').value,keyCode);
    console.log('encrypt to '+item.text);
    var dbTransaction=db.transaction('items',"readwrite");
	var dbObjectStore=dbTransaction.objectStore('items');
	console.log("database ready");
	var addRequest=dbObjectStore.add(item);
	addRequest.onsuccess=function(event) {
		console.log('new list added');
		showDialog('listDialog',false);
		loadListItems();
	}
	 addRequest.onerror=function(event) {cosnole.log('error adding new list');}
})
id('listSaveButton').addEventListener('click', function() {
	list.text=cryptify(id('listField').value,keyCode);
    console.log('encrypt to '+list.text);
    var dbTransaction=db.transaction('items',"readwrite");
	var dbObjectStore=dbTransaction.objectStore('items');
    var putRequest=dbObjectStore.put(list); // WAS var putRequest=dbObjectStore.put(data);
	putRequest.onsuccess=function(event) {
		console.log('item '+list.index+" updated");
		showDialog('listDialog',false);
        loadListItems();
	};
	putRequest.onerror=function(event) {console.log("error updating item "+item.index);};
})
id('deleteListButton').addEventListener('click',function() {
	if(items.length>0) {
		display('CAN ONLY DELETE EMPTY LISTS');
		return;
	}
	var dbTransaction=db.transaction('items',"readwrite");
	var dbObjectStore=dbTransaction.objectStore('items');
	console.log("database ready to delete list item");
	console.log('delete list item '+itemIndex+' id: '+list.id); // items[itemIndex].id);
	var delRequest=dbObjectStore.delete(list.id); // items[itemIndex].id);
	delRequest.onsuccess=function() {
	    console.log('deleted from database');
	    showDialog('listDialog',false);
        depth=0;
        list.id=list.owner=null;
        console.log('list.id: '+list.id+' depth: '+depth);
        loadListItems();
	    
	}
	delRequest.onerror=function(event) {console.log('delete failed')};
    items.splice(itemIndex,1);
    console.log("delete complete");
    populateList();
    itemIndex=null;
    currentListItem=null;
})

// NOTE
id('deleteNoteButton').addEventListener('click', function() {
	var dbTransaction=db.transaction('items',"readwrite");
	var dbObjectStore=dbTransaction.objectStore('items');
	console.log("database ready to delete item");
	console.log('delete item '+itemIndex+' id: '+items[itemIndex].id);
	var delRequest=dbObjectStore.delete(items[itemIndex].id);
	delRequest.onsuccess=function() {
	    console.log('deleted from database');
	    showDialog('noteDialog',false);
	}
	delRequest.onerror=function(event) {console.log('delete failed')};
    items.splice(itemIndex,1);
    console.log("delete complete");
    populateList();
    itemIndex=null;
    currentListItem=null;
})

id('noteAddButton').addEventListener('click', function() {
    item={};
    item.owner=list.id;
    // item.type=list.type-1;
    item.text=cryptify(id('noteField').value,keyCode);
    // console.log("encrypted note: "+item.text);
    console.log('ADD new item (owner: '+item.owner+') to list '+list.id+': '+list.name);
    var dbTransaction=db.transaction('items',"readwrite");
	var dbObjectStore=dbTransaction.objectStore('items');
	console.log("database ready");
    var addRequest=dbObjectStore.add(item);
	addRequest.onsuccess=function(event) {
		item.id=event.target.result;
		console.log("new item added - id is "+item.id);
		showDialog('noteDialog',false);
    	itemIndex=null;
    	currentListItem=null;
    	loadListItems();
	}
	addRequest.onerror=function(event) {console.log("error adding new item");};
    
})

id('noteSaveButton').addEventListener('click', function() {
	item.text=cryptify(id('noteField').value,keyCode);
    console.log("encrypted note: "+item.text);
    var dbTransaction=db.transaction('items',"readwrite");
	var dbObjectStore=dbTransaction.objectStore('items');
	console.log("database ready");
	var putRequest=dbObjectStore.put(item);
	putRequest.onsuccess=function(event) {
		console.log('item updated');
		showDialog('noteDialog',false);
    	itemIndex=null;
    	currentListItem=null;
    	loadListItems();
	};
	putRequest.onerror=function(event) {console.log("error updating item "+item.index);};
})

// POPULATE LIST
function populateList(decrypt) {
    var listItem;
    id("list").innerHTML=""; // clear list
	console.log("populate list with "+items.length + " items - depth: "+depth);
	// if(path.length<1)
    id('heading').innerHTML=(depth<1)?'Locker':list.name;
	/*
	else {
	    id('heading').innerHTML=path[0];
	    var i=1;
	    while(i<path.length) {
	        id('heading').innerHTML+='.'+path[i++];
	    }
	}
	*/
	if(decrypt) for(i in items) {
		items[i].text=cryptify(items[i].text,keyCode);
		console.log('item '+i+': '+items[i].text);
	}
	items.sort(function(a,b){
		if(a.text.toUpperCase()<b.text.toUpperCase()) return -1;
		if(a.text.toUpperCase()>b.text.toUpperCase()) return 1;
		return 0;
	}); // sort alphabetically
	for(var i in items) {
	    console.log('add item '+i+': '+items[i].text);
	    // all items have text
		listItem=document.createElement('li');
		listItem.index=i;
	 	listItem.innerText=items[i].text;
		// NO LONGER USE type USE DEPTH INSTEAD if(items[i].type>0) { // tap on list to open it
		if(depth<1) { // tap on list to open it
		    listItem.addEventListener('click',function() {
	 	    	itemIndex=this.index;
	 	    	console.log('open item '+itemIndex);
		    	list.id=items[this.index].id;
		    	// list.type=items[this.index].type;
		    	list.name=items[this.index].text;
		    	list.owner=items[this.index].owner;
		    	console.log('open list '+list.name+' id:'+list.id+' owner: '+list.owner);
		    	depth++;
		    	// path.push(list.name);
		    	loadListItems();
	 		});
		    listItem.style.fontWeight='bold'; // lists are bold
		}
		else { // tap on note to edit it
			listItem.addEventListener('click',function() {
				itemIndex=this.index;
				item=items[this.index];
				console.log('edit note '+i+': '+item.text);
				id('noteField').value=item.text;
				id('deleteNoteButton').style.display='block';
				id('noteAddButton').style.display='none';
				id('noteSaveButton').style.display='block';
				// console.log('should say '+item.text+'; says '+id('noteField').value);
				showDialog('noteDialog',true);
			})
		}
		id('list').appendChild(listItem);
	}
}

// LOAD LIST ITEMS
function loadListItems() {
	console.log("load children of list.id "+list.id+" - depth: "+depth+' owner: '+list.owner);
	var dbTransaction=db.transaction('items',"readwrite");
	var dbObjectStore=dbTransaction.objectStore('items');
	console.log("database ready");
	var item={};
	if(list.id!==null) {
		console.log("get list item "+list.id);
		var request=dbObjectStore.get(list.id);
		request.onsuccess=function() {
			item=event.target.result;
			console.log("list item "+item.text+"; owner: "+item.owner);
			list.name=cryptify(item.text,keyCode);
			// NO LONGER USE type list.type=item.type; // types 1-3 only
		};
		request.onerror=function() {console.log("error retrieving item "+list.id);}
	}
	else {
	    list.name="Locker";
	    // NO LONGER USE type list.type=1;
	}
	items=[];
	request=dbObjectStore.openCursor();
	request.onsuccess=function(event) {
		var cursor=event.target.result;
		if(cursor) {
			if(cursor.value.owner==list.id) { // just items in this list
				// NO LONGER NEEDED? if(cursor.value.type>3) cursor.value.type-=4;
				items.push(cursor.value);
				console.log("item id: "+cursor.value.id+"; index: "+cursor.value.index+"; "+cursor.value.text+"; owner: "+cursor.value.owner);
			}
			cursor.continue ();
		}
		else {
			console.log("No more entries! "+items.length+" items");
			if(list.id===null) { // backup checks
				if(items.length<1) { // no data: restore backup?
				    console.log("no data - restore backup?");
				    // document.getElementById('importDialog').style.display='block';
				    showDialog('importDialog',true);
				}
				else { // monthly backups
				    var today=new Date();
				    console.log('this month: '+today.getMonth()+"; last save: "+lastSave);
				    if(today.getMonth()!=lastSave) backup();
				}
			}
			populateList(true);
		}
	}
}

// DATA
id('backupButton').addEventListener('click',function() {showDialog('dataDialog',false); backup();});
id('importButton').addEventListener('click',function() {showDialog('importDialog',true)});
/* id('dataCancelButton').addEventListener('click',function() {showDialog('dataDialog',false)}); */

// RESTORE BACKUP
id("fileChooser").addEventListener('change', function() {
	var file=id('fileChooser').files[0];
	console.log("file: "+file+" name: "+file.name);
	var fileReader=new FileReader();
	fileReader.addEventListener('load', function(evt) {
		console.log("file read: "+evt.target.result);
	  	var data=evt.target.result;
		var json=JSON.parse(data);
		console.log("json: "+json);
		var items=json.items;
		console.log(items.length+" items loaded");
		var dbTransaction=db.transaction('items',"readwrite");
		var dbObjectStore=dbTransaction.objectStore('items');
		for(var i=0;i<items.length;i++) {
			console.log("save "+items[i].text);
			var request=dbObjectStore.add(items[i]);
			request.onsuccess=function(e) {
				console.log(items.length+" items added to database");
			};
			request.onerror=function(e) {console.log("error adding item");};
		}
		showDialog('importDialog',false);
		display("data imported - restart");
  	});
  	fileReader.readAsText(file);
});

/* CANCEL RESTORE
id('cancelImportButton').addEventListener('click', function() {
    showDialog('importDialog',false);
});
*/
// BACKUP
function backup() {
  	console.log("EXPORT");
	var fileName="Locker-";
	var date=new Date();
	fileName+=date.getFullYear()+'-';
	if(date.getMonth()<9) fileName+='0'; // date format YYYYMMDD
	fileName+=(date.getMonth()+1)+'-';
	if(date.getDate()<10) fileName+='0';
	fileName+=date.getDate()+".json";
	var dbTransaction=db.transaction('items',"readwrite");
	var dbObjectStore=dbTransaction.objectStore('items');
	console.log("database ready");
	var request=dbObjectStore.openCursor();
	var items=[];
	dbTransaction=db.transaction('items',"readwrite");
	console.log("indexedDB transaction ready");
	dbObjectStore=dbTransaction.objectStore('items');
	console.log("indexedDB objectStore ready");
	request=dbObjectStore.openCursor();
	request.onsuccess=function(event) {  
		var cursor=event.target.result;  
    		if(cursor) { // read in every item
			    items.push(cursor.value);
			    cursor.continue();  
    		}
		else {
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
			var today=new Date();
			lastSave=today.getMonth();
			window.localStorage.setItem('lastSave',lastSave); // remember month of backup
		}
	}
}

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
        	unlocked=true;
        	showDialog('keyDialog',false);
        	loadListItems(); // WAS IN startup
        	return true;
    	}
    	else {
    		id('pinField').innerText='';
			pin='';
    	}
    	/*
    	else keyCode=null;
    	showDialog('keyDialog',false);
    	console.log("key is "+keyCode);
    	return false;
    	*/
	}
}  
/*
function keyCheck() {
    console.log('KEY CHECK');
    if(unlocked) return true;
    id('keyTitle').innerText='enter key';
    id('keyCheck').value=keyCode;
    showDialog('keyDialog',true);
}
*/
// START-UP CODE
lastSave=window.localStorage.getItem('lastSave');
keyCode=window.localStorage.keyCode; // load any saved key
console.log("last save: "+lastSave+"; saved key: "+keyCode);
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
// load items from database
var request=window.indexedDB.open("LockerDB");
request.onsuccess=function (event) {
	db=event.target.result;
	console.log("DB open");
	list.id=list.owner=null;
};
request.onupgradeneeded=function(event) {
	db=event.currentTarget.result;
	if(!db.objectStoreNames.contains('items')) {
		var dbObjectStore=db.createObjectStore("items",{ keyPath:"id",autoIncrement:true });
		console.log("items store created");
	}
	else console.log("items store exists");
	console.log("database ready");
}
request.onerror=function(event) {
	alert("indexedDB error code "+event.target.errorCode);
};
	
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